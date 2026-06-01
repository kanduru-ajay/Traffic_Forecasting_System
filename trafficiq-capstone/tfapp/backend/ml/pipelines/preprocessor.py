import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import json


class DataPreprocessor:
    """Cleans, validates, and feature-engineers traffic CSV data."""

    def __init__(self, dataset):
        self.dataset = dataset
        self.log = []

    def run(self):
        try:
            df = pd.read_csv(self.dataset.file_path)
            self.log.append(f"Loaded {len(df)} rows, {len(df.columns)} columns")

            df = self._clean(df)
            df = self._engineer_features(df)

            # Save stats
            self.dataset.row_count = len(df)
            self.dataset.column_count = len(df.columns)
            self.dataset.columns = list(df.columns)
            self.dataset.feature_stats = self._compute_stats(df)
            self.dataset.preprocessing_log = self.log
            self.dataset.status = "ready"
        except Exception as e:
            self.dataset.status = "error"
            self.dataset.preprocessing_log = self.log + [f"ERROR: {str(e)}"]
        finally:
            self.dataset.save()

    def _clean(self, df):
        original_len = len(df)
        # Drop full duplicates
        df = df.drop_duplicates()
        self.log.append(f"Removed {original_len - len(df)} duplicate rows")

        # Parse datetime
        datetime_cols = [c for c in df.columns if "time" in c.lower() or "date" in c.lower()]
        if datetime_cols:
            df[datetime_cols[0]] = pd.to_datetime(df[datetime_cols[0]], errors="coerce")
            df = df.dropna(subset=[datetime_cols[0]])
            df = df.sort_values(datetime_cols[0])
            self.log.append(f"Parsed datetime column: {datetime_cols[0]}")

        # Fill missing numerics with interpolation
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].interpolate(method="linear", limit_direction="both")
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

        # Remove outliers (IQR method) on volume/count cols
        for col in [c for c in numeric_cols if "volume" in c.lower() or "count" in c.lower()]:
            Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
            IQR = Q3 - Q1
            df = df[(df[col] >= Q1 - 3 * IQR) & (df[col] <= Q3 + 3 * IQR)]

        self.log.append(f"After cleaning: {len(df)} rows")
        return df

    def _engineer_features(self, df):
        datetime_cols = df.select_dtypes(include=["datetime64"]).columns
        if len(datetime_cols) == 0:
            return df

        dt_col = datetime_cols[0]
        # Time features
        df["hour"] = df[dt_col].dt.hour
        df["day_of_week"] = df[dt_col].dt.dayofweek
        df["day_of_month"] = df[dt_col].dt.day
        df["month"] = df[dt_col].dt.month
        df["week_of_year"] = df[dt_col].dt.isocalendar().week.astype(int)
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["is_peak_hour"] = df["hour"].isin([7, 8, 9, 17, 18, 19]).astype(int)

        # Cyclical encoding
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
        df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
        df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

        # Lag & rolling features on numeric target-like columns
        volume_cols = [c for c in df.select_dtypes(include=[np.number]).columns
                       if "volume" in c.lower() or "count" in c.lower() or "flow" in c.lower()]
        for col in volume_cols[:2]:  # limit to 2
            for lag in [1, 2, 3, 6, 12, 24]:
                df[f"{col}_lag_{lag}"] = df[col].shift(lag)
            for window in [3, 6, 12, 24]:
                df[f"{col}_roll_mean_{window}"] = df[col].rolling(window).mean()
                df[f"{col}_roll_std_{window}"] = df[col].rolling(window).std()

        df = df.fillna(df.median(numeric_only=True))
        self.log.append(f"Engineered {len(df.columns)} features total")
        return df

    def _compute_stats(self, df):
        numeric = df.select_dtypes(include=[np.number])
        stats = {}
        for col in numeric.columns[:20]:  # cap columns
            stats[col] = {
                "mean": round(float(numeric[col].mean()), 4),
                "std": round(float(numeric[col].std()), 4),
                "min": round(float(numeric[col].min()), 4),
                "max": round(float(numeric[col].max()), 4),
                "missing": int(numeric[col].isna().sum()),
            }
        return stats

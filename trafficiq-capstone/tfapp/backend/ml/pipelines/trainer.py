import os
import pickle
import uuid
import numpy as np
import pandas as pd
from django.conf import settings
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import tensorflow as tf
    LSTM_AVAILABLE = True
except ImportError:
    LSTM_AVAILABLE = False


class ModelTrainer:
    """Train multiple models, evaluate with TimeSeriesSplit, pick best."""

    ALGORITHMS = {
        "linear_regression": LinearRegression,
        "random_forest": RandomForestRegressor,
        "xgboost": None,
        "lstm": None,
    }

    def __init__(self, dataset, user, algorithms, target_column, feature_columns=None, hyperparameters=None):
        self.dataset = dataset
        self.user = user
        self.algorithms = algorithms
        self.target_column = target_column
        self.feature_columns = feature_columns
        self.hyperparameters = hyperparameters or {}
        self.model_dir = os.path.join(settings.MEDIA_ROOT, "models")
        os.makedirs(self.model_dir, exist_ok=True)

    def load_data(self):
        df = pd.read_csv(self.dataset.file_path)
        # Drop datetime cols
        df = df.select_dtypes(exclude=["datetime64", "object"])
        if self.target_column not in df.columns:
            raise ValueError(f"Target column '{self.target_column}' not found")

        feature_cols = self.feature_columns or [c for c in df.columns if c != self.target_column]
        X = df[feature_cols].fillna(0)
        y = df[self.target_column].fillna(0)
        return X, y, feature_cols

    def compute_metrics(self, y_true, y_pred):
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2 = float(r2_score(y_true, y_pred))
        mape = float(np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100)
        return {"mae": mae, "rmse": rmse, "r2": r2, "mape": mape}

    def train_sklearn(self, algo_name, model_cls, X, y, feature_cols, hp):
        from apps.mlmodels.models import TrainedModel
        tscv = TimeSeriesSplit(n_splits=5)
        all_metrics = []
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        for fold, (train_idx, val_idx) in enumerate(tscv.split(X_scaled)):
            X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            m = model_cls(**hp)
            m.fit(X_train, y_train)
            preds = m.predict(X_val)
            all_metrics.append(self.compute_metrics(y_val.values, preds))

        # Final train on all data
        final_model = model_cls(**hp)
        final_model.fit(X_scaled, y)

        avg_metrics = {k: float(np.mean([m[k] for m in all_metrics])) for k in all_metrics[0]}

        # Feature importance
        fi = {}
        if hasattr(final_model, "feature_importances_"):
            fi = dict(zip(feature_cols, final_model.feature_importances_.tolist()))
        elif hasattr(final_model, "coef_"):
            fi = dict(zip(feature_cols, final_model.coef_.tolist()))

        # Save model
        model_path = os.path.join(self.model_dir, f"{uuid.uuid4()}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump({"model": final_model, "scaler": scaler, "features": feature_cols}, f)

        db_model = TrainedModel.objects.create(
            user=self.user,
            dataset=self.dataset,
            name=f"{algo_name.replace('_', ' ').title()} - {self.dataset.name}",
            algorithm=algo_name,
            status="ready",
            hyperparameters=hp,
            feature_columns=feature_cols,
            target_column=self.target_column,
            model_path=model_path,
            mae=avg_metrics["mae"],
            rmse=avg_metrics["rmse"],
            r2=avg_metrics["r2"],
            mape=avg_metrics["mape"],
            feature_importance=fi,
            training_log=[f"Fold {i+1}: MAE={m['mae']:.4f}" for i, m in enumerate(all_metrics)],
        )
        return db_model

    def train_xgboost(self, X, y, feature_cols, hp):
        from apps.mlmodels.models import TrainedModel
        if not XGBOOST_AVAILABLE:
            return None
        defaults = {"n_estimators": 200, "max_depth": 6, "learning_rate": 0.05,
                    "subsample": 0.8, "colsample_bytree": 0.8, "random_state": 42}
        defaults.update(hp)
        model = xgb.XGBRegressor(**defaults)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        tscv = TimeSeriesSplit(n_splits=5)
        all_metrics = []
        for train_idx, val_idx in tscv.split(X_scaled):
            model.fit(X_scaled[train_idx], y.iloc[train_idx])
            preds = model.predict(X_scaled[val_idx])
            all_metrics.append(self.compute_metrics(y.iloc[val_idx].values, preds))

        model.fit(X_scaled, y)
        avg = {k: float(np.mean([m[k] for m in all_metrics])) for k in all_metrics[0]}
        fi = dict(zip(feature_cols, model.feature_importances_.tolist()))

        model_path = os.path.join(self.model_dir, f"{uuid.uuid4()}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump({"model": model, "scaler": scaler, "features": feature_cols}, f)

        from apps.mlmodels.models import TrainedModel
        return TrainedModel.objects.create(
            user=self.user, dataset=self.dataset,
            name=f"XGBoost - {self.dataset.name}",
            algorithm="xgboost", status="ready",
            hyperparameters=defaults, feature_columns=feature_cols,
            target_column=self.target_column, model_path=model_path,
            mae=avg["mae"], rmse=avg["rmse"], r2=avg["r2"], mape=avg["mape"],
            feature_importance=fi,
        )

    def train_all(self):
        X, y, feature_cols = self.load_data()
        trained = []

        for algo in self.algorithms:
            hp = self.hyperparameters.get(algo, {})
            try:
                if algo == "linear_regression":
                    m = self.train_sklearn("linear_regression", LinearRegression, X, y, feature_cols, hp)
                elif algo == "random_forest":
                    defaults = {"n_estimators": 100, "max_depth": 10, "random_state": 42, "n_jobs": -1}
                    defaults.update(hp)
                    m = self.train_sklearn("random_forest", RandomForestRegressor, X, y, feature_cols, defaults)
                elif algo == "xgboost":
                    m = self.train_xgboost(X, y, feature_cols, hp)
                else:
                    continue
                if m:
                    trained.append(m)
            except Exception as e:
                print(f"Training {algo} failed: {e}")

        # Mark best by lowest MAE
        if trained:
            best = min(trained, key=lambda m: m.mae or float("inf"))
            best.is_best = True
            best.save()

        return trained

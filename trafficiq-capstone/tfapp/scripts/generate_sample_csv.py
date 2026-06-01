#!/usr/bin/env python
"""Generate a sample traffic CSV for testing."""
import pandas as pd
import numpy as np

np.random.seed(42)
periods = 8760  # 1 year hourly
dates = pd.date_range("2023-01-01", periods=periods, freq="h")

df = pd.DataFrame({
    "timestamp": dates,
    "volume": (
        1000
        + 400 * np.sin(2 * np.pi * dates.hour / 24)           # daily pattern
        + 200 * np.sin(2 * np.pi * dates.dayofweek / 7)       # weekly pattern
        + 100 * np.sin(2 * np.pi * dates.month / 12)          # seasonal
        + np.random.normal(0, 80, periods)
    ).clip(0).astype(int),
    "speed_kmh": (60 - 20 * np.sin(2 * np.pi * dates.hour / 24) + np.random.normal(0, 5, periods)).clip(10, 120).round(1),
    "occupancy_pct": (30 + 15 * np.sin(2 * np.pi * dates.hour / 24) + np.random.normal(0, 5, periods)).clip(0, 100).round(1),
    "location": np.random.choice(["NH48_KM10", "ECR_KM5", "OMR_KM20", "GST_KM3"], periods),
})

df.to_csv("sample_traffic_data.csv", index=False)
print(f"Generated: sample_traffic_data.csv ({len(df)} rows)")

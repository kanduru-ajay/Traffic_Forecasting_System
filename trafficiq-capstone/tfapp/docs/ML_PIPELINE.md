# ML Pipeline Design

## Overview
```
CSV Upload → Preprocessing → Feature Engineering → Training → Evaluation → Forecasting → Insights
```

## Stage 1 – Preprocessing (DataPreprocessor)
1. Load CSV with pandas
2. Parse datetime columns (auto-detect)
3. Sort by timestamp
4. Drop duplicates
5. Interpolate missing numeric values (linear)
6. Remove outliers via IQR (3× IQR threshold) on volume/count cols
7. Log all steps for audit trail

## Stage 2 – Feature Engineering
| Feature Group     | Features |
|-------------------|----------|
| Time              | hour, day_of_week, day_of_month, month, week_of_year |
| Binary            | is_weekend, is_peak_hour (7-9am, 5-7pm) |
| Cyclical encoding | hour_sin/cos, dow_sin/cos, month_sin/cos |
| Lag features      | lag_1, lag_2, lag_3, lag_6, lag_12, lag_24 |
| Rolling features  | roll_mean_3/6/12/24, roll_std_3/6/12/24 |

## Stage 3 – Training (ModelTrainer)
- Cross-validation: `TimeSeriesSplit(n_splits=5)` — no data leakage
- Scaling: `StandardScaler` fitted on train folds only
- Algorithms: LR, RF, XGBoost (+ optional LSTM)
- Hyperparameters: passed per-algorithm; defaults tuned for traffic data

## Stage 4 – Evaluation & Model Selection
| Metric | Description |
|--------|-------------|
| MAE    | Mean Absolute Error — primary selection metric |
| RMSE   | Root Mean Square Error — penalizes large errors |
| R²     | Coefficient of determination |
| MAPE   | Mean Absolute Percentage Error |

Auto-selection: model with lowest MAE across CV folds → `is_best = True`

## Stage 5 – Forecasting (Forecaster)
- Loads pickled model + scaler from disk
- Generates `steps` future timestamps at chosen `horizon`
- Produces prediction intervals (grows with forecast horizon)
- Returns: `[{timestamp, predicted, lower, upper}]`

## Stage 6 – Insight Engine
| Insight Type | Detection Logic |
|--------------|-----------------|
| Peak         | predicted > 80th percentile |
| Hotspot      | ≥3 consecutive high-traffic periods |
| Anomaly      | >50% spike between consecutive steps |
| Suggestion   | Periods < 20th percentile = travel window |
| Trend        | (future) slope analysis over rolling window |

## LSTM Extension (Optional)
```
Input → (batch, timesteps, features)
    → LSTM(128, return_sequences=True)
    → Dropout(0.2)
    → LSTM(64)
    → Dropout(0.2)
    → Dense(32, activation='relu')
    → Dense(1)
Loss: MSE | Optimizer: Adam(lr=0.001) | EarlyStopping(patience=10)
```
Enable by: installing tensorflow, setting `LSTM_AVAILABLE=True`, adding "lstm" to algorithm list.

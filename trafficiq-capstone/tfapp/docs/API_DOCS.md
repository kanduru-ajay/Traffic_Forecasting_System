# Traffic Forecasting System – REST API Reference

Base URL: `http://localhost:8000/api`  
Auth: Bearer JWT (all endpoints except `/auth/register/` and `/auth/login/`)

---

## Auth

### POST /auth/register/
Register new user.
```json
{ "username": "alice", "email": "alice@ex.com", "password": "pass1234", "role": "user" }
```
Response `201`: `{ id, username, email, role, created_at }`

### POST /auth/login/
Obtain JWT token pair.
```json
{ "username": "alice", "password": "pass1234" }
```
Response `200`: `{ access, refresh }` — JWT payload includes `role`, `username`

### POST /auth/token/refresh/
```json
{ "refresh": "<refresh_token>" }
```
Response `200`: `{ access }`

### GET /auth/profile/
Returns authenticated user profile.

---

## Datasets

### GET /datasets/
List datasets (own for user, all for admin). Paginated.

### POST /datasets/upload/
Upload CSV. `Content-Type: multipart/form-data`
| Field  | Type   | Required |
|--------|--------|----------|
| file   | File   | ✓        |
| name   | String | ✓        |

Response `201`: Dataset object including `status`, `row_count`, `columns`, `preprocessing_log`

### GET /datasets/{id}/
Dataset detail.

### DELETE /datasets/{id}/
Delete dataset and associated file.

---

## Models

### POST /models/train/
Train one or more algorithms on a dataset.
```json
{
  "dataset_id": 1,
  "algorithms": ["linear_regression", "random_forest", "xgboost"],
  "target_column": "volume",
  "feature_columns": ["hour", "day_of_week", "volume_lag_1"],
  "hyperparameters": {
    "random_forest": { "n_estimators": 200 }
  }
}
```
Response `201`: Array of TrainedModel objects. Best model flagged with `is_best: true`.

### GET /models/
List trained models. Query params: `dataset_id`, page.

### GET /models/{id}/
Model detail + feature importance + training log.

### GET /models/best/{dataset_id}/
Returns best model for a dataset (lowest MAE).

### DELETE /models/{id}/

---

## Predictions

### POST /predictions/forecast/
Generate forecast.
```json
{
  "model_id": 3,
  "horizon": "hourly",
  "steps": 24,
  "confidence_interval": 0.95
}
```
Response `201`:
```json
{
  "id": 7,
  "horizon": "hourly",
  "steps": 24,
  "forecast_data": [
    { "timestamp": "2024-01-15T09:00:00", "predicted": 1250.5, "lower": 1180.2, "upper": 1320.8, "step": 1 },
    ...
  ]
}
```

### GET /predictions/
List predictions. Query params: `model_id`, `horizon`.

### GET /predictions/{id}/

---

## Insights

### POST /insights/generate/{prediction_id}/
Generate AI insights from forecast data. Returns array of Insight objects.

### GET /insights/
List insights. Query params: `prediction_id`, `type` (hotspot/peak/anomaly/suggestion/trend), `severity` (low/medium/high).

---

## Response Codes
| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad Request – validation error |
| 401  | Unauthorized – invalid/expired JWT |
| 403  | Forbidden – insufficient role |
| 404  | Not Found |
| 429  | Rate Limited (1000 req/hour) |
| 500  | Server Error |

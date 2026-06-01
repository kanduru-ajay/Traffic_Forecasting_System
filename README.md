# Traffic Forecasting System

This project predicts traffic using machine learning.  
It has a **Backend** (Django + DRF) and a **Frontend** (React + Vite + Material UI).

---

## 🖥️ Backend (Django + DRF)
- Users: JWT login, admin/user roles, token refresh  
- Datasets: Upload CSV, automatic preprocessing  
- ML Models: Train Linear Regression, Random Forest, XGBoost, auto‑best selection  
- Predictions: Hourly, daily, weekly forecasts with confidence intervals  
- Insights: Hotspots, peaks, anomalies, travel suggestions  
- Core: JWT, CORS, PostgreSQL, pagination, rate limiting  
- ML Pipelines: Preprocessor, trainer, forecaster (modular)

---

## 🌐 Frontend (React + Vite + MUI)
- Login: Secure JWT login with auto refresh  
- Dashboard: Stat cards, 24‑hour chart, insight feed  
- Upload: Drag & drop CSV with preprocessing status  
- Train: Algorithm checkboxes, metric table, best model badge  
- Forecast: Model picker, horizon sliders, chart with confidence intervals, insight grid

---

## 📄 Documentation
- DB_SCHEMA.sql — PostgreSQL schema with indexes and triggers  
- API_DOCS.md — All endpoints with payloads and responses  
- ML_PIPELINE.md — Six stages explained with feature table, LSTM extension, and diagram

---

## 🧩 System Architecture

+-------------------+        +-------------------+
|   Frontend (UI)   | <----> |   Backend (API)   |
| React + Vite + MUI|        | Django + DRF      |
+-------------------+        +-------------------+
|                           |
v                           v
User Login (JWT)          ML Pipelines (Preprocess, Train, Forecast)
Dashboard & Charts        PostgreSQL Database
Upload & Train            Insights Engine


---

## 🔄 ML Pipeline Diagram

CSV Upload --> Preprocessing --> Model Training --> Best Model Selection
|             |                |                   |
v             v                v                   v
Clean Data    Features Ready   Train LR/RF/XGB     Forecast Traffic
(Hourly/Daily/Weekly)


---

## 📊 Workflow Diagram

User --> Frontend (React UI) --> Backend (Django API) --> ML Pipeline
|            |                       |                   |
v            v                       v                   v
Login     Upload CSV             Preprocess Data       Train Models
Dashboard Forecast Request   Save to PostgreSQL   Select Best Model
Charts + Insights <-------------------------------- Forecast Results


---

## 🖼️ Frontend UI Layout Diagram

+---------------------------------------------------+
|                     Login Page                    |
|            [ Username ] [ Password ]              |
|                     [ Login ]                     |
+---------------------------------------------------+
|
v
+---------------------------------------------------+
|                    Dashboard                      |
|  Stat Cards | 24-hr Area Chart | Insight Feed     |
+---------------------------------------------------+
|
v
+---------------------------------------------------+
|                     Upload Page                   |
|   [ Drag & Drop CSV ] -> Preprocessing Status      |
+---------------------------------------------------+
|
v
+---------------------------------------------------+
|                     Train Page                    |
|  [ Algorithm Checkboxes ] [ Metric Table ]        |
|  [ Best Model Badge ]                             |
+---------------------------------------------------+
|
v
+---------------------------------------------------+
|                    Forecast Page                  |
|  [ Model Picker ] [ Horizon Sliders ]             |
|  Area Chart with Confidence Intervals + Insights  |
+---------------------------------------------------+
---

## 🧠Explanation

1. You upload traffic data as a CSV file.  
2. The system cleans and prepares the data.  
3. It trains machine learning models.  
4. The best model is chosen automatically.  
5. You can forecast traffic for hours, days, or weeks.  
6. Insights show hotspots, peaks, anomalies, and travel suggestions.  
7. The frontend makes everything easy with charts and dashboards.

# TrafficIQ – Traffic Forecasting System

Production-style full-stack application for traffic prediction, featuring JWT auth, CSV ingestion, ML training, and AI-powered insights.

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + MUI + Recharts + Zustand |
| Backend | Django 4.2 + DRF + SimpleJWT |
| Database | PostgreSQL 15 |
| ML | Pandas · Scikit-learn · XGBoost · (optional TensorFlow/LSTM) |
| Infra | Docker Compose + Nginx + Gunicorn |

---

## Quick Start

### 1. Clone & configure
```bash
git clone <repo-url> trafficiq
cd trafficiq
cp .env.example .env          # edit secrets
```

### 2. Docker (recommended)
```bash
cd docker
docker compose up --build -d
# Backend: http://localhost:8000
# Frontend: http://localhost:80
```

### 3. Manual setup

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Set env vars
export DB_NAME=traffic_db DB_USER=postgres DB_PASSWORD=postgres

python manage.py migrate
python manage.py createsuperuser
cd .. && python scripts/seed.py     # seed demo users

gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

**Frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev                          # http://localhost:5173
```

---

## Sample Workflow

```
1. Login  →  admin / Admin@1234

2. Upload →  /upload
   - Generate sample CSV: python scripts/generate_sample_csv.py
   - Upload sample_traffic_data.csv
   - System auto-cleans + engineers 40+ features

3. Train  →  /train
   - Select dataset, check all 3 algorithms
   - Target column: volume
   - Click "Start Training"
   - Best model auto-selected by MAE

4. Forecast → /forecast
   - Choose best model ⭐
   - Horizon: hourly, Steps: 24
   - View 24-hour forecast with confidence interval
   - AI insights auto-generated

5. Dashboard → / 
   - Overview stats + trend charts
```

---

## Default Credentials
| Username  | Password     | Role  |
|-----------|-------------|-------|
| admin     | Admin@1234  | admin |
| analyst   | Analyst@1234| user  |

---

## Folder Structure
```
trafficiq/
├── backend/
│   ├── apps/
│   │   ├── users/          # JWT auth, user management
│   │   ├── datasets/       # CSV upload + preprocessing
│   │   ├── mlmodels/       # Training + evaluation
│   │   ├── predictions/    # Forecasting
│   │   └── insights/       # AI insight generation
│   ├── core/               # Settings, URLs
│   ├── ml/
│   │   ├── pipelines/      # preprocessor.py, trainer.py, forecaster.py
│   │   └── utils/          # insight_engine.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, Upload, Train, Forecast, Login
│       ├── services/       # api.js (axios)
│       └── store/          # authStore.js (zustand)
├── docs/
│   ├── DB_SCHEMA.sql
│   ├── API_DOCS.md
│   └── ML_PIPELINE.md
├── scripts/
│   ├── seed.py
│   └── generate_sample_csv.py
└── docker/
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── nginx.conf
```

---

## API Endpoints Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | JWT login |
| POST | /api/auth/register/ | Register user |
| POST | /api/datasets/upload/ | Upload CSV |
| GET  | /api/datasets/ | List datasets |
| POST | /api/models/train/ | Train models |
| GET  | /api/models/best/{id}/ | Get best model |
| POST | /api/predictions/forecast/ | Generate forecast |
| POST | /api/insights/generate/{id}/ | AI insights |

Full docs: `docs/API_DOCS.md`

---

## ML Models
| Algorithm | CV | Feature Importance | Best For |
|-----------|----|--------------------|----------|
| Linear Regression | TimeSeriesSplit-5 | Coefficients | Baseline |
| Random Forest | TimeSeriesSplit-5 | Feature importance | Non-linear |
| XGBoost | TimeSeriesSplit-5 | SHAP-ready | Production |
| LSTM (opt) | Sliding window | Attention weights | Sequences |

Auto-selection: lowest MAE across folds → `is_best = True`

---

## Environment Variables
```env
SECRET_KEY=your-secret-key
DEBUG=False
DB_NAME=traffic_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
CORS_ORIGINS=http://localhost:5173
```

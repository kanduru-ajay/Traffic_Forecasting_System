-- ============================================================
--  Traffic Forecasting System  --  PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(150) UNIQUE NOT NULL,
    email         VARCHAR(254) UNIQUE NOT NULL,
    password      VARCHAR(128) NOT NULL,
    role          VARCHAR(10) NOT NULL DEFAULT 'user'
                  CHECK (role IN ('admin', 'user')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);

-- ── Datasets ───────────────────────────────────────────────
CREATE TABLE datasets (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    file_path           VARCHAR(500) NOT NULL,
    original_filename   VARCHAR(255) NOT NULL,
    row_count           INT,
    column_count        INT,
    columns             JSONB DEFAULT '[]',
    status              VARCHAR(20) NOT NULL DEFAULT 'uploaded'
                        CHECK (status IN ('uploaded','processing','ready','error')),
    preprocessing_log   JSONB DEFAULT '[]',
    feature_stats       JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_datasets_user   ON datasets(user_id);
CREATE INDEX idx_datasets_status ON datasets(status);

-- ── Trained Models ─────────────────────────────────────────
CREATE TABLE trained_models (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dataset_id          BIGINT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    algorithm           VARCHAR(30) NOT NULL
                        CHECK (algorithm IN ('linear_regression','random_forest','xgboost','lstm')),
    status              VARCHAR(20) NOT NULL DEFAULT 'training'
                        CHECK (status IN ('training','ready','error')),
    hyperparameters     JSONB DEFAULT '{}',
    feature_columns     JSONB DEFAULT '[]',
    target_column       VARCHAR(100) NOT NULL,
    model_path          VARCHAR(500),
    -- Evaluation metrics (TimeSeriesSplit CV averages)
    mae                 DOUBLE PRECISION,
    rmse                DOUBLE PRECISION,
    r2                  DOUBLE PRECISION,
    mape                DOUBLE PRECISION,
    is_best             BOOLEAN NOT NULL DEFAULT FALSE,
    training_log        JSONB DEFAULT '[]',
    feature_importance  JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_models_dataset ON trained_models(dataset_id);
CREATE INDEX idx_models_is_best ON trained_models(is_best);
CREATE INDEX idx_models_algo    ON trained_models(algorithm);

-- ── Predictions ────────────────────────────────────────────
CREATE TABLE predictions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id            BIGINT NOT NULL REFERENCES trained_models(id) ON DELETE CASCADE,
    horizon             VARCHAR(10) NOT NULL
                        CHECK (horizon IN ('hourly','daily','weekly')),
    steps               INT NOT NULL DEFAULT 24,
    input_features      JSONB DEFAULT '{}',
    forecast_data       JSONB DEFAULT '[]',   -- [{timestamp, predicted, lower, upper, step}]
    confidence_interval DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_model  ON predictions(model_id);
CREATE INDEX idx_predictions_user   ON predictions(user_id);
CREATE INDEX idx_predictions_horizon ON predictions(horizon);

-- ── Insights ───────────────────────────────────────────────
CREATE TABLE insights (
    id              BIGSERIAL PRIMARY KEY,
    prediction_id   BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    insight_type    VARCHAR(20) NOT NULL
                    CHECK (insight_type IN ('hotspot','peak','anomaly','suggestion','trend')),
    severity        VARCHAR(10) NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('low','medium','high')),
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    location        VARCHAR(255),
    timestamp_start TIMESTAMPTZ,
    timestamp_end   TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insights_prediction ON insights(prediction_id);
CREATE INDEX idx_insights_type       ON insights(insight_type);
CREATE INDEX idx_insights_severity   ON insights(severity);

-- ── Trigger: auto-update updated_at ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd    BEFORE UPDATE ON users         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_datasets_upd BEFORE UPDATE ON datasets      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_models_upd   BEFORE UPDATE ON trained_models FOR EACH ROW EXECUTE FUNCTION update_updated_at();

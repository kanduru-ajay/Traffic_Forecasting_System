from django.db import models
from apps.users.models import User
from apps.datasets.models import Dataset


class TrainedModel(models.Model):
    ALGORITHM_CHOICES = [
        ("linear_regression", "Linear Regression"),
        ("random_forest", "Random Forest"),
        ("xgboost", "XGBoost"),
        ("lstm", "LSTM"),
    ]
    STATUS_CHOICES = [("training", "Training"), ("ready", "Ready"), ("error", "Error")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="models")
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="models")
    name = models.CharField(max_length=255)
    algorithm = models.CharField(max_length=30, choices=ALGORITHM_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="training")
    hyperparameters = models.JSONField(default=dict)
    feature_columns = models.JSONField(default=list)
    target_column = models.CharField(max_length=100)
    model_path = models.CharField(max_length=500, null=True)
    # Metrics
    mae = models.FloatField(null=True)
    rmse = models.FloatField(null=True)
    r2 = models.FloatField(null=True)
    mape = models.FloatField(null=True)
    is_best = models.BooleanField(default=False)
    training_log = models.JSONField(default=list)
    feature_importance = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trained_models"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.algorithm}) - R²: {self.r2}"

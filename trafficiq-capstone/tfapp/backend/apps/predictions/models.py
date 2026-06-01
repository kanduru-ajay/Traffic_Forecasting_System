from django.db import models
from apps.users.models import User
from apps.mlmodels.models import TrainedModel


class Prediction(models.Model):
    HORIZON_CHOICES = [("hourly", "Hourly"), ("daily", "Daily"), ("weekly", "Weekly")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="predictions")
    model = models.ForeignKey(TrainedModel, on_delete=models.CASCADE, related_name="predictions")
    horizon = models.CharField(max_length=10, choices=HORIZON_CHOICES)
    steps = models.IntegerField(default=24)
    input_features = models.JSONField(default=dict)
    forecast_data = models.JSONField(default=list)  # [{timestamp, predicted, lower, upper}]
    confidence_interval = models.FloatField(default=0.95)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predictions"
        ordering = ["-created_at"]

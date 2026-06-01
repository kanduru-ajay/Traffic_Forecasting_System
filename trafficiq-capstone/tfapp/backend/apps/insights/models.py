from django.db import models
from apps.users.models import User
from apps.predictions.models import Prediction


class Insight(models.Model):
    TYPE_CHOICES = [
        ("hotspot", "Traffic Hotspot"),
        ("peak", "Peak Hour"),
        ("anomaly", "Anomaly"),
        ("suggestion", "Travel Suggestion"),
        ("trend", "Trend"),
    ]
    SEVERITY_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High")]

    prediction = models.ForeignKey(Prediction, on_delete=models.CASCADE, related_name="insights")
    insight_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="medium")
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255, null=True)
    timestamp_start = models.DateTimeField(null=True)
    timestamp_end = models.DateTimeField(null=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "insights"
        ordering = ["-created_at"]

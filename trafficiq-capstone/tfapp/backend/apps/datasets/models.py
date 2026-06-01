from django.db import models
from apps.users.models import User


class Dataset(models.Model):
    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("processing", "Processing"),
        ("ready", "Ready"),
        ("error", "Error"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="datasets")
    name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255)
    row_count = models.IntegerField(null=True)
    column_count = models.IntegerField(null=True)
    columns = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="uploaded")
    preprocessing_log = models.JSONField(default=list)
    feature_stats = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "datasets"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.status})"

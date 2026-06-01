from rest_framework import serializers
from .models import Dataset


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = "__all__"
        read_only_fields = ["id", "user", "status", "row_count", "column_count",
                            "columns", "preprocessing_log", "feature_stats", "created_at", "updated_at"]


class DatasetUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    name = serializers.CharField(max_length=255)

from rest_framework import serializers
from .models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source="model.name", read_only=True)
    algorithm = serializers.CharField(source="model.algorithm", read_only=True)

    class Meta:
        model = Prediction
        fields = "__all__"
        read_only_fields = ["id", "user", "forecast_data", "created_at"]


class ForecastRequestSerializer(serializers.Serializer):
    model_id = serializers.IntegerField()
    horizon = serializers.ChoiceField(choices=["hourly", "daily", "weekly"])
    steps = serializers.IntegerField(min_value=1, max_value=168, default=24)
    confidence_interval = serializers.FloatField(min_value=0.5, max_value=0.99, default=0.95)

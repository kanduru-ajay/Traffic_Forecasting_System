from rest_framework import serializers
from .models import TrainedModel


class TrainedModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainedModel
        fields = "__all__"
        read_only_fields = ["id", "user", "status", "model_path", "mae", "rmse",
                            "r2", "mape", "is_best", "training_log", "feature_importance",
                            "created_at", "updated_at"]


class TrainRequestSerializer(serializers.Serializer):
    dataset_id = serializers.IntegerField()
    algorithms = serializers.ListField(
        child=serializers.ChoiceField(choices=["linear_regression", "random_forest", "xgboost", "lstm"]),
        default=["linear_regression", "random_forest", "xgboost"]
    )
    target_column = serializers.CharField(default="volume")
    feature_columns = serializers.ListField(child=serializers.CharField(), required=False)
    hyperparameters = serializers.DictField(required=False, default=dict)

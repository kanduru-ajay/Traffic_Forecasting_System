from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.datasets.models import Dataset
from .models import TrainedModel
from .serializers import TrainedModelSerializer, TrainRequestSerializer
from ml.pipelines.trainer import ModelTrainer


class TrainModelsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TrainRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            dataset = Dataset.objects.get(pk=data["dataset_id"], status="ready")
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found or not ready"}, status=404)

        trainer = ModelTrainer(
            dataset=dataset,
            user=request.user,
            algorithms=data["algorithms"],
            target_column=data["target_column"],
            feature_columns=data.get("feature_columns"),
            hyperparameters=data.get("hyperparameters", {}),
        )
        trained_models = trainer.train_all()
        return Response(TrainedModelSerializer(trained_models, many=True).data, status=201)


class ModelListView(generics.ListAPIView):
    serializer_class = TrainedModelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TrainedModel.objects.filter(status="ready")
        if self.request.user.role != "admin":
            qs = qs.filter(user=self.request.user)
        dataset_id = self.request.query_params.get("dataset_id")
        if dataset_id:
            qs = qs.filter(dataset_id=dataset_id)
        return qs


class ModelDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = TrainedModelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return TrainedModel.objects.all()
        return TrainedModel.objects.filter(user=self.request.user)


class BestModelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, dataset_id):
        model = TrainedModel.objects.filter(
            dataset_id=dataset_id, is_best=True, status="ready"
        ).first()
        if not model:
            return Response({"error": "No best model found"}, status=404)
        return Response(TrainedModelSerializer(model).data)

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.mlmodels.models import TrainedModel
from .models import Prediction
from .serializers import PredictionSerializer, ForecastRequestSerializer
from ml.pipelines.forecaster import Forecaster


class ForecastView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ForecastRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            model = TrainedModel.objects.get(pk=data["model_id"], status="ready")
        except TrainedModel.DoesNotExist:
            return Response({"error": "Model not found"}, status=404)

        forecaster = Forecaster(model)
        forecast_data = forecaster.forecast(
            horizon=data["horizon"],
            steps=data["steps"],
            confidence_interval=data["confidence_interval"],
        )

        prediction = Prediction.objects.create(
            user=request.user,
            model=model,
            horizon=data["horizon"],
            steps=data["steps"],
            confidence_interval=data["confidence_interval"],
            forecast_data=forecast_data,
        )
        return Response(PredictionSerializer(prediction).data, status=201)


class PredictionListView(generics.ListAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Prediction.objects.all() if self.request.user.role == "admin" \
            else Prediction.objects.filter(user=self.request.user)
        model_id = self.request.query_params.get("model_id")
        horizon = self.request.query_params.get("horizon")
        if model_id:
            qs = qs.filter(model_id=model_id)
        if horizon:
            qs = qs.filter(horizon=horizon)
        return qs


class PredictionDetailView(generics.RetrieveAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Prediction.objects.all()
        return Prediction.objects.filter(user=self.request.user)

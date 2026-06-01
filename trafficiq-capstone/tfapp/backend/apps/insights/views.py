from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Insight
from .serializers import InsightSerializer
from ml.utils.insight_engine import InsightEngine


class InsightListView(generics.ListAPIView):
    serializer_class = InsightSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Insight.objects.all()
        prediction_id = self.request.query_params.get("prediction_id")
        insight_type = self.request.query_params.get("type")
        severity = self.request.query_params.get("severity")
        if prediction_id:
            qs = qs.filter(prediction_id=prediction_id)
        if insight_type:
            qs = qs.filter(insight_type=insight_type)
        if severity:
            qs = qs.filter(severity=severity)
        return qs


class GenerateInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, prediction_id):
        from apps.predictions.models import Prediction
        try:
            prediction = Prediction.objects.get(pk=prediction_id)
        except Prediction.DoesNotExist:
            return Response({"error": "Prediction not found"}, status=404)

        engine = InsightEngine(prediction)
        insights = engine.generate()
        return Response(InsightSerializer(insights, many=True).data)

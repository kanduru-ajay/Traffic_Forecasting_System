import os
import uuid
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Dataset
from .serializers import DatasetSerializer, DatasetUploadSerializer
from ml.pipelines.preprocessor import DataPreprocessor


class DatasetUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DatasetUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data["file"]
        name = serializer.validated_data["name"]

        # Save file
        filename = f"{uuid.uuid4()}_{file.name}"
        upload_dir = os.path.join(settings.MEDIA_ROOT, "datasets")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)

        with open(file_path, "wb+") as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        dataset = Dataset.objects.create(
            user=request.user,
            name=name,
            file_path=file_path,
            original_filename=file.name,
            status="processing",
        )

        # Process inline (use Celery in production)
        preprocessor = DataPreprocessor(dataset)
        preprocessor.run()

        return Response(DatasetSerializer(dataset).data, status=status.HTTP_201_CREATED)


class DatasetListView(generics.ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Dataset.objects.all()
        return Dataset.objects.filter(user=self.request.user)


class DatasetDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Dataset.objects.all()
        return Dataset.objects.filter(user=self.request.user)

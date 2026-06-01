from django.urls import path
from . import views

urlpatterns = [
    path("", views.DatasetListView.as_view(), name="dataset_list"),
    path("upload/", views.DatasetUploadView.as_view(), name="dataset_upload"),
    path("<int:pk>/", views.DatasetDetailView.as_view(), name="dataset_detail"),
]

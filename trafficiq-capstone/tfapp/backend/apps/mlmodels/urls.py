from django.urls import path
from . import views

urlpatterns = [
    path("", views.ModelListView.as_view(), name="model_list"),
    path("train/", views.TrainModelsView.as_view(), name="train"),
    path("<int:pk>/", views.ModelDetailView.as_view(), name="model_detail"),
    path("best/<int:dataset_id>/", views.BestModelView.as_view(), name="best_model"),
]

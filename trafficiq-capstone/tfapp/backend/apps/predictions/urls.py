from django.urls import path
from . import views

urlpatterns = [
    path("", views.PredictionListView.as_view(), name="prediction_list"),
    path("forecast/", views.ForecastView.as_view(), name="forecast"),
    path("<int:pk>/", views.PredictionDetailView.as_view(), name="prediction_detail"),
]

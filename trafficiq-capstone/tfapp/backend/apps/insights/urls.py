from django.urls import path
from . import views

urlpatterns = [
    path("", views.InsightListView.as_view(), name="insight_list"),
    path("generate/<int:prediction_id>/", views.GenerateInsightsView.as_view(), name="generate_insights"),
]

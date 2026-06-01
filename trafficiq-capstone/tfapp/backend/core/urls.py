from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/datasets/", include("apps.datasets.urls")),
    path("api/models/", include("apps.mlmodels.urls")),
    path("api/predictions/", include("apps.predictions.urls")),
    path("api/insights/", include("apps.insights.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

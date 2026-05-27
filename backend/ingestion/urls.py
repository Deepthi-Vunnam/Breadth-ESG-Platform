from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ingestion.views import (
    SAPUploadView,
    UtilityUploadView,
    TravelUploadView,
    SourceUploadViewSet,
    EmissionRecordViewSet,
)

# Standard REST Framework Viewset router mapping
router = DefaultRouter()
router.register(r'uploads', SourceUploadViewSet, basename='sourceupload')
router.register(r'records', EmissionRecordViewSet, basename='emissionrecord')

urlpatterns = [
    # Custom CSV Ingestion API routes
    path('upload/sap/', SAPUploadView.as_view(), name='upload_sap'),
    path('upload/utility/', UtilityUploadView.as_view(), name='upload_utility'),
    path('upload/travel/', TravelUploadView.as_view(), name='upload_travel'),
    
    # Unified Viewset sub-routes
    path('', include(router.urls)),
]

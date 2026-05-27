from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import CompanyViewSet, AuditLogViewSet, MeView

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    # Auth user session profile view
    path('auth/me/', MeView.as_view(), name='auth_me'),
    
    # Viewset endpoints
    path('', include(router.urls)),
]

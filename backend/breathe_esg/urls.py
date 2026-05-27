from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

def api_root(request):
    return JsonResponse({
        "platform": "Breathe ESG - CarbonFlow Ingestion & Review Platform API",
        "status": "Operational",
        "version": "1.0.0",
        "documentation": "/docs/",
        "endpoints": {
            "authentication": {
                "login": "/api/auth/login/",
                "token_refresh": "/api/auth/refresh/"
            },
            "organization": {
                "companies": "/api/companies/"
            },
            "ingestion": {
                "sap_upload": "/api/upload/sap/",
                "utility_upload": "/api/upload/utility/",
                "travel_upload": "/api/upload/travel/",
                "batches": "/api/uploads/"
            },
            "ledger": {
                "records": "/api/records/",
                "audit_logs": "/api/audit-logs/"
            }
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    
    # SimpleJWT Authenticating APIs
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Core & Ingestion App Delegated APIs
    path('api/', include('core.urls')),
    path('api/', include('ingestion.urls')),
]

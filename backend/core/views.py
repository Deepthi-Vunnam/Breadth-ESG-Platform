from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import Company, AuditLog
from core.serializers import CompanySerializer, AuditLogSerializer, UserSerializer

class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset listing client organizations (tenants).
    Analysts pick from this list to scope their queries and uploads.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only list viewset for auditors and analysts to query the complete compliance history.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = AuditLog.objects.all()
        
        # Scoped filters
        record_id = self.request.query_params.get('record_id')
        if record_id:
            queryset = queryset.filter(record_id=record_id)
            
        action_param = self.request.query_params.get('action')
        if action_param:
            queryset = queryset.filter(action=action_param)
            
        return queryset


class MeView(APIView):
    """
    Returns profile information of the currently authenticated analyst.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(
            {
                "user": serializer.data,
                "role": "Analyst"  # Breathe ESG runs on standard Analyst roles
            },
            status=status.HTTP_200_OK
        )

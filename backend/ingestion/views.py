from rest_framework import status, viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from core.models import Company, AuditLog
from core.serializers import AuditLogSerializer
from ingestion.models import SourceUpload, EmissionRecord
from ingestion.serializers import SourceUploadSerializer, EmissionRecordSerializer
from ingestion.parser import parse_csv_ingestion

class BaseCSVUploadView(APIView):
    """
    Core base view handling multipart CSV file upload and multi-tenant scoping.
    """
    permission_classes = [permissions.IsAuthenticated]
    source_type = None  # to be overridden by subclasses

    def post(self, request, *args, **kwargs):
        if not self.source_type:
            return Response(
                {"error": "Ingestion source type not configured on View."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        company_id = request.data.get('company_id')
        if not company_id:
            return Response(
                {"error": "company_id parameter is required for multi-tenant allocation."},
                status=status.HTTP_400_BAD_REQUEST
            )

        company = get_object_or_404(Company, id=company_id)
        
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {"error": "No file uploaded. Please upload a valid CSV file using the 'file' key."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not file_obj.name.endswith('.csv'):
            return Response(
                {"error": "Invalid file type. Only CSV files are supported for ingestion."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            file_content = file_obj.read().decode('utf-8-sig') # handle potential BOMs
        except UnicodeDecodeError:
            try:
                file_content = file_obj.read().decode('latin-1')
            except Exception:
                return Response(
                    {"error": "Failed to decode the uploaded file. Ensure it is encoded in UTF-8 or Latin-1."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Parse CSV with the transaction engine
        with transaction.atomic():
            batch = parse_csv_ingestion(
                file_content=file_content,
                source_type=self.source_type,
                company=company,
                user=request.user,
                file_name=file_obj.name
            )

        serializer = SourceUploadSerializer(batch)
        return Response(
            {
                "message": f"Successfully processed {file_obj.name} Ingestion batch.",
                "summary": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class SAPUploadView(BaseCSVUploadView):
    source_type = 'sap'


class UtilityUploadView(BaseCSVUploadView):
    source_type = 'utility'


class TravelUploadView(BaseCSVUploadView):
    source_type = 'travel'


class SourceUploadViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only views to track ingestion history and batch summaries.
    """
    queryset = SourceUpload.objects.all()
    serializer_class = SourceUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['company', 'source_type', 'status']


class EmissionRecordViewSet(viewsets.ModelViewSet):
    """
    Viewset containing the unified ESG ledger list, filters, and analyst workflows (Approve/Reject).
    """
    queryset = EmissionRecord.objects.all()
    serializer_class = EmissionRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Custom filter configurations
    def get_queryset(self):
        queryset = EmissionRecord.objects.all()
        
        # Multi-tenant tenant scoping
        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
            
        source_type = self.request.query_params.get('source_type')
        if source_type:
            queryset = queryset.filter(source_type=source_type)
            
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        is_suspicious = self.request.query_params.get('is_suspicious')
        if is_suspicious is not None:
            is_suspicious_bool = is_suspicious.lower() in ['true', '1']
            queryset = queryset.filter(is_suspicious=is_suspicious_bool)
            
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                category__icontains=search_query
            ) | queryset.filter(
                activity_type__icontains=search_query
            ) | queryset.filter(
                suspicious_reasons__icontains=search_query
            )
            
        return queryset

    @action(detail=True, methods=['patch'])
    @transaction.atomic
    def approve(self, request, pk=None):
        """
        Approves an emission record.
        Approved rows become locked.
        Logs the action to the AuditLog ledger.
        """
        record = self.get_object()
        
        # Lock check
        if record.status == 'approved':
            return Response(
                {"error": "This emission record is already approved and locked from edits."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if record.status == 'failed':
            return Response(
                {"error": "Validation-failed rows cannot be approved in the system."},
                status=status.HTTP_400_BAD_REQUEST
            )

        review_notes = request.data.get('review_notes', '')

        # Capture snapshot for Audit diffs
        old_snapshot = EmissionRecordSerializer(record).data

        # Update record parameters
        record.status = 'approved'
        record.approved_by = request.user
        record.approved_at = timezone.now()
        record.review_notes = review_notes
        record.save()

        # Capture new snapshot
        new_snapshot = EmissionRecordSerializer(record).data

        # Generate immutable compliance audit log
        AuditLog.objects.create(
            record=record,
            action='approve',
            old_value=old_snapshot,
            new_value=new_snapshot,
            performed_by=request.user
        )

        return Response(
            {
                "message": f"Emission record {record.id} approved and compliance-locked successfully.",
                "record": new_snapshot
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch'])
    @transaction.atomic
    def reject(self, request, pk=None):
        """
        Rejects an emission record with custom analyst review notes.
        Logs the action to the AuditLog ledger.
        """
        record = self.get_object()
        
        if record.status == 'approved':
            return Response(
                {"error": "Approved records are compliance locked and cannot be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        review_notes = request.data.get('review_notes')
        if not review_notes:
            return Response(
                {"error": "Analyst justification notes are required to reject an activity record."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Capture snapshot for Audit diffs
        old_snapshot = EmissionRecordSerializer(record).data

        record.status = 'rejected'
        record.review_notes = review_notes
        record.save()

        # Capture new snapshot
        new_snapshot = EmissionRecordSerializer(record).data

        # Generate audit log
        AuditLog.objects.create(
            record=record,
            action='reject',
            old_value=old_snapshot,
            new_value=new_snapshot,
            performed_by=request.user
        )

        return Response(
            {
                "message": f"Emission record {record.id} successfully rejected.",
                "record": new_snapshot
            },
            status=status.HTTP_200_OK
        )

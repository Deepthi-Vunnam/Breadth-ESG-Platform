from rest_framework import serializers
from django.contrib.auth.models import User
from core.serializers import UserSerializer, CompanySerializer
from ingestion.models import SourceUpload, EmissionRecord

class SourceUploadSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)
    company_details = CompanySerializer(source='company', read_only=True)
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SourceUpload
        fields = [
            'id', 
            'company', 
            'company_details', 
            'source_type', 
            'source_type_display',
            'file_name', 
            'uploaded_by', 
            'uploaded_by_details', 
            'uploaded_at', 
            'total_rows', 
            'success_rows', 
            'failed_rows', 
            'status',
            'status_display'
        ]


class EmissionRecordSerializer(serializers.ModelSerializer):
    company_details = CompanySerializer(source='company', read_only=True)
    source_upload_details = SourceUploadSerializer(source='source_upload', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    emission_scope_display = serializers.CharField(source='get_emission_scope_display', read_only=True)
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)

    class Meta:
        model = EmissionRecord
        fields = [
            'id',
            'company',
            'company_details',
            'source_upload',
            'source_upload_details',
            'source_type',
            'source_type_display',
            'category',
            'activity_type',
            'quantity',
            'unit',
            'normalized_quantity',
            'normalized_unit',
            'emission_scope',
            'emission_scope_display',
            'status',
            'status_display',
            'is_suspicious',
            'suspicious_reasons',
            'raw_data',
            'approved_by',
            'approved_by_details',
            'approved_at',
            'review_notes',
            'created_at'
        ]

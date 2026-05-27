from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Company, AuditLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'company_name', 'industry', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_details = UserSerializer(source='performed_by', read_only=True)
    record_category = serializers.CharField(source='record.category', read_only=True)
    record_source_type = serializers.CharField(source='record.source_type', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 
            'record', 
            'record_category',
            'record_source_type',
            'action', 
            'action_display',
            'old_value', 
            'new_value', 
            'performed_by', 
            'performed_by_details', 
            'timestamp'
        ]

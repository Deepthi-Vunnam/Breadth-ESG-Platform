from django.contrib import admin
from ingestion.models import SourceUpload, EmissionRecord

@admin.register(SourceUpload)
class SourceUploadAdmin(admin.ModelAdmin):
    list_display = ('id', 'company', 'source_type', 'file_name', 'uploaded_by', 'uploaded_at', 'status')
    search_fields = ('file_name', 'company__company_name', 'uploaded_by__username')
    list_filter = ('source_type', 'status', 'uploaded_at')
    readonly_fields = ('id', 'uploaded_at')


@admin.register(EmissionRecord)
class EmissionRecordAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'company', 
        'source_type', 
        'category', 
        'activity_type', 
        'normalized_quantity', 
        'normalized_unit', 
        'emission_scope', 
        'status', 
        'is_suspicious'
    )
    search_fields = ('category', 'activity_type', 'company__company_name', 'suspicious_reasons')
    list_filter = ('source_type', 'emission_scope', 'status', 'is_suspicious', 'created_at')
    readonly_fields = ('created_at',)

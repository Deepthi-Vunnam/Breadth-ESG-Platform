import uuid
from django.db import models
from django.contrib.auth.models import User
from core.models import Company

class SourceUpload(models.Model):
    """
    Tracks ingestion batches. Every batch maps to a Company tenant 
    and captures stats on total, successful, and failed records parsed.
    """
    SOURCE_CHOICES = (
        ('sap', 'SAP Fuel & Procurement Data'),
        ('utility', 'Utility Electricity Data'),
        ('travel', 'Corporate Travel Data'),
    )

    STATUS_CHOICES = (
        ('completed', 'Completed Successfully'),
        ('failed', 'Ingestion Failed'),
        ('partial', 'Partially Completed (Some Rows Failed)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='uploads'
    )
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    file_name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploads'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    total_rows = models.IntegerField(default=0)
    success_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.source_type.upper()} Upload ({self.file_name}) - Tenant: {self.company.company_name} at {self.uploaded_at}"


class EmissionRecord(models.Model):
    """
    Unified ESG activity ledger. Normalizes heterogeneous enterprise records 
    into a standardized structure with granular validation and review controls.
    """
    STATUS_CHOICES = (
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved (Locked)'),
        ('rejected', 'Rejected'),
        ('failed', 'Validation Failed'),
    )

    SCOPE_CHOICES = (
        (1, 'Scope 1 - Direct Emissions'),
        (2, 'Scope 2 - Indirect Emissions (Electricity)'),
        (3, 'Scope 3 - Value Chain (Corporate Travel)'),
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='emission_records'
    )
    source_upload = models.ForeignKey(
        SourceUpload,
        on_delete=models.CASCADE,
        related_name='records',
        null=True,
        blank=True
    )
    source_type = models.CharField(max_length=20, choices=SourceUpload.SOURCE_CHOICES)
    category = models.CharField(max_length=50, help_text="e.g. Fuel, Electricity, Flight, Hotel, Ground Transport")
    activity_type = models.CharField(max_length=100, help_text="e.g. Diesel, Natural Gas, Grid Electricity, Short-haul Flight")
    
    # Original raw metrics ingested
    quantity = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    unit = models.CharField(max_length=50, null=True, blank=True)
    
    # Standardized normalized metrics
    normalized_quantity = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    normalized_unit = models.CharField(max_length=50, null=True, blank=True)
    emission_scope = models.IntegerField(choices=SCOPE_CHOICES)
    
    # Verification & workflow controls
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_review')
    is_suspicious = models.BooleanField(default=False)
    suspicious_reasons = models.TextField(null=True, blank=True, help_text="Reasons why validation marked this suspicious.")
    raw_data = models.JSONField(help_text="Preserved snapshot of the raw messy CSV row for compliance audits.")
    
    # Approval metadata
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_records'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(null=True, blank=True, help_text="Analyst justification notes.")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'is_suspicious']),
            models.Index(fields=['source_upload']),
        ]

    def __str__(self):
        return f"{self.category} Record {self.id} ({self.status}) - Qty: {self.normalized_quantity} {self.normalized_unit}"

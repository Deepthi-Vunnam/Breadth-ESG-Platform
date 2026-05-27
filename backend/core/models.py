from django.db import models
from django.contrib.auth.models import User

class Company(models.Model):
    """
    Multi-tenant Company model. All ingested records and batch uploads 
    are segmented by Company to ensure strict client isolation.
    """
    company_name = models.CharField(max_length=255, unique=True)
    industry = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['company_name']

    def __str__(self):
        return self.company_name


class AuditLog(models.Model):
    """
    Immutable compliance log tracking state transitions and edits.
    Stores complete snapshot diffs (old_value and new_value) for auditor verification.
    """
    ACTION_CHOICES = (
        ('upload', 'Data Ingestion Upload'),
        ('approve', 'Analyst Approval'),
        ('reject', 'Analyst Rejection'),
        ('edit', 'Record Modification'),
    )

    record = models.ForeignKey(
        'ingestion.EmissionRecord',
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_history'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    old_value = models.JSONField(null=True, blank=True, help_text="Snapshot of record state before this action.")
    new_value = models.JSONField(null=True, blank=True, help_text="Snapshot of record state after this action.")
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_actions'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['record', 'timestamp']),
            models.Index(fields=['performed_by', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.action.upper()} - Record {self.record_id} by {self.performed_by} at {self.timestamp}"

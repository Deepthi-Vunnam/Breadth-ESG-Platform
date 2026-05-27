from django.contrib import admin
from core.models import Company, AuditLog

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('id', 'company_name', 'industry', 'created_at')
    search_fields = ('company_name', 'industry')
    list_filter = ('industry', 'created_at')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'record', 'action', 'performed_by', 'timestamp')
    search_fields = ('action', 'performed_by__username', 'record__id')
    list_filter = ('action', 'timestamp')
    readonly_fields = ('timestamp',)

import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Company

class Command(BaseCommand):
    help = 'Seeds initial Company tenants and Analyst user credentials.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding CarbonFlow ESG Platform database...'))

        # 1. Seed Companies (Tenants)
        company1, created1 = Company.objects.get_or_create(
            company_name='CarbonFlow International',
            defaults={'industry': 'Manufacturing & Logistics'}
        )
        if created1:
            self.stdout.write(self.style.SUCCESS(f"Created tenant Company: {company1.company_name}"))
        else:
            self.stdout.write(self.style.WARNING(f"Tenant Company already exists: {company1.company_name}"))

        company2, created2 = Company.objects.get_or_create(
            company_name='Breathe Global Solutions',
            defaults={'industry': 'Technology & Renewable Energy'}
        )
        if created2:
            self.stdout.write(self.style.SUCCESS(f"Created tenant Company: {company2.company_name}"))
        else:
            self.stdout.write(self.style.WARNING(f"Tenant Company already exists: {company2.company_name}"))

        # 2. Seed Analyst User
        analyst_email = 'analyst@breathe.esg'
        analyst_username = 'analyst'
        analyst_password = 'password123'

        if not User.objects.filter(username=analyst_username).exists():
            user = User.objects.create_user(
                username=analyst_username,
                email=analyst_email,
                password=analyst_password,
                first_name='Lead',
                last_name='Analyst',
                is_staff=True  # allows admin panel access for auditing convenience
            )
            self.stdout.write(self.style.SUCCESS(f"Created default Analyst User: '{analyst_username}'"))
            self.stdout.write(self.style.NOTICE(f"  Email: {analyst_email}"))
            self.stdout.write(self.style.NOTICE(f"  Password: {analyst_password}"))
        else:
            self.stdout.write(self.style.WARNING(f"Analyst User '{analyst_username}' already exists."))

        # 3. Create a Superuser for administrative ease if not existing
        super_username = 'admin'
        if not User.objects.filter(username=super_username).exists():
            User.objects.create_superuser(
                username=super_username,
                email='admin@breathe.esg',
                password='adminpassword'
            )
            self.stdout.write(self.style.SUCCESS(f"Created Superuser: '{super_username}'"))
            self.stdout.write(self.style.NOTICE("  Password: adminpassword"))

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

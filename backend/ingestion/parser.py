import csv
import io
from decimal import Decimal, InvalidOperation
from datetime import datetime
from ingestion.normalization import (
    normalize_sap_fuel,
    normalize_utility_electricity,
    normalize_travel_data,
    get_emission_scope,
)
from ingestion.models import SourceUpload, EmissionRecord
from core.models import Company, AuditLog

# Seeded Enterprise Plant Codes for SAP verification
VALID_PLANTS = {'US-01', 'US-02', 'DE-01', 'DE-02', 'IN-01', 'FR-01'}

# Seeded Fuel Types for SAP verification
VALID_FUELS = {'DIESEL', 'NATURAL GAS', 'PETROL', 'HEAVY FUEL OIL', 'LPG'}

# Seeded Travel Types
VALID_TRAVEL_TYPES = {'FLIGHT', 'HOTEL', 'GROUND TRANSPORT', 'TRAIN'}

# Helper column map aliases to resolve messy enterprise column headers (including German translations)
COLUMN_ALIASES = {
    # SAP column headers
    'plant_code': ['plant code', 'plant', 'werk', 'betriebsstätte', 'plantcode'],
    'fuel_type': ['fuel type', 'fuel', 'brennstoff', 'kraftstoff', 'fueltype'],
    'quantity': ['quantity', 'qty', 'menge', 'verbrauch', 'quantity_procured'],
    'unit': ['unit', 'einheit'],
    'date': ['date', 'datum', 'tag'],
    'cost_center': ['cost center', 'center', 'kostenstelle', 'cost_center'],
    
    # Utility column headers
    'meter_id': ['meter id', 'meter', 'zählernummer', 'meterid'],
    'billing_period': ['billing period', 'billing', 'period', 'abrechnungszeitraum', 'billingperiod'],
    'consumption': ['consumption', 'usage', 'verbrauch', 'strommenge'],
    'tariff_type': ['tariff type', 'tariff', 'tarif', 'tariftype'],
    
    # Travel column headers
    'employee_name': ['employee name', 'employee', 'mitarbeiter', 'name', 'employeename'],
    'travel_type': ['travel type', 'travel', 'type', 'reiseart', 'traveltype'],
    'from_airport': ['from airport', 'from', 'abflughafen', 'departure'],
    'to_airport': ['to airport', 'to', 'zielflughafen', 'arrival', 'destination'],
    'distance': ['distance', 'entfernung', 'distanz'],
    'hotel_nights': ['hotel nights', 'nights', 'bernachtungen', 'hotel_nights', 'stay_duration'],
}

def resolve_headers(headers):
    """
    Scans CSV headers, resolving messy/localized input keys into standard schema fields.
    """
    resolved = {}
    for standard_key, aliases in COLUMN_ALIASES.items():
        for header in headers:
            clean_header = str(header).strip().lower().replace('_', ' ').replace('-', ' ')
            if clean_header in aliases or any(alias in clean_header for alias in aliases):
                resolved[standard_key] = header
                break
    return resolved


def parse_csv_ingestion(file_content, source_type, company, user, file_name):
    """
    High-fidelity transaction-wrapped CSV parser engine.
    Applies custom parsers, validations, and logs.
    """
    # Create the Ingestion Batch record
    upload_batch = SourceUpload.objects.create(
        company=company,
        source_type=source_type,
        file_name=file_name,
        uploaded_by=user,
        status='partial'
    )

    reader = csv.reader(io.StringIO(file_content))
    try:
        headers = next(reader)
    except StopIteration:
        upload_batch.status = 'failed'
        upload_batch.save()
        return upload_batch

    col_map = resolve_headers(headers)
    
    total_count = 0
    success_count = 0
    failed_count = 0
    
    parsed_records = []
    
    for row_idx, row in enumerate(reader, start=1):
        if not row or all(cell.strip() == '' for cell in row):
            continue # Skip blank lines
            
        total_count += 1
        
        # Build raw row dictionary
        raw_dict = {}
        for idx, header in enumerate(headers):
            if idx < len(row):
                raw_dict[header] = row[idx].strip()
            else:
                raw_dict[header] = ''

        # Map row values using resolved headers
        row_mapped = {}
        for std_key, orig_header in col_map.items():
            try:
                row_mapped[std_key] = raw_dict[orig_header]
            except KeyError:
                row_mapped[std_key] = ''

        # Parse & Validate by source type
        is_valid = True
        is_suspicious = False
        reasons = []
        
        record_kwargs = {
            'company': company,
            'source_upload': upload_batch,
            'source_type': source_type,
            'raw_data': raw_dict,
        }

        try:
            if source_type == 'sap':
                is_valid, is_suspicious, reasons, data_fields = parse_sap_row(row_mapped)
            elif source_type == 'utility':
                is_valid, is_suspicious, reasons, data_fields = parse_utility_row(row_mapped)
            elif source_type == 'travel':
                is_valid, is_suspicious, reasons, data_fields = parse_travel_row(row_mapped)
            else:
                is_valid = False
                reasons = ["Unknown source type configuration."]
                data_fields = {}
        except Exception as e:
            is_valid = False
            reasons = [f"Critical parsing crash: {str(e)}"]
            data_fields = {}

        if not is_valid:
            failed_count += 1
            # Still record failed rows in ledger as failed for audits
            record_kwargs.update({
                'category': 'Failed Ingestion',
                'activity_type': 'Failed Ingestion',
                'status': 'failed',
                'is_suspicious': True,
                'suspicious_reasons': "; ".join(reasons),
                'emission_scope': get_emission_scope(source_type),
            })
        else:
            success_count += 1
            record_kwargs.update(data_fields)
            if is_suspicious:
                record_kwargs.update({
                    'status': 'pending_review',
                    'is_suspicious': True,
                    'suspicious_reasons': "; ".join(reasons),
                })
            else:
                record_kwargs.update({
                    'status': 'pending_review',
                    'is_suspicious': False,
                })

        record = EmissionRecord.objects.create(**record_kwargs)
        
        # Log initial upload audit
        AuditLog.objects.create(
            record=record,
            action='upload',
            new_value=record_kwargs.get('raw_data'),
            performed_by=user
        )

    # Finalize batch totals
    upload_batch.total_rows = total_count
    upload_batch.success_rows = success_count
    upload_batch.failed_rows = failed_count
    
    if failed_count == 0:
        upload_batch.status = 'completed'
    elif success_count == 0:
        upload_batch.status = 'failed'
    else:
        upload_batch.status = 'partial'
        
    upload_batch.save()
    return upload_batch


def parse_sap_row(row):
    """
    Validation + Normalization logic for SAP Fuel procurement.
    """
    reasons = []
    is_valid = True
    is_suspicious = False
    
    plant_code = row.get('plant_code', '').strip()
    fuel_type = row.get('fuel_type', '').strip()
    quantity_str = row.get('quantity', '').strip()
    unit = row.get('unit', '').strip()
    cost_center = row.get('cost_center', '').strip()
    
    # 1. Critical Validation (Makes record invalid/Failed)
    if not quantity_str:
        return False, True, ["Missing fuel quantity value."], {}
        
    try:
        qty = Decimal(quantity_str)
        if qty <= 0:
            is_suspicious = True
            reasons.append(f"SAP quantity is zero or negative: {qty}.")
    except (InvalidOperation, ValueError):
        return False, True, [f"Invalid quantity numeric string: '{quantity_str}'."], {}

    # 2. Suspicious Indicators
    if not fuel_type:
        is_suspicious = True
        reasons.append("Missing fuel type specifier.")
    elif fuel_type.upper() not in VALID_FUELS:
        is_suspicious = True
        reasons.append(f"Unseeded SAP fuel type flagged: '{fuel_type}'.")

    if not plant_code:
        is_suspicious = True
        reasons.append("Missing SAP plant code reference.")
    elif plant_code.upper() not in VALID_PLANTS:
        is_suspicious = True
        reasons.append(f"Unknown plant code: '{plant_code}'.")

    # Normalize values
    norm_qty, norm_unit = normalize_sap_fuel(qty, unit, fuel_type)
    
    # Check unit validation
    if not unit:
        is_suspicious = True
        reasons.append("SAP unit field is blank.")
    
    data = {
        'category': 'Fuel & Procurement',
        'activity_type': fuel_type if fuel_type else 'Unknown Fuel',
        'quantity': qty,
        'unit': unit,
        'normalized_quantity': norm_qty,
        'normalized_unit': norm_unit,
        'emission_scope': get_emission_scope('sap'),
    }
    
    return is_valid, is_suspicious, reasons, data


def parse_utility_row(row):
    """
    Validation + Normalization logic for Utility Electricity records.
    """
    reasons = []
    is_valid = True
    is_suspicious = False
    
    meter_id = row.get('meter_id', '').strip()
    billing_period = row.get('billing_period', '').strip()
    consumption_str = row.get('consumption', '').strip()
    unit = row.get('unit', '').strip()
    tariff_type = row.get('tariff_type', '').strip()

    # 1. Critical Validation
    if not billing_period:
        return False, True, ["Billing period dates are required."], {}
        
    if not consumption_str:
        return False, True, ["Missing consumption/usage metrics."], {}

    try:
        consumption = Decimal(consumption_str)
    except (InvalidOperation, ValueError):
        return False, True, [f"Invalid utility consumption format: '{consumption_str}'."], {}

    # 2. Suspicious Indicators
    if consumption < 0:
        is_suspicious = True
        reasons.append(f"Electricity negative consumption detected: {consumption}.")

    if not meter_id:
        is_suspicious = True
        reasons.append("Utility meter ID identifier is blank.")

    # Normalize values
    norm_qty, norm_unit = normalize_utility_electricity(consumption, unit)
    
    data = {
        'category': 'Electricity',
        'activity_type': f"Grid Electricity ({tariff_type})" if tariff_type else 'Grid Electricity',
        'quantity': consumption,
        'unit': unit,
        'normalized_quantity': norm_qty,
        'normalized_unit': norm_unit,
        'emission_scope': get_emission_scope('utility'),
    }
    
    return is_valid, is_suspicious, reasons, data


def parse_travel_row(row):
    """
    Validation + Normalization logic for Corporate Travel records.
    """
    reasons = []
    is_valid = True
    is_suspicious = False
    
    employee = row.get('employee_name', '').strip()
    travel_type = row.get('travel_type', '').strip()
    from_airport = row.get('from_airport', '').strip()
    to_airport = row.get('to_airport', '').strip()
    distance_str = row.get('distance', '').strip()
    hotel_nights_str = row.get('hotel_nights', '').strip()

    # 1. Critical Validation
    if not travel_type:
        return False, True, ["Travel activity type is missing."], {}
        
    travel_type_upper = travel_type.upper()
    if travel_type_upper not in VALID_TRAVEL_TYPES:
        is_suspicious = True
        reasons.append(f"Unrecognized travel type: '{travel_type}'.")

    # Determine metric quantity
    distance = None
    hotel_nights = None
    
    if travel_type_upper == 'HOTEL':
        if not hotel_nights_str:
            return False, True, ["Missing hotel nights count."], {}
        try:
            hotel_nights = Decimal(hotel_nights_str)
            if hotel_nights <= 0:
                is_suspicious = True
                reasons.append(f"Suspicious stay quantity: {hotel_nights}.")
        except (InvalidOperation, ValueError):
            return False, True, [f"Invalid hotel nights format: '{hotel_nights_str}'."], {}
    else:
        # Distance travel (flight/ground)
        if not distance_str:
            return False, True, ["Missing travel distance."], {}
        try:
            distance = Decimal(distance_str)
            if distance <= 0:
                return False, True, [f"Distance cannot be zero or negative: {distance}."], {}
        except (InvalidOperation, ValueError):
            return False, True, [f"Invalid distance format: '{distance_str}'."], {}

    # 2. Suspicious Indicators
    if not employee:
        is_suspicious = True
        reasons.append("Missing traveler employee name.")

    if travel_type_upper == 'FLIGHT':
        if not from_airport or not to_airport:
            is_suspicious = True
            reasons.append("Flight is missing IATA airport codes.")
        elif len(from_airport) != 3 or len(to_airport) != 3:
            is_suspicious = True
            reasons.append(f"Invalid airport code lengths ({from_airport} -> {to_airport}).")

    # Normalize values
    unit = 'MI' if (distance and distance_str.lower().endswith('mi')) else 'KM'
    
    if travel_type_upper == 'HOTEL':
        norm_qty, norm_unit = normalize_travel_data(hotel_nights, 'nights', travel_type)
        qty = hotel_nights
        orig_unit = 'nights'
        activity = 'Hotel Stay'
    else:
        norm_qty, norm_unit = normalize_travel_data(distance, unit, travel_type)
        qty = distance
        orig_unit = unit
        activity = f"{travel_type.title()} Travel"

    data = {
        'category': travel_type_upper.title(),
        'activity_type': activity,
        'quantity': qty,
        'unit': orig_unit,
        'normalized_quantity': norm_qty,
        'normalized_unit': norm_unit,
        'emission_scope': get_emission_scope('travel'),
    }
    
    return is_valid, is_suspicious, reasons, data

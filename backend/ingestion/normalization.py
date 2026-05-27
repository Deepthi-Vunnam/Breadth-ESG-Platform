from decimal import Decimal

# Strict Unit Normalization Mapping Rules
SAP_LIQUID_UNITS = {'L', 'LITERS', 'LITER', 'LITRE', 'LITRES'}
SAP_GAS_UNITS = {'M3', 'CUBIC METERS', 'CUBIC METER'}
SAP_GALLON_UNITS = {'GAL', 'GALLONS', 'GALLON'}

UTILITY_KWH_UNITS = {'KWH', 'KILOWATT-HOUR', 'KILOWATT-HOURS'}
UTILITY_MWH_UNITS = {'MWH', 'MEGAWATT-HOUR', 'MEGAWATT-HOURS'}
UTILITY_WH_UNITS = {'WH', 'WATT-HOUR', 'WATT-HOURS'}

TRAVEL_KM_UNITS = {'KM', 'KILOMETER', 'KILOMETERS'}
TRAVEL_MILE_UNITS = {'MILE', 'MILES', 'MI'}

def normalize_sap_fuel(quantity, unit, fuel_type):
    """
    Normalizes SAP fuel quantities.
    Liquids normalized to Liters ('L').
    Gases (e.g., Natural Gas) normalized to Cubic Meters ('m3').
    """
    if quantity is None:
        return None, None
    
    qty = Decimal(str(quantity))
    unit_upper = str(unit).strip().upper()
    fuel_upper = str(fuel_type).strip().upper()
    
    # Gas category check
    if 'GAS' in fuel_upper or 'NATURAL' in fuel_upper:
        if unit_upper in SAP_GAS_UNITS:
            return qty, 'm3'
        else:
            # Assume m3 by default for gas but flag as suspicious
            return qty, 'm3'
            
    # Liquid fuels
    if unit_upper in SAP_LIQUID_UNITS:
        return qty, 'L'
    elif unit_upper in SAP_GALLON_UNITS:
        return qty * Decimal('3.78541'), 'L'
    
    # Fallback to Liters if unknown liquid
    return qty, 'L'


def normalize_utility_electricity(quantity, unit):
    """
    Normalizes utility consumption to Kilowatt-hours ('kWh').
    """
    if quantity is None:
        return None, None
        
    qty = Decimal(str(quantity))
    unit_upper = str(unit).strip().upper()
    
    if unit_upper in UTILITY_KWH_UNITS:
        return qty, 'kWh'
    elif unit_upper in UTILITY_MWH_UNITS:
        return qty * Decimal('1000'), 'kWh'
    elif unit_upper in UTILITY_WH_UNITS:
        return qty / Decimal('1000'), 'kWh'
        
    # Standard fallback
    return qty, 'kWh'


def normalize_travel_data(distance, unit, travel_type):
    """
    Normalizes travel logs:
    - Distance fields to Kilometers ('km').
    - Stay fields to Nights ('nights') for hotels.
    """
    travel_type_upper = str(travel_type).strip().upper()
    
    if 'HOTEL' in travel_type_upper:
        # Hotel stay is normalized to nights
        return Decimal(str(distance or 0)), 'nights'
        
    if distance is None:
        return None, None
        
    qty = Decimal(str(distance))
    unit_upper = str(unit).strip().upper() if unit else 'KM'
    
    if unit_upper in TRAVEL_KM_UNITS:
        return qty, 'km'
    elif unit_upper in TRAVEL_MILE_UNITS:
        return qty * Decimal('1.60934'), 'km'
        
    return qty, 'km'


def get_emission_scope(source_type, category=None):
    """
    Maps source categories to Greenhouse Gas Protocol scopes:
    - Scope 1: Fuel & Procurement (SAP)
    - Scope 2: Electricity Usage (Utility)
    - Scope 3: Travel Operations (Corporate Travel)
    """
    source_lower = str(source_type).strip().lower()
    if source_lower == 'sap':
        return 1
    elif source_lower == 'utility':
        return 2
    elif source_lower == 'travel':
        return 3
    return 3 # standard baseline

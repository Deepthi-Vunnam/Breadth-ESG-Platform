# Ingestion Data Sources Research

This document outlines the real-world formatting of the three ingested corporate data sources, what was simulated, and what would fail in a production environment.

---

## 1. SAP Fuel & Procurement Data
* **Researched Format**: SAP MM (Materials Management) and FICO (Financial Accounting) table extracts. These contain plant identifiers (`Werks`), fuel purchases, booking dates, and cost allocations (`Kostenstelle`).
* **What was learned**: Extracts from German SAP instances frequently contain mixed language headers (e.g. `Werk` instead of `Plant Code`, `Menge` instead of `Quantity`) and mixed units based on regional purchase channels (Liters vs Gallons).
* **Sample Data Realism**: The SAP sample CSV simulates:
  * Regional plant codes (`DE-01`, `US-01`)
  * Unsupported raw units (`Gal`) that normalizations convert to Liters
  * Missing fuel quantities (failed row) and unseeded plant codes (suspicious alert).
* **What breaks in Production**: If a supplier modifies fuel descriptions (e.g. `Bio-Diesel B20` instead of standard `Diesel`), the parser might fail validation unless fuel classifications are mapped dynamically.

---

## 2. Utility Electricity Bills
* **Researched Format**: Utility provider portals (like PG&E, National Grid, or E.ON) export utility reports showing meter points, billing cycles, kilowatt consumption, and tariffs.
* **What was learned**: Energy bills rarely align with month starts (e.g. bills run Feb 14 to Mar 13). Portals also export consumption in different scale units (Wh, kWh, MWh) depending on industrial vs. office sizes.
* **Sample Data Realism**: The sample data simulates:
  * Non-standard billing intervals (`2026-04-15 to 2026-05-15`)
  * Large industrial values in Megawatts (`12.5 MWh` normalized to `12,500 kWh`)
  * Suspicious negative inputs representing grid-backfeeding or recording errors.
* **What breaks in Production**: Billing dates might contain varying date strings (e.g. `MM/DD/YYYY` vs. `DD-MM-YYYY`), requiring a flexible date parser.

---

## 3. Corporate Travel Data
* **Researched Format**: Concur or TravelPerk activity exports detailing booking items (Flights, Hotels, Trains).
* **What was learned**: Travel logs are highly inconsistent: flight distances might be missing, and hotels are measured in nights stayed while flights are logged by airport codes and distance.
* **Sample Data Realism**: The travel sample CSV simulates:
  * Travel types (`Flight`, `Hotel`, `Ground Transport`)
  * Flight entries missing airport codes (suspicious alert)
  * Hotel entries with zero nights (suspicious alert)
  * Distance-less hotel rows vs. night-less flight rows.
* **What breaks in Production**: Multi-stop flight bookings (e.g. `JFK -> LHR -> CDG`) require segment parsing to compute accurate cumulative distances.

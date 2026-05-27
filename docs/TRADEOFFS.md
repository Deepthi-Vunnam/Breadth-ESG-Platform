# Engineering Trade-Offs

To maintain an interview-defensible, focused project structure, we intentionally left out three complex features. This document explains the rationale behind these omissions.

---

## 1. Emission Factor Calculations (CO₂e)
* **What was left out**: We do not multiply normalized quantities (Liters of Diesel, kWh of Grid Electricity) by carbon emission factors (e.g. converting Liters to kgCO₂e).
* **Why**: Emission factors vary based on geographic grid location, fuel grades, and annual updates from environmental bodies (like EPA or DEFRA). Incorporating database tables for hundreds of emission factors would distract from demonstrating core data modeling and unit-normalization.
* **Production Alternative**: In production, we would integrate an external API (like Climatiq) or establish a background lookup table matching localized factors to convert quantities into kgCO₂e.

---

## 2. Automated OCR & PDF Ingestion
* **What was left out**: Direct ingestion of PDF utility bills or image-based corporate travel receipts.
* **Why**: Running OCR engines (like Tesseract) or layout models inside web requests creates severe memory footprints and latency spikes. Building models to parse varying provider structures is a separate machine-learning challenge.
* **Production Alternative**: Defer PDF uploads to an asynchronous task queue (like Celery), run layout extraction (using AWS Textract or similar services), and parse the structured output in the background.

---

## 3. Role-Based Access Control (RBAC)
* **What was left out**: Granular permissions preventing certain analysts from accessing SAP or utility data (e.g. read-only vs. read-write permissions per tenant).
* **Why**: Adding complex RBAC decorators and table-joins complicates JWT authorization filters.
* **Production Alternative**: Implement a Django group-permission mapping system or use Django Guarded to restrict object-level permissions, routing queries through tenant groups.

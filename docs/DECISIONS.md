# Technical Decisions & Assumptions

This document outlines the architectural decisions, design assumptions, and resolved ambiguities that shaped the CarbonFlow ESG Platform.

---

## 1. Why CSV Ingestion Was Chosen
* **Industry Standard**: In real-world enterprise ESG workflows, utility portals, travel management software, and ERP modules (like SAP) export structured reports as CSV or Excel sheets rather than exposing active real-time REST APIs.
* **Low Integration Overhead**: Allows company tenants to get started with zero API engineering costs.
* **Preservation of Raw Inputs**: By ingesting CSVs, the platform acts as an archival repository, storing the original messy strings in `raw_data` for legal audits.

---

## 2. Ingestion Rules & Assumptions
* **Tenant Isolation**: An analyst must choose a `Company` tenant in the navbar before running uploads. It is assumed that files are segregated and only contain records for a single organization.
* **Implicit Distance Units**: For corporate travel, if a distance doesn't have an explicit suffix, it is assumed to be in Kilometers (`km`) unless the file originates from a US entity where Miles are default. The parser checks if the string ends in `mi`/`miles` to convert it, falling back to `km`.
* **Zero Distance**: Travel distances must be greater than zero. A distance of zero is treated as invalid (failed) for flights and ground transfers, but hotel stays are allowed to have zero distance (which shifts the validation check to verify `Hotel Nights` instead).

---

## 3. Ambiguities Resolved
* **German SAP Column Names**: German procurement offices extract spreadsheets containing columns like `Betriebsstätte` (Plant) and `Menge` (Quantity). We mapped these German terms as standard header aliases so the parser handles them out of the box.
* **Approval Lockout**: Once an analyst approves a record, it becomes locked (`status='approved'`). No subsequent patch operations or rejections are permitted on that record to ensure it is audit-safe.
* **Failed Rows Representation**: Malformed rows (e.g. non-numeric quantity) are still written to the database with a status of `failed` and `is_suspicious=True`. This is a compliance choice: hiding failed rows from the database makes it impossible for auditors to verify if an analyst tampered with the original file.

---

## 4. Intentionally Ignored Edge Cases
* **Duplicate Upload Prevention**: The platform does not check if an analyst uploads the same CSV file twice. In production, a cryptographic hash check of the file would be run.
* **Billing Period Overlaps**: For utility data, billing periods might overlap (e.g., two bills covering the same date range). The platform records both as separate activities.
* **Tariff Calculations**: We record tariff categories (e.g. Peak vs. Off-peak) but do not perform calculations or conversions based on tariffs.

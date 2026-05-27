# Breathe ESG - Carbon Data Ingestion & Review Platform

Breathe ESG (CarbonFlow ESG Platform) is a full-stack corporate carbon accounting, unit normalization, and compliance audit platform. 

All the code and files generated during this conversation are **already stored locally on your machine** in the workspace folder:
📂 **`C:\Users\srava\Downloads\CarbonFlow_ESG_Platform`**

You can open this folder directly in **VS Code** to inspect, run, or edit the project.

---

## 📂 Project Structure

```
CarbonFlow_ESG_Platform/
├── backend/                  # Django REST Framework API
│   ├── breathe_esg/          # Django Project settings and routing
│   ├── core/                 # Organization management & Audit logs
│   ├── ingestion/            # CSV Parsing, validations & normalization
│   ├── db.sqlite3            # SQLite Local database
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── manage.py             # Django admin CLI utility
├── frontend/                 # React + Vite Client
│   ├── src/                  # Page components, auth context & routing
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind colors & typography config
│   └── postcss.config.js     # PostCSS loader configuration
├── docs/                     # Compliance Documentation
│   ├── MODEL.md              # Database schemas & normalization strategies
│   ├── DECISIONS.md          # Architectural assumptions and decisions
│   ├── TRADEOFFS.md          # Intentionally omitted features & rationale
│   └── SOURCES.md            # Research formats & production boundaries
└── sample-data/              # Seed CSV records for SAP, Utility & Travel
    ├── sap_fuel_procurement.csv
    ├── utility_electricity.csv
    └── corporate_travel.csv
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your system:
* **Python** (version 3.10 or 3.11 preferred)
* **Node.js** (version 18 or 20 LTS preferred)
* **git** (optional)

---

## 🛠️ Step-by-Step Local Setup

Follow these commands in your terminal to run the platform locally in VS Code:

### 1. Open the project in VS Code
Open your VS Code and select **File > Open Folder...**, then select:
`C:\Users\srava\Downloads\CarbonFlow_ESG_Platform`

Open your VS Code terminal (**Ctrl + `** or **Terminal > New Terminal**).

---

### 2. Backend Setup (Django REST API)

In your VS Code terminal, run the following to configure the database, seed accounts, and start the API server:

```powershell
# 1. Navigate into the backend directory
cd backend

# 2. Create a virtual environment (recommended)
python -m venv venv

# 3. Activate the virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# 4. Install python dependencies
pip install -r requirements.txt

# 5. Create your local environment file
Copy-Item .env.example .env

# 6. Apply database migrations
python manage.py migrate

# 7. Seed corporate tenants and analyst user accounts
python manage.py seed_data

# 8. Start the Django development server
python manage.py runserver
```

The backend API will start running at: **`http://127.0.0.1:8000/`**

---

### 3. Frontend Setup (React + Vite + TailwindCSS)

Open a **second terminal window** in VS Code (click the `+` sign in the terminal bar) and run the following to install packages and start the web interface:

```powershell
# 1. Navigate into the frontend directory
cd frontend

# 2. Install package dependencies
npm install

# 3. Start the Vite React development server
npm run dev
```

The web dashboard will start running at: **`http://localhost:5173/`**

---

## 🔐 Demonstration Credentials

Use these seeded credentials on the login screen to access the analyst dashboards:

| User Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Lead Analyst** | `analyst` | `password123` |
| **Super Administrator** | `admin` | `adminpassword` |

---

## 🧪 Testing the Ingestion Pipeline

Once logged in:
1. Select one of the pre-seeded tenant organizations in the navbar dropdown (e.g. `CarbonFlow International`).
2. Go to the **Ingestion Portal** in the sidebar.
3. Choose a data source tab (SAP, Utility, or Travel).
4. Upload the corresponding sample file from the `sample-data/` folder on your machine:
   * **SAP:** `sample-data/sap_fuel_procurement.csv`
   * **Utility:** `sample-data/utility_electricity.csv`
   * **Travel:** `sample-data/corporate_travel.csv`
5. Click **Launch Ingestion Pipeline** and watch the dashboard update!

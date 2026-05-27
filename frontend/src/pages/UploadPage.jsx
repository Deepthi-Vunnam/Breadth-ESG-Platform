import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2
} from 'lucide-react';

const UploadPage = () => {
  const { activeCompany } = useAuth();
  
  const [activeTab, setActiveTab] = useState('sap'); // sap, utility, travel
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadLogs, setUploadLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeCompany) {
      loadUploadLogs();
    }
  }, [activeCompany]);

  const loadUploadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get(`/api/uploads/?company=${activeCompany.id}`);
      setUploadLogs(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load upload history logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setUploadResult(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }
    if (!activeCompany) {
      setError('No active tenant company selected.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', activeCompany.id);

    try {
      const res = await api.post(`/api/upload/${activeTab}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadResult(res.data.summary);
      setFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
      
      await loadUploadLogs();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        'Ingestion failed due to a parsing or connection error.'
      );
    } finally {
      setUploading(false);
    }
  };

  const getSourceDetails = () => {
    switch (activeTab) {
      case 'sap':
        return {
          title: 'SAP Fuel & Procurement Data',
          scope: 'Scope 1 - Direct Emissions',
          columns: ['Plant Code', 'Fuel Type', 'Quantity', 'Unit', 'Date', 'Cost Center'],
          germanColumns: ['Werk (Plant)', 'Kraftstoff (Fuel)', 'Menge (Quantity)', 'Einheit (Unit)', 'Datum (Date)', 'Kostenstelle (Cost Center)'],
          description: 'Used to ingest direct fuel consumption from SAP ERP exports. Handles messy German terms, date translations, and liquid/gas unit mapping.'
        };
      case 'utility':
        return {
          title: 'Utility Electricity Data',
          scope: 'Scope 2 - Indirect Emissions',
          columns: ['Meter ID', 'Billing Period', 'Consumption', 'Unit', 'Tariff Type'],
          germanColumns: ['Zählernummer (Meter)', 'Zeitraum (Period)', 'Verbrauch (Consumption)', 'Einheit (Unit)', 'Tarif (Tariff)'],
          description: 'Ingests electricity utility usage data. Resolves varying billing cycles and normalizes all electricity units (Wh, kWh, MWh) into kWh.'
        };
      case 'travel':
        return {
          title: 'Corporate Travel Logs',
          scope: 'Scope 3 - Value Chain Emissions',
          columns: ['Employee Name', 'Travel Type', 'From Airport', 'To Airport', 'Distance', 'Hotel Nights'],
          germanColumns: ['Mitarbeiter (Employee)', 'Reiseart (Type)', 'Abflughafen (From)', 'Zielflughafen (To)', 'Entfernung (Distance)'],
          description: 'Calculates value chain travel activities. Handles employee travel categories (Flight, Hotel, Ground) and normalizes distances (miles/km) to km.'
        };
      default:
        return {};
    }
  };

  const activeDetails = getSourceDetails();

  return (
    <Layout title="Ingestion Portal">
      {/* Upload Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ingestion Console */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveTab('sap'); setError(''); setUploadResult(null); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'sap' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. SAP Fuel (Scope 1)
            </button>
            <button
              onClick={() => { setActiveTab('utility'); setError(''); setUploadResult(null); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'utility' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Utility Bills (Scope 2)
            </button>
            <button
              onClick={() => { setActiveTab('travel'); setError(''); setUploadResult(null); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'travel' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Corporate Travel (Scope 3)
            </button>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-2xl p-6 relative">
            <div>
              <span className="text-[10px] text-brand-400 uppercase tracking-widest font-bold">
                {activeDetails.scope}
              </span>
              <h3 className="text-lg font-bold text-slate-200 mt-1">
                Ingest {activeDetails.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">
                {activeDetails.description}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Success Results Banner */}
            {uploadResult && (
              <div className="mt-5 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Ingestion Completed Successfully</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-emerald-500/20 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Processed</span>
                    <p className="text-xl font-extrabold text-slate-200 mt-1 font-mono">{uploadResult.total_rows}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Clean Records</span>
                    <p className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">{uploadResult.success_rows - uploadResult.failed_rows}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase font-semibold">Suspicious / Failed</span>
                    <p className="text-xl font-extrabold text-amber-400 mt-1 font-mono">
                      {uploadResult.failed_rows}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="mt-6 space-y-6">
              {/* Uploader Box */}
              <div className="relative border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-900/80">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                <div className="bg-slate-800 p-4 rounded-full text-slate-400 border border-slate-700/80 mb-4 shadow shadow-slate-950">
                  <UploadCloud className="w-8 h-8" />
                </div>
                
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-brand-300 truncate max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      Drag & Drop CSV File here
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                      or click to browse local folders
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-brand-500/10 text-sm shadow-md"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Normalizing Rows...</span>
                  </>
                ) : (
                  <span>Launch Ingestion Pipeline</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic CSV Help Sidebar */}
        <div className="glass-card rounded-2xl p-6 h-fit space-y-4">
          <h4 className="font-bold text-slate-200 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-400" />
            <span>Format Guidelines</span>
          </h4>
          
          <div className="space-y-4 text-xs font-medium">
            <p className="text-slate-400 leading-relaxed">
              Ensure your CSV exports contain the following standard headers. Aliases and German names are matched automatically:
            </p>
            
            <div className="space-y-2.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Standard Columns</span>
              <div className="flex flex-wrap gap-1.5">
                {activeDetails.columns?.map((c) => (
                  <span key={c} className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded font-mono">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">German / Messy Aliases matched</span>
              <div className="flex flex-wrap gap-1.5">
                {activeDetails.germanColumns?.map((c) => (
                  <span key={c} className="px-2 py-1 bg-slate-900/60 border border-slate-800/80 text-slate-400 rounded font-mono">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Ledger List */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-200 pb-4 border-b border-slate-700/40">
          Tenant Ingestion History
        </h3>

        <div className="mt-4 overflow-x-auto">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              <span>Fetching batch logs...</span>
            </div>
          ) : uploadLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No historical uploads registered for this tenant company.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Batch ID / Filename</th>
                  <th className="pb-3 font-semibold">Source Type</th>
                  <th className="pb-3 font-semibold text-center">Clean / Total Rows</th>
                  <th className="pb-3 font-semibold">Uploaded By</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {uploadLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/20 text-slate-300">
                    <td className="py-3 text-xs text-slate-400">
                      {new Date(log.uploaded_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-medium">
                      <div className="max-w-[220px] truncate" title={log.file_name}>
                        {log.file_name}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5 select-all">
                        {log.id}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs uppercase font-semibold">
                        {log.source_type_display}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-emerald-400 font-semibold">{log.success_rows - log.failed_rows}</span>
                        <span className="text-slate-500">/</span>
                        <span>{log.total_rows}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {log.uploaded_by_details?.first_name 
                        ? `${log.uploaded_by_details.first_name} ${log.uploaded_by_details.last_name || ''}` 
                        : log.uploaded_by_details?.username || 'System'}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.status === 'failed'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.status_display}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UploadPage;

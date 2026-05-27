import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Database, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { activeCompany } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    suspicious: 0,
    approved: 0,
  });
  const [recentUploads, setRecentUploads] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompany) {
      loadDashboardData();
    }
  }, [activeCompany]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch records to calculate active company statistics
      const recordsRes = await api.get(`/api/records/?company_id=${activeCompany.id}`);
      const records = recordsRes.data.results || recordsRes.data;
      
      const computedStats = {
        total: records.length,
        pending: records.filter(r => r.status === 'pending_review').length,
        suspicious: records.filter(r => r.is_suspicious && r.status !== 'approved' && r.status !== 'failed').length,
        approved: records.filter(r => r.status === 'approved').length,
      };
      setStats(computedStats);

      // 2. Fetch recent uploads
      const uploadsRes = await api.get(`/api/uploads/?company=${activeCompany.id}`);
      const uploads = uploadsRes.data.results || uploadsRes.data;
      setRecentUploads(uploads.slice(0, 5));

      // 3. Store pending suspicious records for the quick-action panel
      setPendingRecords(
        records.filter(r => r.is_suspicious && r.status === 'pending_review').slice(0, 5)
      );

    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'sap':
        return <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold uppercase">SAP Fuel</span>;
      case 'utility':
        return <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold uppercase">Utility</span>;
      case 'travel':
        return <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold uppercase">Travel</span>;
      default:
        return <span className="px-2 py-1 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-semibold uppercase">{source}</span>;
    }
  };

  return (
    <Layout title="ESG Activity Dashboard">
      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
            <div className="h-96 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900/40 to-emerald-950/20 border border-brand-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-400" />
                <span>Overview: {activeCompany?.company_name}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Scope 1, 2, and 3 carbon data normalization pipeline status.
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ingest CSV Data</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Records */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ledger Rows</p>
                <h4 className="text-2xl font-extrabold text-slate-100 mt-1 font-sans">{stats.total}</h4>
              </div>
            </div>

            {/* Suspicious Rows */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suspicious Rows</p>
                <h4 className="text-2xl font-extrabold text-amber-400 mt-1 font-sans">{stats.suspicious}</h4>
              </div>
            </div>

            {/* Pending Reviews */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</p>
                <h4 className="text-2xl font-extrabold text-slate-100 mt-1 font-sans">{stats.pending}</h4>
              </div>
            </div>

            {/* Approved Rows */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit Locked</p>
                <h4 className="text-2xl font-extrabold text-emerald-400 mt-1 font-sans">{stats.approved}</h4>
              </div>
            </div>
          </div>

          {/* Detailed Lists Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Uploads Batch Track */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                  <span>Recent Ingestion Batches</span>
                </h4>
                <button
                  onClick={() => navigate('/upload')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>View uploads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
                {recentUploads.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                    No uploads processed for this company yet.
                  </div>
                ) : (
                  recentUploads.map((batch) => (
                    <div key={batch.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-200">{batch.file_name}</span>
                          {getSourceBadge(batch.source_type)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">
                          Uploaded: {new Date(batch.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                            <span className="text-emerald-400 font-semibold">{batch.success_rows}</span> / 
                            <span>{batch.total_rows} Succeeded</span>
                          </div>
                          {batch.failed_rows > 0 && (
                            <span className="text-[10px] text-red-400 font-semibold">
                              {batch.failed_rows} failed rows
                            </span>
                          )}
                        </div>
                        
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          batch.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : batch.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {batch.status_display}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Action review panel */}
            <div className="glass-card rounded-2xl p-6 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Action Items</span>
                </h4>
                <button
                  onClick={() => navigate('/review?is_suspicious=true')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Verify ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
                {pendingRecords.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center px-4">
                    🎉 Excellent! No suspicious rows are pending review for this tenant.
                  </div>
                ) : (
                  pendingRecords.map((record) => (
                    <div 
                      key={record.id} 
                      onClick={() => navigate(`/review?record_id=${record.id}`)}
                      className="p-3.5 bg-slate-900/60 hover:bg-slate-800/40 transition-colors border border-slate-800 hover:border-amber-500/20 rounded-xl cursor-pointer flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs text-slate-200">
                          ID: {record.id} • {record.category}
                        </span>
                        {getSourceBadge(record.source_type)}
                      </div>
                      
                      <div className="text-xs text-slate-400 flex items-center gap-1 justify-between mt-1">
                        <span className="truncate max-w-[150px]">Activity: {record.activity_type}</span>
                        <span className="font-bold text-slate-200 shrink-0">
                          {record.normalized_quantity} {record.normalized_unit}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-amber-400 font-medium bg-amber-500/5 p-2 rounded border border-amber-500/10 truncate">
                        ⚠️ {record.suspicious_reasons || 'Flagged Suspicious'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;

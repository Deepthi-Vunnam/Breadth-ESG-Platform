import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  History, 
  User, 
  ArrowRight,
  Eye, 
  Filter, 
  X,
  PlusCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

const AuditLogsPage = () => {
  const { activeCompany } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (activeCompany) {
      loadAuditLogs();
    }
  }, [activeCompany, actionFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/audit-logs/`;
      if (actionFilter) {
        url += `?action=${actionFilter}`;
      }
      const res = await api.get(url);
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'upload':
        return (
          <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
        );
      case 'approve':
        return (
          <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        );
      case 'reject':
        return (
          <div className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-lg shrink-0">
            <History className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <Layout title="Compliance Audit Trails">
      {/* Filtering Header Panel */}
      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-200">
            Cryptographic Activity Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
            Immutable logs of upload batches, approvals, and modifications for compliance verification.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Audit Operations</option>
            <option value="upload" className="bg-slate-900">CSV Uploads</option>
            <option value="approve" className="bg-slate-900">Approvals</option>
            <option value="reject" className="bg-slate-900">Rejections</option>
          </select>
        </div>
      </div>

      {/* Audit History Logs Table */}
      <div className="glass-card rounded-2xl p-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              <span>Fetching audit entries...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No audit logs captured for this filter query.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold w-16">Icon</th>
                  <th className="pb-3 font-semibold">Operation Details</th>
                  <th className="pb-3 font-semibold">Target Record ID</th>
                  <th className="pb-3 font-semibold">Performed By</th>
                  <th className="pb-3 font-semibold">Audit Timestamp</th>
                  <th className="pb-3 font-semibold text-right">Ledger Diffs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/10 text-slate-300 transition-colors">
                    <td className="py-3">
                      {getActionIcon(log.action)}
                    </td>
                    <td className="py-3 font-medium">
                      <span className="text-slate-200 font-bold block text-sm">
                        {log.action_display}
                      </span>
                      {log.record_category && (
                        <span className="text-[10px] text-slate-500 block font-medium mt-0.5 uppercase tracking-wide">
                          {log.record_category} • {log.record_source_type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-400 text-xs">
                      {log.record ? `#${log.record}` : '— (Deleted record)'}
                    </td>
                    <td className="py-3 text-slate-400 text-xs flex items-center gap-1.5 pt-4">
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {log.performed_by_details?.first_name 
                          ? `${log.performed_by_details.first_name} ${log.performed_by_details.last_name || ''}` 
                          : log.performed_by_details?.username || 'System'}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-lg transition-colors"
                        title="Inspect Snapshot Diffs"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Snapshot Inspector Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-2xl relative animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-brand-400" />
                  <span>Audit Log Inspector</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Log ID: {selectedLog.id} • Action: {selectedLog.action_display}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diffs body content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Snapshot Diff details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {/* Old Value */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-sans">
                    Previous State Snapshot
                  </span>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-400 overflow-x-auto max-h-[450px] scrollbar">
                    {selectedLog.old_value ? (
                      <pre className="select-all">
                        {JSON.stringify(selectedLog.old_value, null, 2)}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-slate-600 font-sans italic">
                        Empty initial state (Creation Operation).
                      </div>
                    )}
                  </div>
                </div>

                {/* New Value */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-sans flex items-center gap-1">
                    <span>New State Snapshot</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                  </span>
                  <div className="bg-slate-950 p-4 rounded-xl border border-brand-500/10 text-emerald-400 overflow-x-auto max-h-[450px] scrollbar">
                    {selectedLog.new_value ? (
                      <pre className="select-all">
                        {JSON.stringify(selectedLog.new_value, null, 2)}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-slate-600 font-sans italic">
                        Record deleted.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Log Metadata card */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-400 font-medium">
                <div className="flex justify-between">
                  <span>Action performed by:</span>
                  <span className="text-slate-200">
                    {selectedLog.performed_by_details?.first_name 
                      ? `${selectedLog.performed_by_details.first_name} ${selectedLog.performed_by_details.last_name || ''}` 
                      : selectedLog.performed_by_details?.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="text-slate-200">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AuditLogsPage;

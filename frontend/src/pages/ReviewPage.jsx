import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Check, 
  X, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  XCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock
} from 'lucide-react';

const ReviewPage = () => {
  const { activeCompany } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSuspiciousFilter = queryParams.get('is_suspicious') || '';
  const initialRecordIdFilter = queryParams.get('record_id') || '';

  // API State
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [suspiciousFilter, setSuspiciousFilter] = useState(initialSuspiciousFilter);
  
  // Modal & Drawer UI state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionRecord, setActionRecord] = useState(null); // record being approved/rejected
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [reviewNotes, setReviewNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      loadRecords();
    }
  }, [activeCompany, sourceFilter, statusFilter, suspiciousFilter, search]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      let url = `/api/records/?company_id=${activeCompany.id}`;
      if (sourceFilter) url += `&source_type=${sourceFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (suspiciousFilter) url += `&is_suspicious=${suspiciousFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await api.get(url);
      const data = res.data.results || res.data;
      setRecords(data);
      
      // If a specific record ID parameter was passed, open it immediately
      if (initialRecordIdFilter) {
        const target = data.find(r => String(r.id) === initialRecordIdFilter);
        if (target) setSelectedRecord(target);
      }
    } catch (err) {
      console.error("Failed to load records ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScopeBadge = (scope) => {
    switch (scope) {
      case 1:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">Scope 1</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase">Scope 2</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">Scope 3</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold uppercase tracking-wider">Rejected</span>;
      case 'failed':
        return <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold uppercase tracking-wider">Failed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold uppercase tracking-wider">Reviewing</span>;
    }
  };

  const handleAnalystAction = async () => {
    setNotesError('');
    if (actionType === 'reject' && !reviewNotes.trim()) {
      setNotesError('Justification review notes are mandatory to reject records.');
      return;
    }

    setActionSubmitting(true);
    try {
      const endpoint = `/api/records/${actionRecord.id}/${actionType}/`;
      const res = await api.patch(endpoint, { review_notes: reviewNotes });
      
      // Update record in state
      const updated = res.data.record;
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (selectedRecord && selectedRecord.id === updated.id) {
        setSelectedRecord(updated);
      }
      
      // Close forms
      setActionRecord(null);
      setReviewNotes('');
    } catch (err) {
      console.error(err);
      setNotesError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <Layout title="Emission Records Review Ledger">
      
      {/* Search & Filter Header Panel */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by category, fuel, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          {/* Source Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Sources</option>
              <option value="sap" className="bg-slate-900">SAP Fuel</option>
              <option value="utility" className="bg-slate-900">Utility Bills</option>
              <option value="travel" className="bg-slate-900">Corporate Travel</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="pending_review" className="bg-slate-900">Reviewing</option>
              <option value="approved" className="bg-slate-900">Approved</option>
              <option value="rejected" className="bg-slate-900">Rejected</option>
              <option value="failed" className="bg-slate-900">Failed Ingestion</option>
            </select>
          </div>

          {/* Suspicious Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <select
              value={suspiciousFilter}
              onChange={(e) => setSuspiciousFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">Verification Filter</option>
              <option value="true" className="bg-slate-900">Suspicious Rows</option>
              <option value="false" className="bg-slate-900">Verified Succeeded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              <span>Fetching ledger data records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No matching records found in compliance ledger for this query.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Scope</th>
                  <th className="pb-3 font-semibold">Category / Activity</th>
                  <th className="pb-3 font-semibold">Original Quantity</th>
                  <th className="pb-3 font-semibold">Normalized Quantity</th>
                  <th className="pb-3 font-semibold">Verification</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {records.map((record) => (
                  <tr 
                    key={record.id} 
                    className={`hover:bg-slate-900/10 text-slate-300 transition-colors ${
                      record.is_suspicious && record.status === 'pending_review' 
                        ? 'bg-amber-500/[0.02]' 
                        : ''
                    }`}
                  >
                    <td className="py-3.5">
                      {getScopeBadge(record.emission_scope)}
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-slate-200 block text-xs">
                        {record.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                        {record.activity_type}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-slate-400">
                      {record.quantity ? `${record.quantity} ${record.unit || ''}` : '—'}
                    </td>
                    <td className="py-3.5 font-bold text-slate-200">
                      {record.normalized_quantity ? (
                        <>
                          <span>{record.normalized_quantity}</span>
                          <span className="text-xs text-slate-400 font-medium ml-1">
                            {record.normalized_unit}
                          </span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="py-3.5">
                      {record.is_suspicious ? (
                        <div className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 font-medium max-w-[200px]" title={record.suspicious_reasons}>
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Suspicious</span>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="py-3.5 text-right space-x-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {record.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => { setActionRecord(record); setActionType('approve'); }}
                            className="inline-flex items-center justify-center p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
                            title="Approve Record"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActionRecord(record); setActionType('reject'); }}
                            className="inline-flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                            title="Reject Record"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Side Drawer Overlay */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-2xl relative animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-100">
                    Record Details — ID: {selectedRecord.id}
                  </h3>
                  {getScopeBadge(selectedRecord.emission_scope)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ingested via batch: <span className="font-mono text-slate-400">{selectedRecord.source_upload || 'manual'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status and Details Box */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Ledger status</span>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Validation checks</span>
                  <div className="mt-1">
                    {selectedRecord.is_suspicious ? (
                      <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Suspicious flag raised</span>
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Verification Succeeded</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reasons if suspicious */}
              {selectedRecord.is_suspicious && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 text-amber-400 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reasons Flagged Suspicious:</span>
                  </div>
                  <p className="leading-relaxed leading-5 pl-5">{selectedRecord.suspicious_reasons}</p>
                </div>
              )}

              {/* Fields comparison */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Parsed Activity Parameters
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Activity category</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedRecord.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Activity type details</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedRecord.activity_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Ingested Quantity</span>
                    <span className="font-semibold text-slate-300 mt-0.5 block">
                      {selectedRecord.quantity ? `${selectedRecord.quantity} ${selectedRecord.unit || ''}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Normalized Quantity (GHG Standard)</span>
                    <span className="font-extrabold text-brand-300 mt-0.5 block">
                      {selectedRecord.normalized_quantity ? `${selectedRecord.normalized_quantity} ${selectedRecord.normalized_unit}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw CSV row snapshot JSON */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Original Row Data (Audit trail source)
                </h4>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto select-all max-h-48 scrollbar">
                  {JSON.stringify(selectedRecord.raw_data, null, 2)}
                </pre>
              </div>

              {/* Analyst verification logs metadata */}
              {(selectedRecord.approved_by || selectedRecord.review_notes) && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Verification Audit Metadata
                  </h4>
                  <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-4 space-y-3 text-xs leading-relaxed leading-5">
                    {selectedRecord.approved_by && (
                      <div className="flex justify-between text-slate-400">
                        <span>Reviewed & Locked by:</span>
                        <span className="font-semibold text-slate-200">
                          {selectedRecord.approved_by_details?.first_name 
                            ? `${selectedRecord.approved_by_details.first_name} ${selectedRecord.approved_by_details.last_name || ''}` 
                            : selectedRecord.approved_by_details?.username} ({new Date(selectedRecord.approved_at).toLocaleString()})
                        </span>
                      </div>
                    )}
                    {selectedRecord.review_notes && (
                      <div>
                        <span className="text-slate-500 block mb-1">Analyst Notes:</span>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-medium">
                          {selectedRecord.review_notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            {selectedRecord.status === 'pending_review' && (
              <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/40">
                <button
                  onClick={() => { setActionRecord(selectedRecord); setActionType('reject'); }}
                  className="px-4 py-2 border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all"
                >
                  Reject Record
                </button>
                <button
                  onClick={() => { setActionRecord(selectedRecord); setActionType('approve'); }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow shadow-brand-900"
                >
                  Approve & Audit Lock
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analyst Action Dialog (Notes capture) */}
      {actionRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div>
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                {actionType === 'approve' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Confirm Approval & Lock</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {actionType === 'approve' 
                  ? 'Confirming this action locks this record into the ledger. Only audited records will be compliance-approved.'
                  : 'Rejections must specify why the activity details failed validation checks.'}
              </p>
            </div>

            {notesError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
                {notesError}
              </div>
            )}

            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                Analyst Review Notes {actionType === 'reject' && <span className="text-red-400">*</span>}
              </label>
              <textarea
                rows="4"
                placeholder={actionType === 'approve' ? 'e.g. Validated meter bill and confirmed units matches previous cycles.' : 'e.g. Flight distance is listed as zero.'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-xs font-medium"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={actionSubmitting}
                onClick={() => { setActionRecord(null); setReviewNotes(''); setNotesError(''); }}
                className="px-4 py-2 border border-slate-700/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              
              <button
                disabled={actionSubmitting}
                onClick={handleAnalystAction}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all text-white flex items-center gap-1.5 shadow ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800'
                    : 'bg-red-600 hover:bg-red-500 disabled:bg-red-800'
                }`}
              >
                {actionSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {actionType === 'approve' ? 'Approve & Lock' : 'Confirm Reject'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default ReviewPage;

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Home, 
  User, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Phone, 
  Mail, 
  RefreshCw, 
  Check, 
  X, 
  Search,
  Filter,
  Building2,
  HeartPulse,
  TrendingDown,
  BarChart3,
  Eye,
  Info,
  Layers,
  Sparkles,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';
import { Modal } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

export const HOSTEL_BLOCKS = [
  { id: "Men's Hostel Block A", label: "Block A", short: "MH-A", category: "Men's Hostel" },
  { id: "Men's Hostel Block B", label: "Block B", short: "MH-B", category: "Men's Hostel" },
  { id: "Men's Hostel Block C", label: "Block C", short: "MH-C", category: "Men's Hostel" },
  { id: "Men's Hostel Block D", label: "Block D", short: "MH-D", category: "Men's Hostel" },
  { id: "Ladies Hostel Block A", label: "LH Block A", short: "LH-A", category: "Ladies Hostel" },
  { id: "Ladies Hostel Block B", label: "LH Block B", short: "LH-B", category: "Ladies Hostel" },
  { id: "Ladies Hostel Block C", label: "LH Block C", short: "LH-C", category: "Ladies Hostel" },
  { id: "ALL", label: "All Blocks", short: "ALL", category: "Campus Overview" }
];

export function WardenDashboard({ activeTab: externalTab, onNavigate }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Primary Tab: 'sick-leave' | 'wastage'
  const currentSection = externalTab === 'wastage' ? 'wastage' : 'sick-leave';

  // Dynamic Selected Hostel Block State (for Sick Leave Requests)
  const [selectedBlock, setSelectedBlock] = useState(() => {
    return localStorage.getItem('warden_selected_block') || "Men's Hostel Block A";
  });

  // Sick Leave sub-view: 'PENDING' | 'HISTORY'
  const [sickLeaveSubTab, setSickLeaveSubTab] = useState('PENDING');
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Reject Modal state
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Wastage Overview State (Read-Only)
  const [trendsPeriod, setTrendsPeriod] = useState('7d'); // '7d' | '30d' | '90d'
  const [trendsData, setTrendsData] = useState(null);
  const [wastageSummary, setWastageSummary] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState(null);

  // Fetch Sick Leave Requests Data
  const fetchWardenData = useCallback(async (blockToFetch = selectedBlock) => {
    if (!blockToFetch) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [statsRes, requestsRes] = await Promise.all([
        api.getWardenStats(blockToFetch),
        api.getWardenRequests(undefined, blockToFetch)
      ]);
      setStats(statsRes);
      setRequests(requestsRes?.requests || []);
    } catch (err) {
      console.error('Failed to load warden data:', err);
      setError(err.message || 'Failed to connect to warden dispatch service.');
    } finally {
      setLoading(false);
    }
  }, [selectedBlock]);

  // Fetch Read-Only Wastage Trends Data
  const fetchWastageTrends = useCallback(async (period = trendsPeriod) => {
    setTrendsLoading(true);
    setTrendsError(null);
    try {
      const [trendsRes, summaryRes] = await Promise.all([
        api.getWardenWastageTrends(period).catch(() => null),
        api.getWardenWastageSummary().catch(() => null)
      ]);
      setTrendsData(trendsRes);
      setWastageSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load wastage trends for warden:', err);
      setTrendsError(err.message || 'Failed to load campus food wastage audit.');
    } finally {
      setTrendsLoading(false);
    }
  }, [trendsPeriod]);

  useEffect(() => {
    if (currentSection === 'sick-leave') {
      fetchWardenData(selectedBlock);
      const interval = setInterval(() => fetchWardenData(selectedBlock), 5000);
      return () => clearInterval(interval);
    } else if (currentSection === 'wastage') {
      fetchWastageTrends(trendsPeriod);
    }
  }, [fetchWardenData, fetchWastageTrends, currentSection, selectedBlock, trendsPeriod]);

  const handleSelectBlock = (newBlock) => {
    setSelectedBlock(newBlock);
    localStorage.setItem('warden_selected_block', newBlock);
    setLoading(true);
    fetchWardenData(newBlock);
  };

  const handleApprove = async (requestId, studentName) => {
    setProcessingId(requestId);
    try {
      const res = await api.approveWardenRequest(requestId);
      showToast(res.message || `Delivery unlocked for ${studentName}!`, 'success');
      await fetchWardenData(selectedBlock);
    } catch (err) {
      showToast(err.message || 'Failed to approve request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (req) => {
    setRejectingRequest(req);
    setRejectionReason('Dispensary visit / doctor note required for hostel delivery.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setProcessingId(rejectingRequest.request_id);
    try {
      const res = await api.rejectWardenRequest(rejectingRequest.request_id, rejectionReason);
      showToast(res.message || 'Request rejected.', 'info');
      setRejectingRequest(null);
      setRejectionReason('');
      await fetchWardenData(selectedBlock);
    } catch (err) {
      showToast(err.message || 'Failed to reject request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  const filteredHistory = reviewedRequests.filter(r => {
    const matchStatus = historyFilter === 'ALL' || r.status === historyFilter;
    const matchSearch = !searchQuery || 
      r.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const selectedBlockLabel = HOSTEL_BLOCKS.find(b => b.id === selectedBlock)?.label || selectedBlock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-fade-in">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle={`Hostel Warden Portal • Authorized student sick-leave delivery review & campus wastage audit`} />

      {/* Primary Section Switcher Pill Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('sick-leave')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all font-heading cursor-pointer ${
              currentSection === 'sick-leave'
                ? 'bg-[#D97706] text-white shadow-soft-sm scale-[1.02]'
                : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200 hover:text-[#1E1B16]'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>1. Sick Leave Requests ({pendingRequests.length} pending)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('wastage')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all font-heading cursor-pointer ${
              currentSection === 'wastage'
                ? 'bg-[#D97706] text-white shadow-soft-sm scale-[1.02]'
                : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200 hover:text-[#1E1B16]'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>2. Wastage Overview (Read-Only)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B6560] bg-stone-100 px-3 py-1.5 rounded-xl font-medium">
          <Eye className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Warden Access Level: Strict 2-Scope Role</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: SICK LEAVE REQUESTS (FULL CONTROL)                         */}
      {/* ===================================================================== */}
      {currentSection === 'sick-leave' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* 2. PROMINENT HOSTEL BLOCK SELECTOR */}
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-[#FFFFFF] via-[#FFF7F0] to-[#FFFFFF] border border-orange-200/90 shadow-soft-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#D97706]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#1E1B16] font-heading">
                    Active Hostel Block Management
                  </h2>
                </div>
                <p className="text-xs text-[#6B6560]">
                  Select a hostel block below to review and authorize room deliveries for students in that building.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-[#6B6560]">Currently Viewing:</span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-[#D97706] border border-amber-200 text-xs font-bold font-heading shadow-soft-sm">
                  {selectedBlock === 'ALL' ? '🏢 All Campus Blocks' : `📍 ${selectedBlock}`}
                </span>
              </div>
            </div>

            {/* Block Selector Pills Grid */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {HOSTEL_BLOCKS.map((block) => {
                const isSelected = selectedBlock === block.id;
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => handleSelectBlock(block.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-180 flex items-center gap-1.5 font-heading cursor-pointer ${
                      isSelected
                        ? 'bg-[#D97706] text-white shadow-[0_2px_8px_rgba(217,119,6,0.3)] scale-[1.02]'
                        : 'bg-white hover:bg-amber-50/70 text-[#1E1B16] border border-stone-200/80 hover:border-amber-200'
                    }`}
                  >
                    <Home className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#D97706]'}`} />
                    <span>{block.label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Alert Banner if fetch fails */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4 text-xs text-[#DC2626]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-[#DC2626]" />
                <span><strong>Data Sync Warning:</strong> {error}</span>
              </div>
              <button
                onClick={() => fetchWardenData(selectedBlock)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shrink-0 transition"
              >
                Retry Sync
              </button>
            </div>
          )}

          {/* 3. HERO STAT ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Featured Stat: Pending Approvals */}
            <StatCard
              title="Pending Approvals"
              value={`${stats?.pendingCount ?? pendingRequests.length} Requests`}
              subtitle={`Requires review in ${selectedBlockLabel}`}
              icon={HeartPulse}
              color="orange"
              isFeatured={true}
              trend={(stats?.pendingCount ?? pendingRequests.length) > 0 ? 'Action Needed' : 'All Clear'}
              trendPositive={(stats?.pendingCount ?? pendingRequests.length) === 0}
              onClick={() => setSickLeaveSubTab('PENDING')}
            />

            {/* Stat 2: Approved Today */}
            <StatCard
              title="Approved Today"
              value={`${stats?.approvedTodayCount ?? 0} Students`}
              subtitle="Hostel room delivery active"
              icon={CheckCircle2}
              color="success"
              trend="Active Delivery"
              trendPositive={true}
            />

            {/* Stat 3: Rejected Count */}
            <StatCard
              title="Rejected Requests"
              value={`${stats?.rejectedCount ?? 0} Requests`}
              subtitle="Dispensary slip required"
              icon={XCircle}
              color="orange"
              onClick={() => {
                setSickLeaveSubTab('HISTORY');
                setHistoryFilter('rejected');
              }}
            />

            {/* Stat 4: Total Block Logs */}
            <StatCard
              title="Total Logged Requests"
              value={`${stats?.totalCount ?? requests.length} Total`}
              subtitle={`Logs for ${selectedBlockLabel}`}
              icon={Building2}
              color="orange"
              onClick={() => {
                setSickLeaveSubTab('HISTORY');
                setHistoryFilter('ALL');
              }}
            />
          </div>

          {/* Sub-Tab Navigation for Sick Leave (Pending vs History) */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSickLeaveSubTab('PENDING')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading ${
                  sickLeaveSubTab === 'PENDING'
                    ? 'bg-[#D97706] text-white shadow-soft-sm'
                    : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pending Approvals ({pendingRequests.length})</span>
              </button>

              <button
                onClick={() => setSickLeaveSubTab('HISTORY')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading ${
                  sickLeaveSubTab === 'HISTORY'
                    ? 'bg-[#D97706] text-white shadow-soft-sm'
                    : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Review History ({reviewedRequests.length})</span>
              </button>
            </div>

            <button
              onClick={() => fetchWardenData(selectedBlock)}
              className="text-xs text-[#6B6560] hover:text-[#1E1B16] flex items-center gap-1.5 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* TAB 1: PENDING REQUESTS QUEUE */}
          {sickLeaveSubTab === 'PENDING' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#D97706]" />
                    <span>Pending Sick Leave Delivery Requests</span>
                  </h2>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    Approve or reject sick leave room delivery requests for students in <strong>{selectedBlockLabel}</strong>.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="card py-16 text-center text-[#6B6560]">
                  <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading student requests for {selectedBlockLabel}...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="card py-16 text-center text-[#6B6560] space-y-3">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-[#16A34A]" />
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                    All Sick Leave Requests Reviewed
                  </h3>
                  <p className="text-xs max-w-md mx-auto">
                    There are no pending sick leave requests waiting for approval in <strong>{selectedBlockLabel}</strong>. 
                    Switch blocks above or select <strong>All Blocks</strong> to inspect other hostels.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pendingRequests.map((req) => (
                    <div 
                      key={req.request_id} 
                      className="card p-6 space-y-4 border-l-4 border-l-amber-500 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-[#D97706] flex items-center justify-center font-bold font-heading shadow-soft-sm">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-[#1E1B16] font-heading">
                              {req.student_name}
                            </h4>
                            <span className="text-xs text-[#D97706] font-bold flex items-center gap-1 font-heading">
                              <Home className="w-3.5 h-3.5" />
                              {req.hostel_name}, Room {req.room_number}
                            </span>
                          </div>
                        </div>

                        <span className="status-pill status-pill-warning text-[10px] font-heading shrink-0">
                          Pending Review
                        </span>
                      </div>

                      {/* Student Details Grid */}
                      <div className="space-y-2 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
                        <div className="flex items-center justify-between text-[#6B6560]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                            Requested Date:
                          </span>
                          <strong className="text-[#1E1B16]">{req.requested_date}</strong>
                        </div>

                        <div className="flex items-center justify-between text-[#6B6560]">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-[#D97706]" />
                            Student Email:
                          </span>
                          <span className="text-[#1E1B16]">{req.student_email}</span>
                        </div>

                        {req.student_phone && (
                          <div className="flex items-center justify-between text-[#6B6560]">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-[#D97706]" />
                              Contact Phone:
                            </span>
                            <span className="text-[#1E1B16] font-semibold">{req.student_phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Health Condition / Symptoms */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[#6B6560] uppercase tracking-wider block">
                          Illness Reason & Symptoms:
                        </span>
                        <p className="text-xs text-[#1E1B16] bg-[#FFF7F0] p-3 rounded-xl border border-orange-200/80 leading-relaxed">
                          "{req.reason}"
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleApprove(req.request_id, req.student_name)}
                          disabled={processingId === req.request_id}
                          className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-soft-sm transition flex items-center justify-center gap-1.5 font-heading cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>{processingId === req.request_id ? 'Approving...' : 'Approve Delivery'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenRejectModal(req)}
                          disabled={processingId === req.request_id}
                          className="flex-1 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-[#DC2626] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 font-heading shadow-soft-sm cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REVIEW HISTORY */}
          {sickLeaveSubTab === 'HISTORY' && (
            <div className="card p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#D97706]" />
                    <span>Reviewed Requests History ({selectedBlockLabel})</span>
                  </h2>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    Past approved and rejected sick leave delivery decisions
                  </p>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                    {['ALL', 'approved', 'rejected'].map(f => (
                      <button
                        key={f}
                        onClick={() => setHistoryFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading capitalize cursor-pointer ${
                          historyFilter === f
                            ? 'bg-white text-[#D97706] shadow-soft-sm'
                            : 'text-[#6B6560] hover:text-[#1E1B16]'
                        }`}
                      >
                        {f === 'ALL' ? 'All Reviewed' : f}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#FAFAF9] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] text-xs px-3.5 py-1.5 rounded-xl outline-none focus:border-[#D97706] w-44"
                  />
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-[#6B6560]">
                  <p className="text-sm">No reviewed requests found in {selectedBlockLabel} matching your filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] border-b border-stone-200 bg-stone-50">
                      <tr>
                        <th className="py-3 px-4">Student & Room</th>
                        <th className="py-3 px-3">Hostel Block</th>
                        <th className="py-3 px-3">Date Needed</th>
                        <th className="py-3 px-4">Condition Reason</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4">Decision Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredHistory.map((item) => {
                        const isApproved = item.status === 'approved';
                        const isRejected = item.status === 'rejected';

                        return (
                          <tr key={item.request_id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#1E1B16] font-heading block">{item.student_name}</span>
                              <span className="text-[11px] text-[#6B6560]">
                                Room {item.room_number}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-xs font-semibold text-[#D97706]">
                              {item.hostel_name}
                            </td>

                            <td className="py-3.5 px-3 font-semibold text-[#1E1B16]">
                              {item.requested_date}
                            </td>

                            <td className="py-3.5 px-4 max-w-xs text-xs text-[#6B6560] truncate">
                              {item.reason}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className={`status-pill text-[10px] font-heading ${
                                isApproved ? 'status-pill-success' : isRejected ? 'status-pill-danger' : 'status-pill-warning'
                              }`}>
                                {item.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-xs text-[#6B6560]">
                              {isApproved ? (
                                <span className="text-[#16A34A] font-semibold">✓ Delivery Unlocked</span>
                              ) : (
                                <span className="text-[#DC2626]">{item.rejection_reason || 'Rejected'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: WASTAGE OVERVIEW (READ-ONLY AUDIT FOR WARDEN)              */}
      {/* ===================================================================== */}
      {currentSection === 'wastage' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Read-Only Notice Strip */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#B45309]">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-[#D97706] shrink-0" />
              <div>
                <span className="font-bold text-[#1E1B16] block">Read-Only Campus Food Wastage Audit</span>
                <span>Wardens have read-only visibility into kitchen food preparation, order fulfillment, and daily wastage logs recorded by the Culinary Staff.</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-white border border-amber-200 text-[#D97706] font-bold rounded-lg text-[11px] shrink-0 shadow-soft-sm font-heading">
              🔒 View Only Mode
            </span>
          </div>

          {/* Main Wastage Card Header with Period Selector */}
          <div className="card p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7F0] text-[#D97706] border border-orange-200 flex items-center justify-center font-bold">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading">
                    Campus Food Wastage & Efficiency Audit
                  </h2>
                </div>
                <p className="text-xs text-[#6B6560] mt-1">
                  Track cumulative waste percentages, dish loss rankings, and period-over-period sustainability trends.
                </p>
              </div>

              {/* Period Selector */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                {['7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setTrendsPeriod(p);
                      fetchWastageTrends(p);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading cursor-pointer ${
                      trendsPeriod === p
                        ? 'bg-white text-[#D97706] shadow-soft-sm'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Alert Banner if fetch fails */}
            {trendsError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4 text-xs text-[#DC2626]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-[#DC2626]" />
                  <span><strong>Data Error:</strong> {trendsError}</span>
                </div>
                <button
                  onClick={() => fetchWastageTrends(trendsPeriod)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shrink-0 transition"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Stat Row */}
            {trendsData && trendsData.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#FFF7F0] border border-orange-200">
                  <span className="text-xs font-semibold text-[#6B6560] block">Total Prepared</span>
                  <span className="text-2xl font-bold text-[#1E1B16] font-heading tabular-nums mt-1 block">
                    {trendsData.summary.totalPrepared}
                  </span>
                  <span className="text-[11px] text-[#6B6560]">All portions cooked by chefs</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs font-semibold text-[#15803D] block">Total Sold & Consumed</span>
                  <span className="text-2xl font-bold text-[#16A34A] font-heading tabular-nums mt-1 block">
                    {trendsData.summary.totalSold}
                  </span>
                  <span className="text-[11px] text-[#15803D]">Served to campus students</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs font-semibold text-[#B45309] block">Total Wasted Portions</span>
                  <span className="text-2xl font-bold text-[#D97706] font-heading tabular-nums mt-1 block">
                    {trendsData.summary.totalWasted}
                  </span>
                  <span className="text-[11px] text-[#B45309]">Unconsumed surplus</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-xs font-semibold text-[#6B6560] block">Overall Wastage Rate</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-[#D97706] font-heading tabular-nums">
                      {trendsData.summary.wastagePercentage}%
                    </span>
                    <span className={`status-pill text-[10px] font-heading ${
                      trendsData.summary.isPositiveTrend ? 'status-pill-success' : 'status-pill-danger'
                    }`}>
                      {trendsData.summary.trendBadgeText}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B6560]">Campus benchmark: &lt;10%</span>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Grids */}
          {trendsLoading ? (
            <div className="card py-16 text-center text-[#6B6560]">
              <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Aggregating historical wastage records...</p>
            </div>
          ) : trendsData ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left 7 cols: Top Wasted Dishes */}
              <div className="lg:col-span-7 card p-6 space-y-4">
                <h3 className="text-base font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100 flex items-center justify-between">
                  <span>Dishes with Highest Wastage</span>
                  <span className="text-xs font-normal text-[#6B6560]">Ranked by wasted portions</span>
                </h3>

                {(!trendsData.topWastedDishes || trendsData.topWastedDishes.length === 0) ? (
                  <p className="text-xs text-[#9B9590] py-6 text-center">No dish wastage logged in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {trendsData.topWastedDishes.map((dish, idx) => (
                      <div key={dish.dishId || idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-bold text-xs text-[#6B6560] font-heading">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-[#1E1B16] font-heading block">{dish.dishName}</span>
                            <span className="text-[11px] text-[#6B6560]">
                              Prep: {dish.totalPrepared} • Sold: {dish.totalSold}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-[#D97706] font-heading tabular-nums block text-sm">
                            {dish.totalWasted} wasted
                          </span>
                          <span className="text-[11px] text-[#6B6560] font-semibold">
                            {dish.wastePercentage}% loss rate
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 5 cols: Reason Breakdown & Daily Trends */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Root Causes Card */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100">
                    Wastage Root Causes
                  </h3>

                  {(!trendsData.reasonBreakdown || trendsData.reasonBreakdown.length === 0) ? (
                    <p className="text-xs text-[#9B9590] py-6 text-center">No root causes recorded yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {trendsData.reasonBreakdown.map((r, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#FFF7F0] border border-orange-200/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#D97706]" />
                            <span className="font-bold text-[#1E1B16] font-heading capitalize">{r.reason_name || r.reason}</span>
                          </div>
                          <span className="font-bold text-[#D97706] font-heading tabular-nums">
                            {r.wasted_count || r.wastedCount} portions
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Daily Wastage Trend Timeline */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100">
                    Daily Waste Rate Timeline
                  </h3>

                  {(!trendsData.dailyTrends || trendsData.dailyTrends.length === 0) ? (
                    <p className="text-xs text-[#9B9590] py-6 text-center">No daily trend entries in this period.</p>
                  ) : (
                    <div className="space-y-2">
                      {trendsData.dailyTrends.slice(-7).map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-0">
                          <span className="text-[#6B6560] font-medium">{d.dayName} ({d.date})</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#1E1B16] font-semibold">{d.wasted}/{d.prepared} portions</span>
                            <span className="font-bold text-[#D97706] tabular-nums font-heading">{d.wastagePercentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : null}

        </div>
      )}

      {/* 6. REJECTION REASON MODAL */}
      <Modal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        title="Reject Sick Leave Request"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-[#DC2626]">
            You are rejecting the hostel delivery request for <strong>{rejectingRequest?.student_name}</strong> ({rejectingRequest?.hostel_name}, Room {rejectingRequest?.room_number}).
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1E1B16]">Reason for Rejection (Visible to Student):</label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#FAFAF9] border border-stone-200 text-[#1E1B16] text-xs p-3 rounded-xl outline-none focus:border-[#DC2626]"
              placeholder="e.g. Please visit the hostel dispensary for medical certificate..."
            />
          </div>

          {/* Quick presets */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#6B6560] font-semibold">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Dispensary slip required.',
                'Student not found in room during check.',
                'Medical note missing.',
                'Room delivery limit reached.'
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectionReason(preset)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] text-[#1E1B16] transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setRejectingRequest(null)}
              className="flex-1 btn-secondary text-xs py-2.5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={processingId === rejectingRequest?.request_id}
              className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs py-2.5 rounded-xl shadow-soft-sm transition font-heading cursor-pointer"
            >
              {processingId === rejectingRequest?.request_id ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

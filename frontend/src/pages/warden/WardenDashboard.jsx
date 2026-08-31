import React, { useState, useEffect } from 'react';
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
  HeartPulse
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';
import { Modal } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

export function WardenDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'HISTORY'
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Reject Modal state
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  const assignedBlock = user?.assignedHostelBlock || "Men's Hostel Block A";

  const fetchWardenData = async () => {
    try {
      const [statsRes, requestsRes] = await Promise.all([
        api.getWardenStats().catch(() => null),
        api.getWardenRequests().catch(() => ({ requests: [] }))
      ]);
      setStats(statsRes);
      setRequests(requestsRes?.requests || []);
    } catch (err) {
      console.error('Failed to load warden data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardenData();
    const interval = setInterval(fetchWardenData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId, studentName) => {
    setProcessingId(requestId);
    try {
      const res = await api.approveWardenRequest(requestId);
      showToast(res.message || `Delivery unlocked for ${studentName}!`, 'success');
      await fetchWardenData();
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
      await fetchWardenData();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle={`Hostel Warden Dispatch • Assigned to ${assignedBlock}`} />

      {/* 2. HERO STAT ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Pending Approvals */}
        <StatCard
          title="Pending Approvals"
          value={`${stats?.pendingCount ?? pendingRequests.length} Requests`}
          subtitle="Waiting for your review"
          icon={HeartPulse}
          color="orange"
          isFeatured={true}
          trend={(stats?.pendingCount ?? pendingRequests.length) > 0 ? 'Requires Action' : 'All Clear'}
          trendPositive={(stats?.pendingCount ?? pendingRequests.length) === 0}
          onClick={() => setActiveTab('PENDING')}
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
          subtitle="Requires dispensary visit"
          icon={XCircle}
          color="orange"
          onClick={() => {
            setActiveTab('HISTORY');
            setHistoryFilter('rejected');
          }}
        />

        {/* Stat 4: Total Block Logs */}
        <StatCard
          title="Total Block Requests"
          value={`${stats?.totalCount ?? requests.length} Total`}
          subtitle={`All logs for ${assignedBlock}`}
          icon={Building2}
          color="orange"
          onClick={() => {
            setActiveTab('HISTORY');
            setHistoryFilter('ALL');
          }}
        />
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading ${
              activeTab === 'PENDING'
                ? 'bg-[#EA580C] text-white shadow-soft-sm'
                : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Approvals ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading ${
              activeTab === 'HISTORY'
                ? 'bg-[#EA580C] text-white shadow-soft-sm'
                : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Review History ({reviewedRequests.length})</span>
          </button>
        </div>

        <button
          onClick={fetchWardenData}
          className="text-xs text-[#6B6560] hover:text-[#1E1B16] flex items-center gap-1.5 font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* 3. TAB 1: PENDING REQUESTS QUEUE */}
      {activeTab === 'PENDING' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-xl font-bold text-[#1E1B16] font-heading flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
                <span>Pending Sick Leave Delivery Requests</span>
              </h2>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Approve or reject sick leave room delivery requests for students in <strong>{assignedBlock}</strong>.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="card py-16 text-center text-[#6B6560]">
              <div className="w-8 h-8 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading student requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="card py-16 text-center text-[#6B6560] space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-[#16A34A]" />
              <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                All Sick Leave Requests Reviewed
              </h3>
              <p className="text-xs max-w-md mx-auto">
                There are no pending requests waiting for approval in {assignedBlock}. New student applications will stream here in real time.
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
                      <div className="w-10 h-10 rounded-xl bg-[#FFF7F0] border border-orange-200 text-[#EA580C] flex items-center justify-center font-bold font-heading shadow-soft-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#1E1B16] font-heading">
                          {req.student_name}
                        </h4>
                        <span className="text-xs text-[#EA580C] font-bold flex items-center gap-1 font-heading">
                          <Home className="w-3.5 h-3.5" />
                          {req.hostel_name}, Room {req.room_number}
                        </span>
                      </div>
                    </div>

                    <span className="status-pill status-pill-warning text-[10px] font-heading shrink-0">
                      Pending Approval
                    </span>
                  </div>

                  {/* Student Details Grid */}
                  <div className="space-y-2 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
                    <div className="flex items-center justify-between text-[#6B6560]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
                        Requested Date:
                      </span>
                      <strong className="text-[#1E1B16]">{req.requested_date}</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#6B6560]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#EA580C]" />
                        Student Email:
                      </span>
                      <span className="text-[#1E1B16]">{req.student_email}</span>
                    </div>

                    {req.student_phone && (
                      <div className="flex items-center justify-between text-[#6B6560]">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#EA580C]" />
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

                  {/* Action Buttons: Single-Click Approve & Reject */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(req.request_id, req.student_name)}
                      disabled={processingId === req.request_id}
                      className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-soft-sm transition flex items-center justify-center gap-1.5 font-heading"
                    >
                      <Check className="w-4 h-4" />
                      <span>{processingId === req.request_id ? 'Approving...' : 'Approve Delivery'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(req)}
                      disabled={processingId === req.request_id}
                      className="flex-1 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-[#DC2626] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 font-heading shadow-soft-sm"
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

      {/* 4. TAB 2: REVIEW HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="card p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-xl font-bold text-[#1E1B16] font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#EA580C]" />
                <span>Reviewed Requests History</span>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading capitalize ${
                      historyFilter === f
                        ? 'bg-white text-[#EA580C] shadow-soft-sm'
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
                className="bg-[#FAFAF9] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] text-xs px-3.5 py-1.5 rounded-xl outline-none focus:border-[#EA580C] w-44"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-[#6B6560]">
              <p className="text-sm">No reviewed requests found matching your filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] border-b border-stone-200 bg-stone-50">
                  <tr>
                    <th className="py-3 px-4">Student & Room</th>
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
                            {item.hostel_name}, Room {item.room_number}
                          </span>
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

      {/* 5. REJECTION REASON MODAL */}
      <Modal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        title="Reject Sick Leave Request"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-[#DC2626]">
            You are rejecting the hostel delivery request for <strong>{rejectingRequest?.student_name}</strong> (Room {rejectingRequest?.room_number}).
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
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] text-[#1E1B16] transition"
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
              className="flex-1 btn-secondary text-xs py-2.5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={processingId === rejectingRequest?.request_id}
              className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs py-2.5 rounded-xl shadow-soft-sm transition font-heading"
            >
              {processingId === rejectingRequest?.request_id ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

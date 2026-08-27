import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Home, 
  DoorClosed, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Mail, 
  ShieldCheck,
  Send
} from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const HOSTEL_OPTIONS = [
  "Men's Hostel Block A",
  "Men's Hostel Block B",
  "Men's Hostel Block C",
  "Men's Hostel Block D",
  "Ladies Hostel Block A",
  "Ladies Hostel Block B",
  "Ladies Hostel Block C"
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function SickLeaveModal({ isOpen, onClose, onStatusChange }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [hostelName, setHostelName] = useState("Men's Hostel Block A");
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || 'Room 204');
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState(getTodayStr());
  const [submitting, setSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.getMySickLeaveStatus(requestedDate);
      if (res?.hasRequest) {
        setActiveRequest(res);
        if (onStatusChange) onStatusChange(res);
      } else {
        setActiveRequest(null);
        if (onStatusChange) onStatusChange(null);
      }
    } catch (err) {
      console.error('Failed to load sick leave status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, requestedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide a brief reason for your sick leave.', 'warning');
      return;
    }
    if (!roomNumber.trim()) {
      showToast('Please enter your hostel room number.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitSickLeaveRequest({
        hostelName,
        roomNumber,
        reason,
        requestedDate
      });

      showToast(res.message || 'Sick leave request sent to your Warden for approval.', 'success', 5000);
      await fetchStatus();
      setReason('');
    } catch (err) {
      showToast(err.message || 'Failed to submit sick leave request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isApproved = activeRequest?.isApproved;
  const isPending = activeRequest?.isPending;
  const isRejected = activeRequest?.isRejected;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sick Leave & Hostel Room Delivery">
      <div className="space-y-5">
        
        {/* Intro context */}
        <p className="text-xs text-[#6B6560] leading-relaxed">
          Unwell and unable to walk to the mess? Submit a sick leave request to your Hostel Warden. 
          Once approved via email, hostel room delivery is automatically unlocked for today's orders.
        </p>

        {/* Live Active Status Card */}
        {activeRequest && activeRequest.hasRequest && (
          <div className={`p-4 rounded-2xl border transition-all ${
            isApproved 
              ? 'bg-emerald-50/60 border-emerald-200' 
              : isPending 
              ? 'bg-amber-50/60 border-amber-200' 
              : 'bg-red-50/60 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isApproved 
                  ? 'bg-[#16A34A] text-white' 
                  : isPending 
                  ? 'bg-[#D97706] text-white' 
                  : 'bg-[#DC2626] text-white'
              }`}>
                {isApproved ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isPending ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E1B16] font-heading">
                    {isApproved 
                      ? 'Warden Approval Granted' 
                      : isPending 
                      ? 'Awaiting Warden Response' 
                      : 'Request Not Approved'}
                  </span>
                  <span className={`status-pill text-[10px] font-heading ${
                    isApproved ? 'status-pill-success' : isPending ? 'status-pill-warning' : 'status-pill-danger'
                  }`}>
                    {activeRequest.status}
                  </span>
                </div>

                <p className="text-[#6B6560]">
                  {isApproved ? (
                    <>Room delivery is <strong>active</strong> for <strong>{activeRequest.hostelName}, {activeRequest.roomNumber}</strong>. You can now choose "Hostel Delivery" at checkout.</>
                  ) : isPending ? (
                    <>Approval email sent to <strong>{activeRequest.wardenName || 'Hostel Warden'}</strong>. Once they click Approve, your room delivery will unlock automatically.</>
                  ) : (
                    <>Warden declined this sick leave request. Counter pickup is available.</>
                  )}
                </p>

                <div className="pt-1 text-[11px] text-[#9B9590] flex items-center gap-2">
                  <span>Requested for: {new Date(activeRequest.requestedDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  {activeRequest.respondedAt && (
                    <>
                      <span>•</span>
                      <span>Responded: {new Date(activeRequest.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Form (Hidden or shown below when not approved) */}
        {(!activeRequest || !isApproved) && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1 border-t border-stone-100">
            <h4 className="text-xs font-bold text-[#1E1B16] uppercase tracking-wider font-heading">
              {activeRequest ? 'Submit New or Updated Request' : 'Sick Leave Application'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1E1B16] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-[#FF6B35]" />
                  Hostel Block
                </label>
                <select
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] px-3 py-2 rounded-xl text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                >
                  {HOSTEL_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1E1B16] flex items-center gap-1">
                  <DoorClosed className="w-3.5 h-3.5 text-[#FF6B35]" />
                  Room Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 304"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] px-3 py-2 rounded-xl text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
                Date Delivery Needed
              </label>
              <input
                type="date"
                required
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] px-3 py-2 rounded-xl text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16] flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-[#FF6B35]" />
                Health Condition / Medical Reason
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. High fever (102°F), severe body ache, bed rest advised by health center..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] p-3 rounded-xl text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 px-5 text-xs shadow-btn-orange flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Sending to Warden...' : 'Send Request to Warden'}</span>
              </button>
            </div>
          </form>
        )}

        {isApproved && (
          <div className="flex items-center justify-end pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-primary py-2 px-5 text-xs shadow-btn-orange"
            >
              Done / Return to Menu
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, Search, RotateCcw, PlusCircle, MinusCircle, AlertTriangle, ShieldCheck, Mail, Home } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

export function StudentManager() {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [adjustingStudent, setAdjustingStudent] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.getAdminStudents();
      setStudents(res?.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleReset = async (student) => {
    if (!window.confirm(`Reset monthly credits for "${student.name}" back to full 9,000 limit?`)) return;

    try {
      await api.adjustStudentCredits(student.student_id, { action: 'reset' });
      showToast(`Reset credits for "${student.name}" to 9,000`, 'success');
      await fetchStudents();
    } catch (err) {
      showToast(err.message || 'Failed to reset credits', 'error');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustAmount || isNaN(parseInt(adjustAmount, 10))) {
      showToast('Please enter a valid credit amount.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.adjustStudentCredits(adjustingStudent.student_id, {
        action: 'adjust',
        amount: parseInt(adjustAmount, 10),
        reason: adjustReason || 'Admin manual balance adjustment'
      });
      showToast(`Adjusted credits for "${adjustingStudent.name}"`, 'success');
      setAdjustingStudent(null);
      setAdjustAmount('');
      setAdjustReason('');
      await fetchStudents();
    } catch (err) {
      showToast(err.message || 'Failed to adjust credits', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const studentsList = Array.isArray(students) ? students : [];

  const filteredStudents = studentsList.filter(s =>
    (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
    (s.room_number && s.room_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="card-static flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-[#1E1B16] flex items-center gap-2.5 font-heading">
            <Users className="w-6 h-6 text-[#C2410C]" />
            <span>Student Accounts & Balances</span>
          </h1>
          <p className="text-xs text-[#6B6560] mt-0.5">
            Monitor credit allowances, trigger 9,000 monthly resets, or grant manual allowances
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-9 pr-3 py-1.5 rounded-xl text-xs focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="card-static p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-4">Room & Contact</th>
                <th className="py-3.5 px-4 text-right">Used Credits</th>
                <th className="py-3.5 px-4 text-right">Remaining Balance</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[#6B6560] animate-pulse">
                    Loading student accounts...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[#9B9590]">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const isLow = (student.remaining_credits ?? 0) < 500;

                  return (
                    <tr key={student.student_id} className="h-14 hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-[#C2410C] flex items-center justify-center font-bold shrink-0 font-heading">
                            {student.name ? student.name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-[#1E1B16] block font-heading">{student.name}</span>
                            <span className="text-xs text-[#6B6560] font-medium">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#6B6560]">
                        <span className="font-semibold text-[#1E1B16] block">{student.room_number || 'Hostel'}</span>
                        <span className="text-[11px] text-[#9B9590]">{student.phone || 'No phone'}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#6B6560] font-bold tabular-nums font-heading">
                        {student.used_credits?.toLocaleString() ?? student.used_credits}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`status-pill text-xs font-heading ${
                          isLow ? 'status-pill-danger' : 'status-pill-success'
                        }`}>
                          {student.remaining_credits?.toLocaleString() ?? student.remaining_credits} / 9k
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReset(student)}
                            className="btn-secondary py-1.5 px-3 text-xs"
                            title="Reset to 9,000 credits"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                          </button>
                          <button
                            onClick={() => setAdjustingStudent(student)}
                            className="btn-primary py-1.5 px-3 text-xs shadow-btn-orange"
                          >
                            <span>Adjust</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Credits Modal */}
      <Modal
        isOpen={!!adjustingStudent}
        onClose={() => setAdjustingStudent(null)}
        title={`Adjust Credits: ${adjustingStudent?.name}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3.5 bg-[#FFF7F0] rounded-xl border border-orange-200 flex items-center justify-between text-xs">
            <span className="text-[#1E1B16] font-semibold">Current Balance:</span>
            <span className="font-bold text-[#FF6B35] text-sm tabular-nums font-heading">
              {adjustingStudent?.remaining_credits?.toLocaleString() ?? adjustingStudent?.remaining_credits} Credits
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1E1B16]">
              Adjustment Amount (Positive to Add, Negative to Deduct)
            </label>
            <input
              type="number"
              required
              placeholder="e.g. 500 or -200"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1E1B16]">
              Reason / Audit Note
            </label>
            <input
              type="text"
              placeholder="e.g. Hackathon reward, Special grant, Mess adjustment"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setAdjustingStudent(null)}
              className="btn-secondary py-2 px-4 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2 px-4 text-xs shadow-btn-orange"
            >
              {submitting ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

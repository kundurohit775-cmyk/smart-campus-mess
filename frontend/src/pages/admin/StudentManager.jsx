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
      setStudents(res.students || []);
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

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.room_number && s.room_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Student Accounts & Credit Balances</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor student credit allowances, trigger resets, or grant bonus campus credits
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-4">Room & Contact</th>
                <th className="py-3.5 px-4 text-right">Used Credits</th>
                <th className="py-3.5 px-4 text-right">Remaining Balance</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 animate-pulse">
                    Loading student accounts...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const isLow = student.remaining_credits < 500;

                  return (
                    <tr key={student.student_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{student.name}</span>
                            <span className="text-xs text-slate-400">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{student.room_number || 'Hostel'}</span>
                          <span className="text-[11px] text-slate-400">{student.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-500 font-bold">
                        {student.used_credits.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black inline-block ${
                          isLow
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {student.remaining_credits.toLocaleString()} / 9k
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReset(student)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                            title="Reset to 9,000 credits"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset (9k)</span>
                          </button>
                          <button
                            onClick={() => setAdjustingStudent(student)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
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
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
            <span className="text-purple-800 font-medium">Current Balance:</span>
            <span className="font-extrabold text-purple-900 text-sm">
              {adjustingStudent?.remaining_credits.toLocaleString()} Credits
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Adjustment Amount (Positive to Add, Negative to Deduct)
            </label>
            <input
              type="number"
              required
              placeholder="e.g. 500 or -200"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Audit Note
            </label>
            <input
              type="text"
              placeholder="e.g. Hackathon reward, Special grant, Mess fee adjustment"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustingStudent(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              {submitting ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

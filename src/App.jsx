import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, User, CheckCircle2, AlertCircle, 
  Search, Plus, RefreshCw, X, MessageSquare,
  ShieldCheck, LayoutDashboard, CalendarDays
} from 'lucide-react';

// Demo reference date matching test criteria
const DEMO_REFERENCE_DATE = '2026-10-24';
const DEFAULT_CONSULTANT_NAME = 'Dr. Ananya Roy (Lead Nutritionist)';

// Exact seed data mandated by the Kayro specification (normalized to ISO)
const INITIAL_SAMPLE_DATA = [
  {
    id: 'apt-1',
    clientName: 'Riya Shah',
    consultantName: DEFAULT_CONSULTANT_NAME,
    phone: '98200 11111',
    date: '2026-10-24',
    time: '10:00',
    status: 'Booked',
    confirmedAttendance: false,
    focusLog: { primaryGoal: 'Gut health & energy balance', digestiveConcerns: 'Occasional bloating after lunch' }
  },
  {
    id: 'apt-2',
    clientName: 'Arjun Mehta',
    consultantName: DEFAULT_CONSULTANT_NAME,
    phone: '98200 22222',
    date: '2026-10-24',
    time: '11:30',
    status: 'Booked',
    confirmedAttendance: true,
    focusLog: { primaryGoal: 'Lean muscle recovery & protein timing', digestiveConcerns: 'None reported' }
  },
  {
    id: 'apt-3',
    clientName: 'Riya Shah',
    consultantName: DEFAULT_CONSULTANT_NAME,
    phone: '98200 11111',
    date: '2026-10-25',
    time: '16:00',
    status: 'Booked',
    confirmedAttendance: true,
    focusLog: { primaryGoal: 'Curbing late evening cravings', digestiveConcerns: 'Acid reflux during late dinners' }
  },
  {
    id: 'apt-4',
    clientName: 'Meera Iyer',
    consultantName: DEFAULT_CONSULTANT_NAME,
    phone: '',
    date: '2026-10-23',
    time: '09:00',
    status: 'Done',
    confirmedAttendance: true,
    focusLog: { primaryGoal: 'Thyroid profile nutrition strategy', digestiveConcerns: 'Sluggish morning metabolism' }
  },
  {
    id: 'apt-5',
    clientName: 'Kabir Rao',
    consultantName: DEFAULT_CONSULTANT_NAME,
    phone: '98200 33333',
    date: '2026-10-22',
    time: '14:00',
    status: 'No-show',
    confirmedAttendance: false,
    focusLog: { primaryGoal: 'Post-workout endurance fueling', digestiveConcerns: 'None' }
  }
];

export default function App() {
  const [view, setView] = useState(() => localStorage.getItem('wellness_active_view') || 'client'); // 'client' | 'nutritionist'
  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('wellness_appointments_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((apt) => ({
            ...apt,
            consultantName: apt.consultantName || DEFAULT_CONSULTANT_NAME,
            // Fallback mapper for any stale legacy records
            status: apt.status === 'Completed' ? 'Done' : apt.status === 'Cancelled' ? 'No-show' : apt.status,
          }));
        }
      } catch (e) {
        console.error('Failed to parse appointments', e);
      }
    }
    return INITIAL_SAMPLE_DATA;
  });

  // Client view tab: upcoming vs past/history
  const [clientTab, setClientTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Nutritionist filters
  const [searchQuery, setSearchQuery] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);

  // Modals & Sheets
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isNutritionistAddOpen, setIsNutritionistAddOpen] = useState(false);
  const [reschedulingApt, setReschedulingApt] = useState(null);
  const [activeWhatsappApt, setActiveWhatsappApt] = useState(null);
  const [copiedReminderId, setCopiedReminderId] = useState(null);

  // Focus Log Form State for next appointment
  const [focusGoalInput, setFocusGoalInput] = useState('');
  const [focusDigestiveInput, setFocusDigestiveInput] = useState('');
  const [focusLogSubmitted, setFocusLogSubmitted] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    date: '2026-10-26',
    time: '10:00',
  });
  const [formError, setFormError] = useState('');

  // Persist appointments to localStorage
  useEffect(() => {
    localStorage.setItem('wellness_appointments_data', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('wellness_active_view', view);
  }, [view]);

  const resetData = () => {
    setAppointments(INITIAL_SAMPLE_DATA);
    localStorage.setItem('wellness_appointments_data', JSON.stringify(INITIAL_SAMPLE_DATA));
    setFocusLogSubmitted(false);
    setSearchQuery('');
    setTodayOnly(false);
  };

  // Double-booking check
  const checkDoubleBooking = (date, time, excludeId = null) => {
    return appointments.some(
      (apt) =>
        apt.id !== excludeId &&
        apt.status === 'Booked' &&
        apt.date === date &&
        apt.time === time
    );
  };

  // Find next upcoming appointment for demo client (Riya Shah on or after reference date)
  const nextClientAppointment = useMemo(() => {
    const upcoming = appointments
      .filter((a) => a.date >= DEMO_REFERENCE_DATE && a.status === 'Booked')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return upcoming[0] || null;
  }, [appointments]);

  // Attendance confirmation
  const handleConfirmAttendance = (id) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id ? { ...apt, confirmedAttendance: true } : apt
      )
    );
  };

  // Save Focus Log
  const handleSaveFocusLog = (id) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              focusLog: {
                primaryGoal: focusGoalInput || 'Focus on energy & digestion balance',
                digestiveConcerns: focusDigestiveInput || 'None noted',
              },
            }
          : apt
      )
    );
    setFocusLogSubmitted(true);
  };

  // Status Change (strictly Booked, Done, or No-show)
  const handleStatusChange = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
  };

  // Book appointment
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.clientName.trim()) {
      setFormError('Please provide a client name.');
      return;
    }

    if (checkDoubleBooking(formData.date, formData.time)) {
      setFormError(`Conflict: ${formData.date} at ${formData.time} is already booked.`);
      return;
    }

    const newApt = {
      id: `apt-${Date.now()}`,
      clientName: formData.clientName.trim(),
      consultantName: DEFAULT_CONSULTANT_NAME,
      phone: formData.phone.trim(),
      date: formData.date,
      time: formData.time,
      status: 'Booked',
      confirmedAttendance: false,
      focusLog: { primaryGoal: 'New intake assessment', digestiveConcerns: 'None reported' },
    };

    setAppointments((prev) => [...prev, newApt]);
    setFormData({ clientName: '', phone: '', date: '2026-10-26', time: '10:00' });
    setIsBookModalOpen(false);
    setIsNutritionistAddOpen(false);
  };

  // Reschedule
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!reschedulingApt) return;

    if (checkDoubleBooking(reschedulingApt.date, reschedulingApt.time, reschedulingApt.id)) {
      setFormError(`Time slot ${reschedulingApt.date} at ${reschedulingApt.time} is already taken.`);
      return;
    }

    setAppointments((prev) =>
      prev.map((apt) => (apt.id === reschedulingApt.id ? reschedulingApt : apt))
    );
    setReschedulingApt(null);
    setFormError('');
  };

  // Nutritionist Statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const todayApts = appointments.filter((a) => a.date === DEMO_REFERENCE_DATE);
    const confirmedCount = appointments.filter((a) => a.confirmedAttendance).length;
    return {
      total,
      today: todayApts.length,
      attendanceRate: total ? Math.round((confirmedCount / total) * 100) : 0,
    };
  }, [appointments]);

  // Filtered Nutritionist List
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch =
        apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.phone.includes(searchQuery);
      const matchesToday = !todayOnly || apt.date === DEMO_REFERENCE_DATE;
      return matchesSearch && matchesToday;
    });
  }, [appointments, searchQuery, todayOnly]);

  // Status Styling Badge Helper (Three distinct colors)
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'No-show':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation & Instant View Switcher */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Prana Wellness</h1>
              <p className="text-xs text-slate-500">Holistic Nutrition & Clinical Consultations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => setView('client')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'client'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="h-4 w-4" />
                Client View
              </button>
              <button
                onClick={() => setView('nutritionist')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'nutritionist'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Nutritionist Portal
              </button>
            </div>

            <button
              onClick={resetData}
              title="Reset to Kayro assignment sample data"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {view === 'client' ? (
          /* ================= CLIENT VIEW ================= */
          <div className="space-y-8 max-w-3xl mx-auto">
            {/* Next Appointment Card */}
            {nextClientAppointment ? (
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm relative overflow-hidden">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-100 text-emerald-800 uppercase">
                      Upcoming Consultation
                    </span>
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">
                      Next Consultation ({nextClientAppointment.clientName})
                    </h2>
                    <p className="text-sm text-slate-500">With {nextClientAppointment.consultantName || DEFAULT_CONSULTANT_NAME}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-emerald-900 flex items-center gap-2 justify-end">
                      <Clock className="h-5 w-5 text-emerald-600" />
                      {nextClientAppointment.time}
                    </div>
                    <div className="text-sm text-slate-600 flex items-center gap-1 mt-1 justify-end">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      {nextClientAppointment.date}
                    </div>
                  </div>
                </div>

                {/* Attendance Confirmation Action */}
                <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-emerald-100/60 mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Attendance Status:{' '}
                      <span className={nextClientAppointment.confirmedAttendance ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        {nextClientAppointment.confirmedAttendance ? 'Confirmed' : 'Pending Confirmation'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">Let your nutritionist know you will attend on time</p>
                  </div>
                  {!nextClientAppointment.confirmedAttendance ? (
                    <button
                      onClick={() => handleConfirmAttendance(nextClientAppointment.id)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Attendance
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                      <ShieldCheck className="h-4 w-4" /> Confirmed
                    </span>
                  )}
                </div>

                {/* Two-Question Pre-Session Focus Log */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    Pre-Session Focus Log
                  </h3>
                  {focusLogSubmitted || nextClientAppointment.focusLog?.primaryGoal ? (
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Primary Goal:</span>{' '}
                        {nextClientAppointment.focusLog?.primaryGoal}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Digestive Concerns:</span>{' '}
                        {nextClientAppointment.focusLog?.digestiveConcerns}
                      </p>
                      <span className="text-[11px] text-emerald-700 font-medium inline-block mt-1">
                        ✓ Logged for your nutritionist's review
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          1. What is your primary nutritional focus or goal this week?
                        </label>
                        <input
                          type="text"
                          value={focusGoalInput}
                          onChange={(e) => setFocusGoalInput(e.target.value)}
                          placeholder="e.g. Curbing evening cravings, meal prepping protein"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          2. Any gut or digestion issues since our last session?
                        </label>
                        <input
                          type="text"
                          value={focusDigestiveInput}
                          onChange={(e) => setFocusDigestiveInput(e.target.value)}
                          placeholder="e.g. Mild bloating, energy drops after lunch"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveFocusLog(nextClientAppointment.id)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Save Focus Log
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => setReschedulingApt(nextClientAppointment)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleStatusChange(nextClientAppointment.id, 'No-show')}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100/60 transition-colors"
                  >
                    Cancel Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No active sessions scheduled</h3>
                <p className="text-xs text-slate-400 mt-1">Reserve a one-on-one session with your nutritionist.</p>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="mt-4 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow transition-all"
                >
                  Book New Session
                </button>
              </div>
            )}

            {/* Client Tabs: Upcoming / Past */}
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => setClientTab('upcoming')}
                    className={`text-sm font-semibold pb-2 border-b-2 transition-all ${
                      clientTab === 'upcoming'
                        ? 'border-emerald-600 text-emerald-800'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    All Upcoming
                  </button>
                  <button
                    onClick={() => setClientTab('past')}
                    className={`text-sm font-semibold pb-2 border-b-2 transition-all ${
                      clientTab === 'past'
                        ? 'border-emerald-600 text-emerald-800'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Past & Completed
                  </button>
                </div>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Book Session
                </button>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {appointments
                  .filter((a) => (clientTab === 'upcoming' ? a.status === 'Booked' : a.status !== 'Booked'))
                  .map((apt) => (
                    <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{apt.clientName}</p>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Consultant: <span className="font-semibold text-slate-700">{apt.consultantName || DEFAULT_CONSULTANT_NAME}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3">
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="whitespace-nowrap">📅 {apt.date} · {apt.time}</span>
                        </div>
                        {apt.status === 'Booked' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReschedulingApt(apt)}
                              className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1 rounded-lg"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'No-show')}
                              className="text-xs text-rose-600 hover:text-rose-700 border border-rose-100 px-3 py-1 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= NUTRITIONIST PORTAL ================= */
          <div className="space-y-6">
            {/* Top Stat Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Consultations</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Today's Sessions ({DEMO_REFERENCE_DATE})
                </p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.today}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                <p className="text-2xl font-bold text-teal-700 mt-1">{stats.attendanceRate}%</p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client name or phone..."
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todayOnly}
                    onChange={(e) => setTodayOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Today Only ({DEMO_REFERENCE_DATE})
                </label>
              </div>

              <button
                onClick={() => setIsNutritionistAddOpen(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" /> Add Consultation
              </button>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Attendance</th>
                    <th className="py-3.5 px-4">Focus Goal</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No appointments found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{apt.clientName}</p>
                          <p className="text-[11px] text-slate-400">{apt.phone || 'No phone recorded'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-700">{apt.date}</p>
                          <p className="text-[11px] text-slate-400">{apt.time}</p>
                        </td>
                        <td className="py-3 px-4">
                          {apt.confirmedAttendance ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Confirmed
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Unconfirmed</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={apt.focusLog?.primaryGoal}>
                          {apt.focusLog?.primaryGoal || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={apt.status}
                            onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-all ${getStatusBadgeClass(apt.status)}`}
                          >
                            <option value="Booked">Booked</option>
                            <option value="Done">Done</option>
                            <option value="No-show">No-show</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setActiveWhatsappApt(apt)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                            title="Generate WhatsApp Reminder"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {(isBookModalOpen || isNutritionistAddOpen) && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => {
                setIsBookModalOpen(false);
                setIsNutritionistAddOpen(false);
                setFormError('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {isNutritionistAddOpen ? 'Add Consultation (Manual)' : 'Book Wellness Session'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Enter details below. Conflicts are strictly prevented.</p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Maya Sen"
                  className="w-full text-xs px-3 py-2 border rounded-xl border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="98200 44444"
                  className="w-full text-xs px-3 py-2 border rounded-xl border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsBookModalOpen(false);
                    setIsNutritionistAddOpen(false);
                    setFormError('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm transition-all"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingApt && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
            <button
              onClick={() => {
                setReschedulingApt(null);
                setFormError('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-800 mb-1">Reschedule Session</h3>
            <p className="text-xs text-slate-500 mb-4">{reschedulingApt.clientName}</p>

            {formError && (
              <div className="p-2.5 mb-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={reschedulingApt.date}
                  onChange={(e) => setReschedulingApt({ ...reschedulingApt, date: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl border-slate-200 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Time</label>
                <select
                  value={reschedulingApt.time}
                  onChange={(e) => setReschedulingApt({ ...reschedulingApt, time: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl border-slate-200 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReschedulingApt(null);
                    setFormError('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                >
                  Update Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Preview Modal */}
      {activeWhatsappApt && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setActiveWhatsappApt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-800 mb-1">WhatsApp Reminder</h3>
            <p className="text-xs text-slate-500 mb-4">Formatted for {activeWhatsappApt.clientName}</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line select-all mb-4">
              {`Hi ${activeWhatsappApt.clientName}, this is a gentle reminder from Prana Wellness regarding your upcoming nutrition consultation scheduled for *${activeWhatsappApt.date}* at *${activeWhatsappApt.time}*.\n\nPlease reply with *CONFIRM* to lock in your slot or let us know if you need to reschedule.`}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Recipient: {activeWhatsappApt.phone || 'No phone recorded'}</span>
              <button
                onClick={() => {
                  const text = `Hi ${activeWhatsappApt.clientName}, this is a gentle reminder from Prana Wellness regarding your upcoming nutrition consultation scheduled for ${activeWhatsappApt.date} at ${activeWhatsappApt.time}. Please reply with CONFIRM to lock in your slot.`;
                  navigator.clipboard.writeText(text);
                  setCopiedReminderId(activeWhatsappApt.id);
                  setTimeout(() => setCopiedReminderId(null), 2500);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                {copiedReminderId === activeWhatsappApt.id ? 'Copied to Clipboard!' : 'Copy Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
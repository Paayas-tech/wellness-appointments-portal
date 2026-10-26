import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, User, CheckCircle2, AlertCircle, 
  Search, Plus, RefreshCw, X, MessageSquare,
  ShieldCheck, LayoutDashboard, CalendarDays, Sparkles,
  Phone, ArrowRight, UserCheck, HeartPulse, ChevronRight
} from 'lucide-react';

const DEMO_REFERENCE_DATE = '2026-10-24';
const DEFAULT_CONSULTANT_NAME = 'Dr. Ananya Roy (Lead Nutritionist)';

// Exact seed data specified by the Kayro specification (normalized to ISO)
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
    focusLog: { primaryGoal: 'Gut microbiome reset & morning energy', digestiveConcerns: 'Post-lunch lethargy & bloating' }
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
    focusLog: { primaryGoal: 'Lean muscle hypertrophy & whey timing', digestiveConcerns: 'None reported' }
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
    focusLog: { primaryGoal: 'Curbing late evening sugar cravings', digestiveConcerns: 'Acid reflux during late dinners' }
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
    focusLog: { primaryGoal: 'Half-marathon carbohydrate loading', digestiveConcerns: 'None' }
  }
];

export default function App() {
  const [view, setView] = useState(() => localStorage.getItem('wellness_active_view') || 'client');
  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('wellness_appointments_data_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((apt) => ({
            ...apt,
            consultantName: apt.consultantName || DEFAULT_CONSULTANT_NAME,
            status: apt.status === 'Completed' ? 'Done' : apt.status === 'Cancelled' ? 'No-show' : apt.status,
          }));
        }
      } catch (e) {
        console.error('Failed to parse appointments', e);
      }
    }
    return INITIAL_SAMPLE_DATA;
  });

  const [clientTab, setClientTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);

  // Modals & Panels
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isNutritionistAddOpen, setIsNutritionistAddOpen] = useState(false);
  const [reschedulingApt, setReschedulingApt] = useState(null);
  const [activeWhatsappApt, setActiveWhatsappApt] = useState(null);
  const [copiedReminderId, setCopiedReminderId] = useState(null);

  // Focus Log Form State
  const [focusGoalInput, setFocusGoalInput] = useState('');
  const [focusDigestiveInput, setFocusDigestiveInput] = useState('');
  const [focusLogSubmitted, setFocusLogSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    date: '2026-10-26',
    time: '10:00',
  });
  const [formError, setFormError] = useState('');

  // Persist State
  useEffect(() => {
    localStorage.setItem('wellness_appointments_data_v2', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('wellness_active_view', view);
  }, [view]);

  const resetData = () => {
    setAppointments(INITIAL_SAMPLE_DATA);
    localStorage.setItem('wellness_appointments_data_v2', JSON.stringify(INITIAL_SAMPLE_DATA));
    setFocusLogSubmitted(false);
    setSearchQuery('');
    setTodayOnly(false);
  };

  const checkDoubleBooking = (date, time, excludeId = null) => {
    return appointments.some(
      (apt) =>
        apt.id !== excludeId &&
        apt.status === 'Booked' &&
        apt.date === date &&
        apt.time === time
    );
  };

  const nextClientAppointment = useMemo(() => {
    const upcoming = appointments
      .filter((a) => a.date >= DEMO_REFERENCE_DATE && a.status === 'Booked')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return upcoming[0] || null;
  }, [appointments]);

  const handleConfirmAttendance = (id) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id ? { ...apt, confirmedAttendance: true } : apt
      )
    );
  };

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

  const handleStatusChange = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.clientName.trim()) {
      setFormError('Please enter the client’s full name.');
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
      focusLog: { primaryGoal: 'New client lifestyle assessment', digestiveConcerns: 'None reported' },
    };

    setAppointments((prev) => [...prev, newApt]);
    setFormData({ clientName: '', phone: '', date: '2026-10-26', time: '10:00' });
    setIsBookModalOpen(false);
    setIsNutritionistAddOpen(false);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!reschedulingApt) return;

    if (checkDoubleBooking(reschedulingApt.date, reschedulingApt.time, reschedulingApt.id)) {
      setFormError(`Conflict: ${reschedulingApt.date} at ${reschedulingApt.time} is already occupied.`);
      return;
    }

    setAppointments((prev) =>
      prev.map((apt) => (apt.id === reschedulingApt.id ? reschedulingApt : apt))
    );
    setReschedulingApt(null);
    setFormError('');
  };

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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch =
        apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.phone.includes(searchQuery);
      const matchesToday = !todayOnly || apt.date === DEMO_REFERENCE_DATE;
      return matchesSearch && matchesToday;
    });
  }, [appointments, searchQuery, todayOnly]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Booked':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'Done':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'No-show':
        return 'bg-rose-50 text-rose-800 border-rose-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Floating Glass Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-stone-900 font-serif">Prana Wellness</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">Boutique Clinic</span>
              </div>
              <p className="text-xs text-stone-500 font-normal">Holistic Clinical Nutrition & Gut Protocol</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Seamless View Segment Control */}
            <div className="bg-stone-100/80 p-1 rounded-2xl flex items-center border border-stone-200/70 shadow-inner">
              <button
                onClick={() => setView('client')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  view === 'client'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <User className="h-3.5 w-3.5 text-emerald-600" />
                Client Lounge
              </button>
              <button
                onClick={() => setView('nutritionist')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  view === 'nutritionist'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-emerald-600" />
                Practitioner Suite
              </button>
            </div>

            <button
              onClick={resetData}
              title="Reset to Kayro assignment seed records"
              className="p-2 text-stone-400 hover:text-emerald-700 rounded-xl hover:bg-emerald-50/60 transition-colors border border-transparent hover:border-emerald-200/50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {view === 'client' ? (
          /* ==================== CLIENT LOUNGE ==================== */
          <div className="space-y-8 max-w-3xl mx-auto">
            {/* Next Consultation Spotlight Hero */}
            {nextClientAppointment ? (
              <div className="bg-gradient-to-b from-[#F2F7F4] via-[#F8FAF9] to-white rounded-3xl border border-emerald-900/10 p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider bg-emerald-800 text-white uppercase shadow-sm">
                      <Sparkles className="h-3 w-3" /> Upcoming Consultation
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900 mt-3">
                      {nextClientAppointment.clientName}’s Session
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 mt-1">
                      Assigned Lead: <span className="font-medium text-stone-700">{nextClientAppointment.consultantName}</span>
                    </p>
                  </div>
                  <div className="bg-white/80 border border-emerald-900/10 rounded-2xl px-4 py-2.5 shadow-sm text-right">
                    <div className="text-lg font-bold text-emerald-900 flex items-center gap-2 justify-end">
                      <Clock className="h-4 w-4 text-emerald-700" />
                      {nextClientAppointment.time}
                    </div>
                    <div className="text-xs text-stone-600 flex items-center gap-1 mt-0.5 justify-end">
                      <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                      {nextClientAppointment.date}
                    </div>
                  </div>
                </div>

                {/* Attendance Confirmation Action Box */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-900/10 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">Attendance Pledge</p>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        nextClientAppointment.confirmedAttendance 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {nextClientAppointment.confirmedAttendance ? '✓ Confirmed Attendance' : 'Pending Client Action'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Helps your practitioner prepare tailored meal adjustments in advance.
                    </p>
                  </div>
                  {!nextClientAppointment.confirmedAttendance ? (
                    <button
                      onClick={() => handleConfirmAttendance(nextClientAppointment.id)}
                      className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <UserCheck className="h-4 w-4" />
                      I Will Attend On Time
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-800 text-xs font-bold px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 self-start sm:self-auto">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" /> Slot Locked & Confirmed
                    </span>
                  )}
                </div>

                {/* Pre-Session Focus Log Intake Form */}
                <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-stone-700 flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-emerald-700" />
                      Pre-Session Focus Log
                    </h3>
                    <span className="text-[11px] text-stone-400">Micro-Intake Protocol</span>
                  </div>

                  {focusLogSubmitted || nextClientAppointment.focusLog?.primaryGoal ? (
                    <div className="bg-stone-50/80 rounded-xl p-3.5 space-y-2 text-xs border border-stone-200/60">
                      <div>
                        <span className="font-semibold text-stone-800">Primary Goal: </span>
                        <span className="text-stone-600">{nextClientAppointment.focusLog?.primaryGoal}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">Digestive / Gut Observations: </span>
                        <span className="text-stone-600">{nextClientAppointment.focusLog?.digestiveConcerns}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium pt-1">
                        ✓ Logged directly into clinical dashboard for review.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          1. What is your primary nutritional priority this week?
                        </label>
                        <input
                          type="text"
                          value={focusGoalInput}
                          onChange={(e) => setFocusGoalInput(e.target.value)}
                          placeholder="e.g. Curbing evening cravings, hitting 80g daily protein"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-stone-50/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          2. Any digestive discomfort, acid reflux, or energy drops?
                        </label>
                        <input
                          type="text"
                          value={focusDigestiveInput}
                          onChange={(e) => setFocusDigestiveInput(e.target.value)}
                          placeholder="e.g. Mild bloating after dairy, 3 PM energy dip"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-stone-50/50"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveFocusLog(nextClientAppointment.id)}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Submit Focus Note
                      </button>
                    </div>
                  )}
                </div>

                {/* Reschedule / Cancel actions */}
                <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-emerald-900/10">
                  <button
                    onClick={() => setReschedulingApt(nextClientAppointment)}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleStatusChange(nextClientAppointment.id, 'No-show')}
                    className="px-4 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    Cancel Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
                <Calendar className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-800">No active consultation reserved</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Book a 1-on-1 holistic nutrition consultation with Dr. Ananya Roy.</p>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="mt-4 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow transition-all"
                >
                  Book New Session
                </button>
              </div>
            )}

            {/* Client Tabbed Appointments Section */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-stone-200/70 pb-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setClientTab('upcoming')}
                    className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                      clientTab === 'upcoming'
                        ? 'border-emerald-800 text-emerald-900'
                        : 'border-transparent text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Active Bookings ({appointments.filter((a) => a.status === 'Booked').length})
                  </button>
                  <button
                    onClick={() => setClientTab('past')}
                    className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                      clientTab === 'past'
                        ? 'border-emerald-800 text-emerald-900'
                        : 'border-transparent text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Past & Completed ({appointments.filter((a) => a.status !== 'Booked').length})
                  </button>
                </div>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Book Session
                </button>
              </div>

              <div className="divide-y divide-stone-100 mt-2">
                {appointments
                  .filter((a) => (clientTab === 'upcoming' ? a.status === 'Booked' : a.status !== 'Booked'))
                  .map((apt) => (
                    <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-stone-800">{apt.clientName}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusStyle(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          Consultant: <span className="font-semibold text-stone-700">{apt.consultantName}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                        <div className="text-xs text-stone-600 flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60">
                          <Calendar className="h-3 w-3 text-stone-400" />
                          <span>{apt.date} at {apt.time}</span>
                        </div>
                        {apt.status === 'Booked' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReschedulingApt(apt)}
                              className="text-xs text-stone-600 hover:text-stone-900 border border-stone-200 px-3 py-1 rounded-lg bg-white hover:bg-stone-50 shadow-2xs"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'No-show')}
                              className="text-xs text-rose-700 hover:text-rose-800 border border-rose-200 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 shadow-2xs"
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
          /* ==================== PRACTITIONER SUITE ==================== */
          <div className="space-y-6">
            {/* Practice Performance Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Consultations</p>
                  <p className="text-3xl font-serif text-stone-900 mt-1">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Today's Consultations ({DEMO_REFERENCE_DATE})
                  </p>
                  <p className="text-3xl font-serif text-emerald-900 mt-1">{stats.today}</p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Attendance Rate</p>
                  <p className="text-3xl font-serif text-teal-900 mt-1">{stats.attendanceRate}%</p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search client by name or phone..."
                    className="w-full text-xs pl-10 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-stone-50/50"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
                  <input
                    type="checkbox"
                    checked={todayOnly}
                    onChange={(e) => setTodayOnly(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  Today Only ({DEMO_REFERENCE_DATE})
                </label>
              </div>

              <button
                onClick={() => setIsNutritionistAddOpen(true)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition-all"
              >
                <Plus className="h-4 w-4" /> Add Consultation
              </button>
            </div>

            {/* Clinical Appointment List Cards */}
            <div className="space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                  No consultation records found matching filter criteria.
                </div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-2xs hover:border-emerald-700/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-stone-100 flex items-center justify-center font-bold text-stone-700 text-sm shrink-0">
                        {apt.clientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-stone-900">{apt.clientName}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusStyle(apt.status)}`}>
                            {apt.status}
                          </span>
                          {apt.confirmedAttendance && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Confirmed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3" /> {apt.phone || 'No phone recorded'}
                        </p>
                        {apt.focusLog?.primaryGoal && (
                          <div className="mt-2 text-xs text-stone-600 bg-[#FAF9F6] p-2 rounded-xl border border-stone-200/60 max-w-xl">
                            <span className="font-semibold text-stone-800">Focus: </span>
                            {apt.focusLog.primaryGoal}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                      <div className="text-right">
                        <p className="text-xs font-bold text-stone-800">{apt.date}</p>
                        <p className="text-xs text-stone-500 font-mono">{apt.time}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Select with strictly Booked, Done, No-show */}
                        <select
                          value={apt.status}
                          onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                          className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border transition-all cursor-pointer ${getStatusStyle(apt.status)}`}
                        >
                          <option value="Booked">Booked</option>
                          <option value="Done">Done</option>
                          <option value="No-show">No-show</option>
                        </select>

                        <button
                          onClick={() => setActiveWhatsappApt(apt)}
                          className="p-2 text-stone-500 hover:text-emerald-800 rounded-xl hover:bg-emerald-50 border border-stone-200 transition-colors"
                          title="Generate WhatsApp Confirmation Reminder"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {(isBookModalOpen || isNutritionistAddOpen) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setIsBookModalOpen(false);
                setIsNutritionistAddOpen(false);
                setFormError('');
              }}
              className="absolute right-5 top-5 text-stone-400 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-1">
              {isNutritionistAddOpen ? 'Add Manual Consultation' : 'Schedule Consultation'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">Select an open slot. Double-booking is strictly prohibited.</p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Client Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Maya Sen"
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-stone-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="98200 44444"
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-stone-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Consultation Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border rounded-xl border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-stone-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Time Slot</label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border rounded-xl border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-stone-50/50 font-medium"
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
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-stone-200">
            <button
              onClick={() => {
                setReschedulingApt(null);
                setFormError('');
              }}
              className="absolute right-5 top-5 text-stone-400 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-serif font-bold text-stone-900 mb-1">Reschedule Session</h3>
            <p className="text-xs text-stone-500 mb-4">{reschedulingApt.clientName}</p>

            {formError && (
              <div className="p-2.5 mb-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5 border border-rose-200">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={reschedulingApt.date}
                  onChange={(e) => setReschedulingApt({ ...reschedulingApt, date: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl border-stone-200 focus:ring-1 focus:ring-emerald-700 bg-stone-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">New Time Slot</label>
                <select
                  value={reschedulingApt.time}
                  onChange={(e) => setReschedulingApt({ ...reschedulingApt, time: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl border-stone-200 focus:ring-1 focus:ring-emerald-700 bg-stone-50/50 font-medium"
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
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 rounded-xl hover:bg-stone-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 shadow transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-stone-200">
            <button
              onClick={() => setActiveWhatsappApt(null)}
              className="absolute right-5 top-5 text-stone-400 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-serif font-bold text-stone-900 mb-1">WhatsApp Attendance Confirmation</h3>
            <p className="text-xs text-stone-500 mb-4">Formatted reminder for {activeWhatsappApt.clientName}</p>

            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-stone-200 text-xs font-mono text-stone-700 whitespace-pre-line select-all mb-4">
              {`Hi ${activeWhatsappApt.clientName}, this is a gentle reminder from Prana Wellness regarding your upcoming nutrition consultation scheduled for *${activeWhatsappApt.date}* at *${activeWhatsappApt.time}*.\n\nPlease reply with *CONFIRM* to lock in your slot, or let us know if you need to reschedule.`}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-400">Recipient: {activeWhatsappApt.phone || 'No phone recorded'}</span>
              <button
                onClick={() => {
                  const text = `Hi ${activeWhatsappApt.clientName}, this is a gentle reminder from Prana Wellness regarding your upcoming nutrition consultation scheduled for ${activeWhatsappApt.date} at ${activeWhatsappApt.time}. Please reply with CONFIRM to lock in your slot.`;
                  navigator.clipboard.writeText(text);
                  setCopiedReminderId(activeWhatsappApt.id);
                  setTimeout(() => setCopiedReminderId(null), 2500);
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-all shadow"
              >
                {copiedReminderId === activeWhatsappApt.id ? 'Copied to Clipboard!' : 'Copy Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
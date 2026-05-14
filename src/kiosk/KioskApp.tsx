import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Map, CalendarDays, GraduationCap, Info, Clock, ChevronLeft, ChevronRight,
  Home, Search, ArrowRight, Bell, Coffee, Globe, Building2, BookOpen, Megaphone, FileText,
  MapPin, MessageSquare, QrCode, Utensils, Salad, Cookie, CupSoda, Package, X, UserPlus
} from 'lucide-react';
import { useKioskData } from '../shared/useKioskData';
import { useI18n, type Lang } from '../shared/i18n';
import { buildFeedbackUrl } from '../shared/feedback';
import { buildEventRegistrationUrl } from '../shared/eventRegistration';
import { formatDisplayDate } from '../shared/dateFormat';
import { normalizeAnnouncementTable, normalizeAnnouncementTheme, type AnnouncementTheme } from '../shared/announcementContent';
import type { Announcement, Faculty, Schedule, ScheduleCell, Event as KioskEvent, CafeteriaCategory, InfoContent, KioskSettings } from '../shared/types';
import campusMapImage from '../../ChatGPT Image Apr 29, 2026, 10_29_39 PM.png';

const LOCALE_MAP: Record<Lang, string> = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU' };
const LANG_LABELS: Record<Lang, string> = { az: 'AZ', en: 'EN', ru: 'RU' };

const AZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const AZ_WEEKDAYS = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];

const ANNOUNCEMENT_THEME_CLASSES: Record<AnnouncementTheme, { bg: string; border: string; iconBg: string; iconText: string; titleText: string; tagBg: string; tagText: string; tableHead: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-200', iconText: 'text-red-600', titleText: 'text-red-900', tagBg: 'bg-red-600', tagText: 'text-white', tableHead: 'bg-red-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-200', iconText: 'text-amber-600', titleText: 'text-amber-900', tagBg: 'bg-amber-500', tagText: 'text-white', tableHead: 'bg-amber-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-200', iconText: 'text-blue-700', titleText: 'text-blue-950', tagBg: 'bg-blue-700', tagText: 'text-white', tableHead: 'bg-blue-800' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-200', iconText: 'text-emerald-700', titleText: 'text-emerald-950', tagBg: 'bg-emerald-700', tagText: 'text-white', tableHead: 'bg-emerald-800' },
  neutral: { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-200', iconText: 'text-slate-600', titleText: 'text-slate-900', tagBg: 'bg-slate-600', tagText: 'text-white', tableHead: 'bg-uni-blue' },
};

const formatTime = (d: Date, lang: Lang) => {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  if (lang === 'az') return `${h}:${m}`;
  return d.toLocaleTimeString(LOCALE_MAP[lang], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (d: Date, lang: Lang) => {
  if (lang === 'az') return `${AZ_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${AZ_MONTHS[d.getMonth()]}`;
  return d.toLocaleDateString(LOCALE_MAP[lang], { weekday: 'long', day: 'numeric', month: 'long' });
};

// --- Baku Weather ---
type WeatherData = { temp: number; code: number } | null;

const useBakuWeather = () => {
  const [weather, setWeather] = useState<WeatherData>(null);
  useEffect(() => {
    const fetchWeather = () => {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=40.4093&longitude=49.8671&current=temperature_2m,weather_code&timezone=Asia/Baku')
        .then(r => r.json())
        .then(d => { if (d.current) setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code }); })
        .catch(() => {});
    };
    fetchWeather();
    const iv = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);
  return weather;
};

const WeatherIcon = ({ code, size = 24, className = '' }: { code: number; size?: number; className?: string }) => {
  const s = size;
  const c = className;
  if (code === 0) return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={c}>
      <circle cx="12" cy="12" r="5" fill="#FBBF24" />
      {[0,45,90,135,180,225,270,315].map(a => <line key={a} x1="12" y1="2" x2="12" y2="5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />)}
    </svg>
  );
  if (code <= 3) return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={c}>
      <circle cx="9" cy="9" r="4" fill="#FBBF24" />
      {[0,60,120,180,240,300].map(a => <line key={a} x1="9" y1="3" x2="9" y2="5" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${a} 9 9)`} />)}
      <path d="M8 17h10a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 7 11.5V12a4 4 0 0 0 1 5z" fill="#94A3B8" />
    </svg>
  );
  if (code <= 49) return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={c}>
      <path d="M4 10h16M4 14h12M6 18h10" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 14h10a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 7 8.5V9" stroke="#CBD5E1" strokeWidth="2" />
    </svg>
  );
  if (code <= 67) return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={c}>
      <path d="M6 12h10a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 6.5V7a4 4 0 0 0 1 5z" fill="#94A3B8" />
      <line x1="8" y1="15" x2="7" y2="19" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="15" x2="11" y2="19" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="15" x2="15" y2="18" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (code <= 77) return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={c}>
      <path d="M6 12h10a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 6.5V7a4 4 0 0 0 1 5z" fill="#CBD5E1" />
      <circle cx="8" cy="17" r="1.5" fill="white" stroke="#94A3B8" />
      <circle cx="13" cy="16" r="1.5" fill="white" stroke="#94A3B8" />
      <circle cx="16" cy="19" r="1.5" fill="white" stroke="#94A3B8" />
    </svg>
  );
  if (code >= 95) return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={c}>
      <path d="M6 12h10a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 6.5V7a4 4 0 0 0 1 5z" fill="#64748B" />
      <path d="M13 12l-2 5h3l-2 5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={c}>
      <path d="M6 16h12a5 5 0 0 0 0-10h-.5A6.5 6.5 0 0 0 5 9v1a5 5 0 0 0 1 6z" fill="#94A3B8" />
    </svg>
  );
};

// --- Faculty Browser View ---
const KIOSK_DAY_NAMES = ['I', 'II', 'III', 'IV', 'V'];
const KIOSK_TIME_SLOTS = ['08⁰⁰-09²⁰', '09³⁵-10⁵⁵', '11¹⁰-12³⁰', '12⁴⁵-14⁰⁵', '14²⁰-15⁴⁰', '15⁵⁵-17¹⁵'];
const SECTOR_LABELS: Record<string, string> = { az: 'AZ', en: 'EN', ru: 'RU' };
const SECTOR_ORDER: Record<string, number> = { az: 0, en: 1, ru: 2 };

const FacultyBrowserView = ({ faculties, schedules }: { faculties: Faculty[]; schedules: Schedule[] }) => {
  const { t } = useI18n();
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [contentTab, setContentTab] = useState<'schedule' | 'announcement' | 'exam'>('announcement');
  const [courseYear, setCourseYear] = useState<number>(1);
  const [selectedSector, setSelectedSector] = useState('az');
  const [groupFilter, setGroupFilter] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [nowTick, setNowTick] = useState(() => new Date());

  // Tick every 30s so realtime class highlight stays accurate
  useEffect(() => {
    const t = setInterval(() => setNowTick(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const faculty = faculties.find(f => f.id === selectedFacultyId);
  const department = faculty?.departments.find(d => d.id === selectedDeptId);
  const getAvailableSectors = (facultyId: number, year: number) => [...new Set(schedules
    .filter(s => s.faculty_id === facultyId && s.course_year === year)
    .map(s => s.sector || 'az'))]
    .sort((a, b) => (SECTOR_ORDER[a] ?? 99) - (SECTOR_ORDER[b] ?? 99) || a.localeCompare(b));
  const getPreferredSector = (facultyId: number, year: number) => {
    const sectors = getAvailableSectors(facultyId, year);
    return sectors.includes('az') ? 'az' : sectors[0] || 'az';
  };

  // Level 1: Faculty list
  if (!faculty) {
    return (
      <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="w-28 h-28 bg-uni-gold/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Building2 size={56} className="text-uni-gold" />
            </div>
            <h3 className="text-5xl font-bold text-uni-blue mb-4">{t('faculty.title') as string}</h3>
            <p className="text-2xl text-gray-500">{t('faculty.select') as string}</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-6">
            {faculties.map((f, i) => {
              const facultySchedules = schedules.filter(s => s.faculty_id === f.id);
              const availableYears = [...new Set(facultySchedules.map(s => s.course_year))].sort();
              const disabled = availableYears.length === 0;
              return (
                <motion.button key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  whileTap={disabled ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedFacultyId(f.id);
                    setSelectedDeptId(null);
                    setCourseYear(availableYears[0]);
                    setSelectedSector(getPreferredSector(f.id, availableYears[0]));
                    setContentTab('schedule');
                    setGroupFilter('');
                    setShowKeyboard(false);
                  }}
                  disabled={disabled}
                  className={`bg-white rounded-[2rem] p-8 shadow-sm border text-left flex items-center gap-6 group transition-all ${disabled
                    ? 'border-gray-100 opacity-55 cursor-not-allowed'
                    : 'border-gray-100 hover:shadow-lg'}`}>
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${disabled
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-50 text-uni-blue group-hover:bg-uni-blue group-hover:text-white'}`}>
                    <GraduationCap size={40} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-2xl font-bold mb-1 leading-tight ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>{f.name}</h4>
                    <p className="text-lg text-gray-500">{disabled ? 'Cədvəl hazırlanır' : `${availableYears.join(', ')} kurs cədvəli`}</p>
                  </div>
                  <ChevronRight size={32} className={`transition-colors shrink-0 ${disabled ? 'text-gray-200' : 'text-gray-300 group-hover:text-uni-blue'}`} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Level 2: Department list (with schedule link at top)
  if (!department && contentTab !== 'schedule') {
    const facultySchedules = schedules.filter(s => s.faculty_id === faculty.id);
    const hasSchedules = facultySchedules.length > 0;
    const availableYears = [...new Set(facultySchedules.map(s => s.course_year))].sort();
    return (
      <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setSelectedFacultyId(null)}
            className="flex items-center gap-3 text-xl font-bold text-uni-blue bg-white px-6 py-3 rounded-full shadow-sm mb-8 hover:bg-gray-50 transition-colors w-fit border border-gray-100">
            <ChevronLeft size={24} /> {t('faculty.back') as string}
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h3 className="text-4xl font-bold text-uni-blue mb-2">{faculty.name}</h3>
          </motion.div>

          {/* Schedule section */}
          {hasSchedules && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-uni-blue/10 rounded-xl flex items-center justify-center">
                  <Clock size={22} className="text-uni-blue" />
                </div>
                <h4 className="text-2xl font-bold text-uni-blue">{t('dept.schedules') as string}</h4>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((y, i) => {
                  const exists = availableYears.includes(y);
                  return (
                    <motion.button key={y} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                      whileTap={exists ? { scale: 0.95 } : undefined}
                      onClick={() => { if (exists) { setCourseYear(y); setSelectedSector(getPreferredSector(faculty.id, y)); setContentTab('schedule'); } }}
                      className={`relative rounded-[1.5rem] p-6 text-left transition-all ${exists
                        ? 'bg-gradient-to-br from-uni-blue to-blue-800 shadow-lg hover:shadow-xl cursor-pointer'
                        : 'bg-gray-100 border border-gray-200 cursor-default'}`}>
                      <span className={`text-5xl font-black ${exists ? 'text-white' : 'text-gray-300'}`}>{y}</span>
                      <p className={`text-lg font-semibold mt-2 ${exists ? 'text-blue-200' : 'text-gray-400'}`}>{t('dept.courseYear') as string}</p>
                      {exists && (
                        <div className="absolute top-5 right-5">
                          <ChevronRight size={24} className="text-white/50" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Divider */}
          {hasSchedules && faculty.departments.length > 0 && (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BookOpen size={22} className="text-indigo-600" />
                </div>
                <span className="text-xl font-bold text-gray-400">{t('faculty.selectDept') as string}</span>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Departments */}
          <div className="grid grid-cols-1 gap-5">
            {faculty.departments.map((d, i) => (
              <motion.button key={d.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (i + 1) * 0.08 }}
                whileTap={{ scale: 0.99 }} onClick={() => { setSelectedDeptId(d.id); setContentTab('announcement'); }}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all text-left flex items-center gap-6 group">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-2xl font-bold text-gray-900 leading-tight">{d.name}</h4>
                </div>
                <ChevronRight size={28} className="text-gray-300 group-hover:text-indigo-600 transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Level 3a: Faculty schedule grid view
  if (contentTab === 'schedule' && !selectedDeptId) {
    const facultySchedules = schedules.filter(s => s.faculty_id === faculty.id);
    const yearSchedules = facultySchedules.filter(s => s.course_year === courseYear);
    const availableSectors = getAvailableSectors(faculty.id, courseYear);
    const activeSector = availableSectors.includes(selectedSector) ? selectedSector : getPreferredSector(faculty.id, courseYear);
    const schedule = yearSchedules.find(s => s.sector === activeSector) || yearSchedules[0];
    return (
      <div className="flex-1 pt-40 pb-12 px-8 overflow-y-auto">
        <div className="max-w-[95vw] mx-auto">
          <button onClick={() => { setSelectedFacultyId(null); setSelectedDeptId(null); setContentTab('announcement'); setGroupFilter(''); setShowKeyboard(false); }}
            className="flex items-center gap-3 text-xl font-bold text-uni-blue bg-white px-6 py-3 rounded-full shadow-sm mb-6 hover:bg-gray-50 transition-colors w-fit border border-gray-100">
            <ChevronLeft size={24} /> {faculty.name}
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h3 className="text-4xl font-bold text-uni-blue mb-2">{t('dept.schedules') as string}</h3>
          </motion.div>

          {/* Course year selector + group filter */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex gap-3">
              {[1, 2, 3, 4].map(y => {
                const exists = facultySchedules.some(s => s.course_year === y);
                return (
                  <button key={y} onClick={() => { if (exists) { setCourseYear(y); setSelectedSector(getPreferredSector(faculty.id, y)); setGroupFilter(''); } }}
                    className={`w-16 h-16 rounded-2xl text-2xl font-bold transition-all ${courseYear === y ? 'bg-uni-gold text-white shadow-lg' : exists ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50' : 'bg-gray-100 text-gray-300 border border-gray-100 cursor-default'}`}>
                    {y}
                  </button>
                );
              })}
              <span className="flex items-center text-xl text-gray-400 ml-1">{t('dept.courseYear') as string}</span>
            </div>
            {availableSectors.length > 1 && (
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
                {availableSectors.map(sector => (
                  <button
                    key={sector}
                    onClick={() => { setSelectedSector(sector); setGroupFilter(''); setShowKeyboard(false); }}
                    className={`h-12 min-w-16 px-5 rounded-xl text-base font-black transition-all ${activeSector === sector
                      ? 'bg-uni-blue text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {SECTOR_LABELS[sector] || sector.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            {schedule && schedule.groups.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setShowKeyboard(v => !v)}
                  className={`flex items-center gap-3 pl-5 pr-5 py-3 text-lg rounded-2xl shadow-sm border transition-all ${groupFilter ? 'bg-uni-blue text-white border-uni-blue' : 'bg-white text-gray-500 border-gray-200 hover:border-uni-blue/50'}`}>
                  <Search size={20} />
                  <span className="min-w-[120px] text-left">{groupFilter || (t('schedule.searchGroup') as string || 'Qrup axtar...')}</span>
                  {groupFilter && (
                    <span onClick={e => { e.stopPropagation(); setGroupFilter(''); setShowKeyboard(false); }}
                      className="ml-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm hover:bg-white/30">&times;</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Schedule grid */}
          {schedule && schedule.groups.length > 0 ? (() => {
            const filteredIndices = groupFilter.trim()
              ? schedule.groups.map((g, i) => ({ g, i })).filter(({ g }) => g.toLowerCase().includes(groupFilter.trim().toLowerCase())).map(({ i }) => i)
              : schedule.groups.map((_, i) => i);
            const filteredGroups = filteredIndices.map(i => schedule.groups[i]);

            // Current time detection for "live" highlight
            const now = nowTick;
            const nowDay = now.getDay(); // 0=Sun,1=Mon...6=Sat
            const nowMin = now.getHours() * 60 + now.getMinutes();
            const slotRanges = [
              { start: 8 * 60, end: 9 * 60 + 20 },       // 08:00-09:20
              { start: 9 * 60 + 35, end: 10 * 60 + 55 },  // 09:35-10:55
              { start: 11 * 60 + 10, end: 12 * 60 + 30 },  // 11:10-12:30
              { start: 12 * 60 + 45, end: 14 * 60 + 5 },   // 12:45-14:05
              { start: 14 * 60 + 20, end: 15 * 60 + 40 },  // 14:20-15:40
              { start: 15 * 60 + 55, end: 17 * 60 + 15 },  // 15:55-17:15
            ];
            const currentDayIdx = nowDay >= 1 && nowDay <= 5 ? nowDay - 1 : -1; // 0-4 Mon-Fri
            const currentSlotIdx = slotRanges.findIndex(r => nowMin >= r.start && nowMin <= r.end);

            return filteredGroups.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-uni-blue">
                    <th className="px-4 py-4 text-base font-bold text-white border-r border-blue-700 sticky left-0 bg-uni-blue z-10 w-16">{t('schedule.day') as string || 'Gün'}</th>
                    <th className="px-3 py-4 text-sm font-bold text-white border-r border-blue-700 sticky left-16 bg-uni-blue z-10 w-28">{t('schedule.time') as string || 'Saat'}</th>
                    {filteredGroups.map((g, i) => (
                      <th key={i} className="px-3 py-4 text-sm font-bold text-white border-r border-blue-700 min-w-[160px]">{g}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {KIOSK_DAY_NAMES.map((dayName, dayIdx) =>
                    KIOSK_TIME_SLOTS.map((slot, slotIdx) => {
                      const isLiveRow = dayIdx === currentDayIdx && slotIdx === currentSlotIdx;
                      return (
                      <tr key={`${dayIdx}_${slotIdx}`} className={`${slotIdx === 0 ? 'border-t-2 border-uni-blue/30' : 'border-t border-gray-100'}`}>
                        {slotIdx === 0 && (
                          <td rowSpan={KIOSK_TIME_SLOTS.length} className={`px-3 py-2 text-center font-black text-2xl border-r border-gray-200 sticky left-0 z-10 align-middle ${dayIdx === currentDayIdx ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-uni-blue'}`}>{dayName}</td>
                        )}
                        <td className={`px-2 py-3 text-sm font-semibold border-r border-gray-200 sticky left-16 z-10 whitespace-nowrap ${isLiveRow ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-gray-600'}`}>{slot}</td>
                        {filteredIndices.map((gIdx) => {
                          const key = `${dayIdx + 1}_${slotIdx + 1}_${gIdx}`;
                          const cell = schedule.cells[key];
                          const isLive = isLiveRow && !!cell;
                          return (
                            <td key={gIdx} className={`px-2 py-2 border-r border-gray-100 align-top transition-colors ${isLive ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-400 rounded-lg' : ''}`}>
                              {cell ? (
                                <div>
                                  {isLive && <p className="text-[11px] font-bold text-emerald-600 mb-1 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" /> İndi gedir</p>}
                                  <p className={`text-sm font-bold leading-snug whitespace-pre-line ${isLive ? 'text-emerald-900' : 'text-gray-800'}`}>{cell.s}</p>
                                  <p className={`text-xs leading-snug mt-1 whitespace-pre-line ${isLive ? 'text-emerald-700' : 'text-gray-500'}`}>{cell.t}</p>
                                  {cell.r && <p className={`text-xs font-bold mt-0.5 whitespace-pre-line ${isLive ? 'text-emerald-600' : 'text-uni-blue'}`}>Aud: {cell.r}</p>}
                                </div>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </motion.div>
            ) : (
              <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100 mt-2">
                <Search size={40} className="text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">"{groupFilter}" {t('schedule.noMatch') as string || 'adlı qrup tapılmadı'}</p>
              </div>
            );
          })() : (
            <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center mt-6">
              <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">
                <Search size={48} className="text-gray-300" />
              </div>
              <h3 className="text-3xl font-bold text-uni-blue mb-3">{t('dept.empty') as string}</h3>
              <p className="text-xl text-gray-500">{t('dept.empty.desc') as string}</p>
            </div>
          )}

          {/* On-screen keyboard */}
          <AnimatePresence>
            {showKeyboard && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-gray-100/95 backdrop-blur-md border-t border-gray-300 shadow-2xl px-4 pb-6 pt-4">
                {/* Display bar */}
                <div className="max-w-3xl mx-auto mb-4 flex items-center gap-3">
                  <div className="flex-1 bg-white rounded-2xl px-5 py-3 text-2xl font-semibold text-gray-800 border border-gray-200 shadow-sm min-h-[52px] flex items-center">
                    {groupFilter || <span className="text-gray-400">{t('schedule.searchGroup') as string || 'Qrup axtar...'}</span>}
                    <span className="animate-pulse text-uni-blue ml-0.5">|</span>
                  </div>
                  <button onClick={() => setShowKeyboard(false)}
                    className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm text-2xl font-bold shrink-0">
                    ✕
                  </button>
                </div>
                {/* Keys */}
                <div className="max-w-3xl mx-auto space-y-2">
                  {[
                    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
                    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'İ', 'O', 'P'],
                    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ə', 'Ö', 'Ü'],
                  ].map((row, ri) => (
                    <div key={ri} className="flex justify-center gap-1.5">
                      {row.map(k => (
                        <button key={k} onClick={() => setGroupFilter(v => v + k)}
                          className="w-[9%] max-w-[72px] h-14 bg-white rounded-xl border border-gray-200 text-xl font-bold text-gray-800 shadow-sm active:bg-uni-blue active:text-white active:scale-95 transition-all">
                          {k}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => setGroupFilter(v => v.slice(0, -1))}
                      className="w-[18%] max-w-[144px] h-14 bg-gray-200 rounded-xl border border-gray-300 text-lg font-bold text-gray-600 shadow-sm active:bg-red-500 active:text-white transition-all flex items-center justify-center gap-2">
                      ← Sil
                    </button>
                    <button onClick={() => setGroupFilter(v => v + ' ')}
                      className="flex-1 max-w-[360px] h-14 bg-white rounded-xl border border-gray-200 text-lg font-semibold text-gray-500 shadow-sm active:bg-gray-100 transition-all">
                      Boşluq
                    </button>
                    <button onClick={() => { setGroupFilter(''); setShowKeyboard(false); }}
                      className="w-[18%] max-w-[144px] h-14 bg-gray-200 rounded-xl border border-gray-300 text-lg font-bold text-gray-600 shadow-sm active:bg-red-500 active:text-white transition-all flex items-center justify-center">
                      Təmizlə
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }
  const tabs: { key: 'announcement' | 'exam'; label: string; icon: React.ReactNode }[] = [
    { key: 'announcement', label: t('dept.announcements') as string, icon: <Megaphone size={24} /> },
    { key: 'exam', label: t('dept.exams') as string, icon: <FileText size={24} /> },
  ];

  const contentForTab = department.content.filter(c => c.type === contentTab);

  return (
    <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setSelectedDeptId(null)}
          className="flex items-center gap-3 text-xl font-bold text-uni-blue bg-white px-6 py-3 rounded-full shadow-sm mb-6 hover:bg-gray-50 transition-colors w-fit border border-gray-100">
          <ChevronLeft size={24} /> {faculty.name}
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h3 className="text-4xl font-bold text-uni-blue mb-2">{department.name}</h3>
        </motion.div>

        {/* Content type tabs */}
        <div className="flex gap-3 mb-8">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => { setContentTab(tb.key); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-full text-xl font-bold transition-all ${contentTab === tb.key ? 'bg-uni-blue text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* Content display */}
        {contentForTab.length > 0 ? (
          <div className="space-y-6">
            {contentForTab.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-full max-h-[600px] object-contain bg-gray-50" referrerPolicy="no-referrer" />
                )}
                <div className="p-8">
                  <h4 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h4>
                  {item.description && <p className="whitespace-pre-wrap text-left text-xl text-gray-600 leading-relaxed">{item.description}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center mt-6">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">
              <Search size={48} className="text-gray-300" />
            </div>
            <h3 className="text-3xl font-bold text-uni-blue mb-3">{t('dept.empty') as string}</h3>
            <p className="text-xl text-gray-500">{t('dept.empty.desc') as string}</p>
          </div>
        )}
      </div>
    </div>
  );
};
const Screensaver = ({ onWake, weather }: { onWake: () => void; weather: WeatherData }) => {
  const [time, setTime] = useState(new Date());
  const { t, lang } = useI18n();
  const locale = LOCALE_MAP[lang];
  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} onClick={onWake}
      className="absolute inset-0 bg-uni-blue flex flex-col items-center justify-center cursor-pointer z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/universitycampus/1920/1080')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-uni-blue via-uni-blue/80 to-transparent"></div>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="flex flex-col items-center relative z-10">
        <GraduationCap size={100} className="text-uni-gold mb-8 drop-shadow-2xl" />
        <h1 className="text-7xl font-serif font-semibold mb-4 tracking-tight text-white text-shadow-md">{t('uni.name') as string}</h1>
        <p className="text-3xl text-blue-200 mb-16 font-light tracking-wide uppercase">{t('kiosk.title') as string}</p>
        <div className="text-[10rem] font-light tracking-tighter text-white text-shadow-md leading-none">
          {formatTime(time, lang)}
        </div>
        {weather && (
          <div className="flex items-center gap-4 mt-6 mb-14">
            <WeatherIcon code={weather.code} size={40} />
            <span className="text-4xl font-light text-white/90">{weather.temp}°C</span>
            <span className="text-2xl text-blue-200/70 font-light">·</span>
            <span className="text-2xl text-blue-200/70 font-light tracking-wide">Bakı</span>
          </div>
        )}
        {!weather && <div className="mb-20" />}
        <motion.div animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="glass-panel-dark px-10 py-5 rounded-full flex items-center gap-4">
          <span className="text-3xl font-medium text-white tracking-wide">{t('kiosk.touch') as string}</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// --- Header ---
const Header = ({ title, onHome, onBack, weather }: { title: string; onHome: () => void; onBack?: () => void; weather: WeatherData }) => {
  const [time, setTime] = useState(new Date());
  const { lang, setLang, t } = useI18n();
  const locale = LOCALE_MAP[lang];
  const [showLangPicker, setShowLangPicker] = useState(false);
  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);

  const homeTitle = t('nav.home') as string;

  return (
    <header className="absolute top-0 left-0 right-0 px-10 py-8 flex items-start justify-between z-40 pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto">
        {onBack && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-20 h-20 flex items-center justify-center rounded-full glass-panel text-uni-blue hover:bg-white/90 transition-colors shadow-lg">
            <ChevronLeft size={40} />
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.9 }} onClick={onHome} className="w-20 h-20 flex items-center justify-center rounded-full bg-uni-blue text-white shadow-xl hover:bg-blue-900 transition-colors">
          <Home size={36} />
        </motion.button>
        {title !== homeTitle && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel px-8 py-5 rounded-full ml-4">
            <h2 className="text-3xl font-bold text-uni-blue">{title}</h2>
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-6 pointer-events-auto">
        <div className="glass-panel px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-lg">
          {/* Clock */}
          <div className="text-right">
            <div className="text-4xl font-bold text-uni-blue tracking-tight leading-none">{formatTime(time, lang)}</div>
            <div className="text-gray-500 font-medium text-base mt-1">{formatDate(time, lang)}</div>
          </div>
          {/* Weather divider + widget */}
          {weather && (
            <>
              <div className="w-px h-12 bg-gray-200" />
              <div className="flex items-center gap-3">
                <WeatherIcon code={weather.code} size={32} />
                <div>
                  <div className="text-2xl font-bold text-uni-blue leading-none">{weather.temp}°</div>
                  <div className="text-xs text-gray-400 font-medium flex items-center gap-0.5 mt-0.5"><MapPin size={10} />Bakı</div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setShowLangPicker(!showLangPicker)}
            className="w-20 h-20 rounded-full glass-panel flex items-center justify-center text-uni-blue font-bold text-2xl gap-1 hover:bg-white/90 transition-colors">
            <Globe size={20} />{LANG_LABELS[lang]}
          </button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-3 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 z-50">
                {(['az', 'en', 'ru'] as Lang[]).map(l => (
                  <button key={l} onClick={() => { setLang(l); setShowLangPicker(false); }}
                    className={`w-full px-8 py-4 text-xl font-bold text-left hover:bg-gray-50 transition-colors ${lang === l ? 'text-uni-blue bg-blue-50' : 'text-gray-700'}`}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

// --- Home Menu ---
const HomeMenu = ({ onNavigate, announcements, settings }: { onNavigate: (v: string) => void; announcements: Announcement[]; settings?: KioskSettings }) => {
  const { t } = useI18n();
  const tickerEnabled = settings?.ticker_enabled !== false;
  const tickerMode = settings?.ticker_mode || 'scroll';
  const pinnedId = settings?.ticker_pinned_id;

  const tickerAnnouncements = pinnedId
    ? announcements.filter(a => a.id === pinnedId)
    : announcements;

  const [annIndex, setAnnIndex] = useState(0);
  useEffect(() => {
    if (!tickerAnnouncements.length || tickerMode === 'static') return;
    const iv = setInterval(() => setAnnIndex(p => (p + 1) % tickerAnnouncements.length), 5000);
    return () => clearInterval(iv);
  }, [tickerAnnouncements.length, tickerMode]);

  const currentAnn = tickerAnnouncements[annIndex] || { title: '', description: '', type: '', importance: 'low' as const };

  const getBannerConfig = (importance: string) => {
    switch (importance) {
      case 'high': return { bg: 'from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border-red-500/50', iconColor: 'fill-red-600 text-red-600' };
      case 'medium': return { bg: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-amber-500/50', iconColor: 'fill-amber-600 text-amber-600' };
      default: return { bg: 'from-slate-600 to-gray-700 hover:from-slate-500 hover:to-gray-600 border-slate-500/50', iconColor: 'fill-slate-600 text-slate-600' };
    }
  };
  const bannerConfig = getBannerConfig(currentAnn.importance);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

  return (
    <div className="flex-1 pt-48 pb-10 px-12 overflow-hidden flex flex-col items-center justify-center gap-6 max-h-screen">
      {tickerEnabled && tickerAnnouncements.length > 0 && (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onClick={() => onNavigate('announcements')}
        className={`w-full max-w-7xl h-24 bg-gradient-to-r ${bannerConfig.bg} transition-colors duration-700 rounded-full flex items-center px-8 relative overflow-hidden shadow-2xl shrink-0 cursor-pointer border`}>
        <motion.div animate={{ opacity: [0, 0.15, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute inset-0 bg-white" />
        <div className="relative z-10 flex items-center gap-6 w-full">
          <motion.div animate={{ scale: [1, 1.15, 1], boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 15px rgba(255,255,255,0.6)", "0 0 0px rgba(255,255,255,0)"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className={`w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 ${bannerConfig.iconColor} transition-colors duration-700`}>
            <Bell size={28} />
          </motion.div>
          <div className="flex-1 h-12 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={annIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center gap-4 w-full">
                <span className="font-bold text-lg uppercase tracking-wider bg-white/20 px-4 py-1.5 rounded-xl shrink-0 text-white text-shadow-sm border border-white/20">{currentAnn.type}</span>
                <span className="text-3xl text-white truncate text-shadow-sm font-light"><strong className="font-bold mr-2">{currentAnn.title}:</strong>{currentAnn.description}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0"><ArrowRight size={28} className="text-white" /></div>
        </div>
      </motion.div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-3 grid-rows-3 gap-6 w-full max-w-7xl flex-1 min-h-0">
        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('faculties')}
          className="col-span-2 row-span-2 rounded-[2.5rem] bg-uni-blue p-10 relative overflow-hidden group shadow-xl text-left flex flex-col">
          <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-500 text-uni-gold"><Building2 size={300} /></div>
          <div className="absolute bottom-0 right-0 p-10 opacity-20"><GraduationCap size={200} className="text-white" /></div>
          <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-auto text-uni-gold backdrop-blur-md"><Building2 size={40} /></div>
          <div className="relative z-10 mt-8">
            <h3 className="text-5xl font-bold text-white mb-3 text-shadow-md">{t('nav.faculties') as string}</h3>
            <p className="text-2xl text-blue-200 max-w-md">{t('nav.faculties.desc') as string}</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('map')}
          className="col-span-1 row-span-1 rounded-[2.5rem] relative overflow-hidden group shadow-xl text-left flex flex-col justify-end p-8">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${campusMapImage})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
          <div className="relative z-10">
            <div className="glass-panel-dark w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white"><Map size={28} /></div>
            <h3 className="text-3xl font-bold text-white mb-1 text-shadow-md">{t('nav.map') as string}</h3>
            <p className="text-lg text-gray-300">{t('nav.map.desc') as string}</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('info')}
          className="col-span-1 row-span-1 rounded-[2.5rem] bg-white p-8 relative overflow-hidden group shadow-xl text-left flex flex-col justify-center border border-gray-100">
          <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-uni-blue mb-4 transition-colors group-hover:bg-uni-blue group-hover:text-white"><Info size={28} /></div>
          <div><h3 className="text-3xl font-bold text-uni-blue mb-1">{t('nav.info') as string}</h3><p className="text-lg text-gray-500">{t('nav.info.desc') as string}</p></div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('events')}
          className="col-span-1 row-span-1 rounded-[2.5rem] bg-emerald-700 relative overflow-hidden group shadow-xl text-left flex flex-col justify-end p-8">
          <div className="glass-panel-dark w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-400 z-10 mb-4 transition-transform group-hover:scale-110"><CalendarDays size={28} /></div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-white mb-1 text-shadow-md">{t('nav.events') as string}</h3>
            <p className="text-lg text-emerald-100">{t('nav.events.desc') as string}</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('cafeteria')}
          className="col-span-1 row-span-1 rounded-[2.5rem] bg-orange-500 p-8 relative overflow-hidden group shadow-xl text-left flex flex-col justify-end">
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center text-white backdrop-blur-md mb-4 transition-colors group-hover:bg-white group-hover:text-amber-600"><Coffee size={28} /></div>
            <h3 className="text-3xl font-bold text-white mb-1 text-shadow-md">{t('nav.cafeteria') as string}</h3>
            <p className="text-lg text-orange-100">{t('nav.cafeteria.desc') as string}</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('feedback')}
          className="col-span-1 row-span-1 rounded-[2.5rem] bg-white p-8 relative overflow-hidden group shadow-xl text-left flex flex-col justify-end border border-gray-100">
          <div className="absolute right-5 top-5 text-uni-gold/15 transition-transform duration-500 group-hover:scale-110"><QrCode size={92} /></div>
          <div className="relative z-10">
            <div className="bg-uni-gold/15 w-14 h-14 rounded-2xl flex items-center justify-center text-uni-blue mb-4 transition-colors group-hover:bg-uni-gold group-hover:text-white"><MessageSquare size={28} /></div>
            <h3 className="text-3xl font-bold text-uni-blue mb-1">{t('nav.feedback') as string}</h3>
            <p className="text-lg text-gray-500">{t('nav.feedback.desc') as string}</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

const FeedbackQrView = () => {
  const { t } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const feedbackUrl = buildFeedbackUrl(window.location.href);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(feedbackUrl, { width: 520, margin: 1, color: { dark: '#0A2540', light: '#FFFFFF' } })
      .then(url => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [feedbackUrl]);

  return (
    <div className="flex-1 pt-44 pb-12 px-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-[1fr_460px] gap-12 items-center min-h-full">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-24 h-24 bg-uni-gold/15 rounded-[2rem] flex items-center justify-center text-uni-blue mb-8">
            <MessageSquare size={50} />
          </div>
          <h3 className="text-6xl font-bold text-uni-blue leading-tight mb-6">{t('nav.feedback') as string}</h3>
          <p className="text-3xl leading-relaxed text-gray-600 max-w-2xl">
            QR kodu telefonla oxudun, mesajını rahat yazıb göndər.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100">
          <div className="aspect-square rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Təklif və iradlar QR kodu" className="w-full h-full p-6" />
            ) : (
              <QrCode size={180} className="text-gray-300" />
            )}
          </div>
          <p className="mt-6 text-center text-lg font-semibold text-gray-500">Telefon kameranı QR koda yönəlt.</p>
        </motion.div>
      </div>
    </div>
  );
};

// --- Map View ---
const MapView = () => {
  const { t } = useI18n();
  const places = t('map.places') as string[];
  return (
    <div className="absolute inset-0 bg-gray-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${campusMapImage})` }}
      ></div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 w-full max-w-4xl px-8">
        <div className="glass-panel w-full rounded-full p-4 flex items-center gap-4 shadow-2xl">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-uni-blue shadow-sm"><Search size={28} /></div>
          <input type="text" placeholder={t('map.search') as string} className="flex-1 bg-transparent text-2xl text-uni-blue placeholder-gray-500 outline-none px-4 font-medium" />
          <button className="px-10 py-4 bg-uni-blue text-white rounded-full text-xl font-bold shadow-md">{t('map.search.btn') as string}</button>
        </div>
        <div className="flex gap-4">
          {places.map(place => (
            <button key={place} className="glass-panel px-8 py-4 rounded-full text-xl font-bold text-uni-blue hover:bg-white transition-colors shadow-lg">{place}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Events View ---
const EventsView = ({ events }: { events: KioskEvent[] }) => {
  const { t } = useI18n();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showRegistrationQr, setShowRegistrationQr] = useState(false);
  const [registrationQrDataUrl, setRegistrationQrDataUrl] = useState('');
  const selectedEvent = events.find(ev => ev.id === selectedEventId);
  const registrationUrl = selectedEvent ? buildEventRegistrationUrl(selectedEvent.id, window.location.href) : '';

  useEffect(() => {
    if (!showRegistrationQr || !selectedEvent) {
      setRegistrationQrDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(registrationUrl, { width: 560, margin: 1, color: { dark: '#0A2540', light: '#FFFFFF' } })
      .then(url => { if (!cancelled) setRegistrationQrDataUrl(url); })
      .catch(() => { if (!cancelled) setRegistrationQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [registrationUrl, selectedEvent, showRegistrationQr]);

  if (selectedEvent) {
    const registrationEnabled = selectedEvent.registration_enabled !== false;

    return (
      <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => { setShowRegistrationQr(false); setSelectedEventId(null); }} className="flex items-center gap-3 text-xl font-bold text-uni-blue bg-white px-6 py-3 rounded-full shadow-sm mb-6 hover:bg-gray-50 transition-colors w-fit border border-gray-100">
            <ChevronLeft size={24} /> {t('events.back') as string}
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-xl overflow-hidden flex flex-col">
            <div className="w-full h-96 overflow-hidden">
              <img src={selectedEvent.image_url || 'https://picsum.photos/seed/event/800/600'} alt={selectedEvent.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="px-12 pt-10">
              <span className="bg-uni-gold text-white px-5 py-2 rounded-full font-bold tracking-wider uppercase text-sm mb-4 inline-block shadow-md">{selectedEvent.type}</span>
              <h2 className="text-5xl font-bold leading-tight text-uni-blue">{selectedEvent.title}</h2>
            </div>
            <div className="p-12 pt-8 flex flex-col lg:flex-row gap-12">
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-uni-blue mb-6 border-b border-gray-100 pb-4">{t('events.about') as string}</h3>
                <p className="whitespace-pre-wrap text-left text-2xl text-gray-600 leading-relaxed font-light">{selectedEvent.description}</p>
                {registrationEnabled && (
                  <div className="mt-12 flex justify-start">
                    <button onClick={() => setShowRegistrationQr(true)} className="bg-uni-blue text-white px-10 py-5 rounded-[2rem] text-2xl font-bold shadow-xl hover:bg-blue-900 transition-colors cursor-pointer w-full text-center">{t('events.register') as string}</button>
                  </div>
                )}
              </div>
              <div className="w-full lg:w-1/3 bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 h-fit">
                <h4 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">{t('events.details') as string}</h4>
                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-uni-gold shadow-sm shrink-0"><CalendarDays size={32} /></div>
                    <div><p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">{t('events.date') as string}</p><p className="text-xl font-bold text-gray-800">{formatDisplayDate(selectedEvent.date)}</p></div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-uni-gold shadow-sm shrink-0"><Clock size={32} /></div>
                    <div><p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">{t('events.time') as string}</p><p className="text-xl font-bold text-gray-800">{selectedEvent.time_slot}</p></div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-uni-blue shadow-sm shrink-0"><Map size={32} /></div>
                    <div><p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">{t('events.location') as string}</p><p className="text-xl font-bold text-gray-800">{selectedEvent.location}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <AnimatePresence>
          {showRegistrationQr && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-10 backdrop-blur-md"
              onClick={() => setShowRegistrationQr(false)}>
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                className="w-full max-w-4xl rounded-[3rem] bg-white p-10 shadow-2xl"
                onClick={event => event.stopPropagation()}>
                <div className="mb-8 flex items-start justify-between gap-8">
                  <div>
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-uni-blue text-white">
                      <UserPlus size={34} />
                    </div>
                    <h3 className="text-4xl font-bold leading-tight text-uni-blue">Tədbir qeydiyyatı</h3>
                    <p className="mt-3 max-w-2xl text-2xl leading-relaxed text-gray-600">QR kodu telefonla oxut, ad soyad və qrupunu yaz.</p>
                  </div>
                  <button onClick={() => setShowRegistrationQr(false)} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                    <X size={30} />
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_360px] gap-10 items-center">
                  <div>
                    <p className="text-xl font-bold text-gray-500">{formatDisplayDate(selectedEvent.date)} · {selectedEvent.time_slot}</p>
                    <p className="mt-3 text-3xl font-bold leading-tight text-gray-900">{selectedEvent.title}</p>
                    <p className="mt-3 text-xl text-gray-500">{selectedEvent.location}</p>
                  </div>
                  <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-5">
                    <div className="aspect-square rounded-[1.5rem] bg-white flex items-center justify-center overflow-hidden">
                      {registrationQrDataUrl ? (
                        <img src={registrationQrDataUrl} alt="Tədbir qeydiyyatı QR kodu" className="h-full w-full p-4" />
                      ) : (
                        <QrCode size={150} className="text-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-10">
        {events.map((event, i) => (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={event.id}
            onClick={() => setSelectedEventId(event.id)} className="bg-white rounded-[2.5rem] shadow-lg overflow-hidden flex flex-col group cursor-pointer">
            <div className="relative h-80 overflow-hidden">
              <img src={event.image_url || 'https://picsum.photos/seed/event/800/600'} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute top-6 left-6 glass-panel px-6 py-2 rounded-full text-white font-bold tracking-wider uppercase text-sm border-white/20">{event.type}</div>
            </div>
            <div className="p-10 flex-1 flex flex-col relative">
              <div className="absolute right-8 top-8 w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-uni-blue group-hover:text-white transition-colors"><ArrowRight size={28} /></div>
              <h3 className="text-4xl font-bold text-uni-blue mb-6 leading-tight pr-16">{event.title}</h3>
              <div className="mt-auto space-y-4 text-xl text-gray-600 font-medium">
                <div className="flex items-center gap-4"><CalendarDays size={28} className="text-uni-gold" /><span>{formatDisplayDate(event.date)} &bull; {event.time_slot}</span></div>
                <div className="flex items-center gap-4"><Map size={28} className="text-gray-400" /><span>{event.location}</span></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Cafeteria View ---
const CafeteriaView = ({ menu }: { menu: CafeteriaCategory[] }) => {
  const { t } = useI18n();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(menu[0]?.id ?? null);

  useEffect(() => {
    if (menu.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    if (!menu.some(category => category.id === selectedCategoryId)) {
      setSelectedCategoryId(menu[0].id);
    }
  }, [menu, selectedCategoryId]);

  const selectedCategory = menu.find(category => category.id === selectedCategoryId) ?? menu[0];
  const totalItems = menu.reduce((sum, category) => sum + category.items.length, 0);
  const totalPrice = selectedCategory?.items.reduce((sum, item) => sum + (item.price || 0), 0) ?? 0;
  const formatMenuPrice = (price: number | null) => {
    if (price === null) return '';
    return `${Number(price).toLocaleString('az-AZ', { minimumFractionDigits: price % 1 === 0 ? 0 : 1, maximumFractionDigits: 2 })} ₼`;
  };
  const categoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('içki')) return <CupSoda size={34} />;
    if (lowerName.includes('salat')) return <Salad size={34} />;
    if (lowerName.includes('atış')) return <Cookie size={34} />;
    if (lowerName.includes('digər')) return <Package size={34} />;
    return <Utensils size={34} />;
  };

  if (menu.length === 0) {
    return (
      <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-[2rem] border border-gray-100 p-14 text-center shadow-sm">
          <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Coffee size={48} className="text-orange-500" />
          </div>
          <h3 className="text-4xl font-bold text-uni-blue mb-3">{t('cafeteria.title') as string}</h3>
          <p className="text-xl text-gray-500">Menyu hələ əlavə edilməyib.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pt-44 pb-10 px-10 overflow-hidden">
      <div className="max-w-[92rem] mx-auto h-full flex flex-col gap-7">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-orange-50 text-orange-700 font-bold text-lg mb-4">
              <Coffee size={24} /> {totalItems} məhsul
            </div>
            <h3 className="text-5xl font-bold text-uni-blue mb-3">{t('cafeteria.title') as string}</h3>
            <p className="text-xl text-gray-500 max-w-3xl">{t('cafeteria.desc') as string}</p>
          </div>
          {selectedCategory && (
            <div className="bg-white border border-orange-100 rounded-[2rem] px-7 py-5 shadow-sm text-right min-w-72">
              <p className="text-sm font-black uppercase tracking-wider text-orange-500 mb-1">{selectedCategory.name}</p>
              <p className="text-3xl font-black text-uni-blue">{selectedCategory.items.length} seçim</p>
              <p className="text-base text-gray-400 mt-1">{t('cafeteria.total') as string}: {formatMenuPrice(totalPrice)}</p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-[19rem_1fr] gap-6 min-h-0 flex-1">
          <motion.nav initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3 overflow-y-auto pr-1">
            {menu.map(category => {
              const active = category.id === selectedCategory?.id;
              return (
                <button key={category.id} onClick={() => setSelectedCategoryId(category.id)}
                  className={`min-h-28 rounded-[1.5rem] px-5 py-4 text-left border transition-all flex items-center gap-4 ${active
                    ? 'bg-uni-blue text-white border-uni-blue shadow-lg'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-orange-200 hover:shadow-md'}`}>
                  <span className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${active ? 'bg-white/15 text-uni-gold' : 'bg-orange-50 text-orange-500'}`}>
                    {categoryIcon(category.name)}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-2xl font-black leading-tight ${active ? 'text-white' : 'text-uni-blue'}`}>{category.name}</span>
                    <span className={`block text-base font-semibold mt-1 ${active ? 'text-blue-100' : 'text-gray-400'}`}>{category.items.length} məhsul</span>
                  </span>
                </button>
              );
            })}
          </motion.nav>

          <motion.div key={selectedCategory?.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="min-h-0 overflow-y-auto">
            {selectedCategory && (
              <div className="grid grid-cols-3 gap-4 pb-2">
                {selectedCategory.items.map((item, index) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.015, 0.18) }}
                    className="min-h-36 bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between">
                    <h4 className="text-2xl font-black text-gray-900 leading-snug break-words">{item.name}</h4>
                    <div className="flex items-center justify-between gap-4 mt-6">
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Qiymət</span>
                      {item.price !== null && (
                        <strong className="text-3xl font-black text-orange-600 whitespace-nowrap">{formatMenuPrice(item.price)}</strong>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// --- Announcements View ---
const AnnouncementsView = ({ announcements }: { announcements: Announcement[] }) => {
  const importanceOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
  const sorted = [...announcements].sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  return (
    <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {sorted.map((ann, i) => {
          const colors = ANNOUNCEMENT_THEME_CLASSES[normalizeAnnouncementTheme(ann.theme)];
          const table = normalizeAnnouncementTable(ann.table_headers, ann.table_rows);

          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={ann.id}
              className={`rounded-[2.5rem] p-8 shadow-sm border-2 ${colors.border} ${colors.bg} relative overflow-hidden group`}>
              <div className="flex items-start gap-8">
                <div className={`w-20 h-20 ${colors.iconBg} rounded-2xl flex items-center justify-center shrink-0`}><Bell size={40} className={colors.iconText} /></div>
                <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${colors.tagBg} ${colors.tagText}`}>{ann.type}</span>
                  <span className="text-xl font-medium text-gray-500">{formatDisplayDate(ann.date)}</span>
                </div>
                <h3 className={`text-4xl font-bold mb-3 ${colors.titleText}`}>{ann.title}</h3>
                <p className="whitespace-pre-wrap text-left text-2xl text-gray-700 leading-relaxed max-w-4xl">{ann.description}</p>
                </div>
                {ann.image_url && (
                  <img src={ann.image_url} alt={ann.title} className="w-64 max-h-44 rounded-3xl object-contain bg-white/70 border border-white/70" referrerPolicy="no-referrer" />
                )}
              </div>
              {table && (
                <div className="mt-8 overflow-hidden rounded-3xl border border-white/70 bg-white/80">
                  <table className="w-full text-left">
                    <thead className={`${colors.tableHead} text-white`}>
                      <tr>
                        {table.headers.map((header, headerIndex) => (
                          <th key={`${header}-${headerIndex}`} className={"px-5 py-4 text-xl font-black " + (headerIndex === table.headers.length - 1 ? "w-44 text-center" : "")}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="bg-white/80">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className={"px-5 py-4 text-xl font-semibold text-gray-800 leading-snug whitespace-pre-line " + (cellIndex === row.length - 1 ? "w-44 text-center" : "")}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// --- Info View ---
const InfoView = ({ info }: { info: InfoContent[] }) => {
  const { t } = useI18n();
  return (
    <div className="flex-1 pt-40 pb-12 px-12 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-16 rounded-[3rem] shadow-xl max-w-4xl w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-uni-blue to-blue-700"></div>
        <div className="w-32 h-32 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10">
          <Info size={64} className="text-uni-blue" />
        </div>
        <h3 className="text-5xl font-bold text-uni-blue mb-10 text-center">{t('info.title') as string}</h3>
        <div className="space-y-8">
          {info.map(sec => (
            <div key={sec.id} className="border-2 border-gray-100 rounded-[2rem] p-8 hover:border-uni-blue/30 transition-colors">
              <h4 className="text-3xl font-bold text-uni-blue mb-4">{sec.title}</h4>
              <p className="text-xl text-gray-600 leading-relaxed whitespace-pre-line">{sec.content.replace(/\|/g, '\n')}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// --- PIN Exit Overlay ---
const PinExitOverlay = ({ onClose }: { onClose: () => void }) => {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    setPin(pin + d);
    setError(false);
  };

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(false); };

  const handleSubmit = async () => {
    if (!pin || !window.kioskAPI) return;
    setVerifying(true);
    const ok = await window.kioskAPI.verifyPin(pin);
    if (ok) {
      await window.kioskAPI.exitApp();
    } else {
      setError(true);
      setPin('');
      setVerifying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] p-12 w-[420px] shadow-2xl" onClick={ev => ev.stopPropagation()}>
        <h3 className="text-3xl font-bold text-uni-blue text-center mb-2">{t('pin.title') as string}</h3>
        <p className="text-gray-500 text-center mb-8 text-lg">{t('pin.enter') as string}</p>
        <div className="flex justify-center gap-3 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold transition-colors ${
              pin.length > i ? 'border-uni-blue bg-uni-blue text-white' : error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}>
              {pin.length > i ? '\u2022' : ''}
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-center mb-4 font-medium">{t('pin.wrong') as string}</p>}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-uni-blue transition-colors active:scale-95">{d}</button>
          ))}
          <button onClick={handleDelete} className="h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-500 transition-colors active:scale-95">{t('pin.delete') as string}</button>
          <button onClick={() => handleDigit('0')} className="h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-uni-blue transition-colors active:scale-95">0</button>
          <button onClick={handleSubmit} disabled={pin.length === 0 || verifying}
            className="h-16 rounded-2xl bg-uni-blue hover:bg-blue-900 text-white text-xl font-bold transition-colors active:scale-95 disabled:opacity-50">OK</button>
        </div>
        <button onClick={onClose} className="w-full py-3 text-gray-400 hover:text-gray-600 font-medium text-lg">{t('pin.cancel') as string}</button>
      </motion.div>
    </motion.div>
  );
};

// --- Maintenance Screen ---
const MaintenanceScreen = () => {
  const [time, setTime] = useState(new Date());
  const { t, lang } = useI18n();
  const locale = LOCALE_MAP[lang];
  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-[100]">
      <div className="text-6xl mb-6">🔧</div>
      <h1 className="text-4xl font-bold text-white mb-3">Texniki Fasilə</h1>
      <p className="text-xl text-gray-400 mb-8">Sistem müvəqqəti dayandırılıb</p>
      <div className="text-5xl font-light text-gray-500">
        {formatTime(time, lang)}
      </div>
    </motion.div>
  );
};

// Secret touch zone: 5 taps in top-right corner within 3 seconds
const SecretExitZone = () => {
  const [taps, setTaps] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleTap = useCallback(() => {
    if (!window.kioskAPI?.isKiosk) return;
    setTaps(prev => {
      const next = prev + 1;
      clearTimeout(timerRef.current);
      if (next >= 5) {
        setShowPin(true);
        return 0;
      }
      timerRef.current = setTimeout(() => setTaps(0), 3000);
      return next;
    });
  }, []);

  return (
    <>
      <div onClick={handleTap} className="fixed top-0 right-0 w-20 h-20 z-[99]" style={{ touchAction: 'manipulation' }} />
      <AnimatePresence>{showPin && <PinExitOverlay onClose={() => setShowPin(false)} />}</AnimatePresence>
    </>
  );
};

// --- Main Kiosk App ---
export default function KioskApp() {
  const [isIdle, setIsIdle] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const { data, loading } = useKioskData();
  const { t, setLang } = useI18n();
  const weather = useBakuWeather();
  const IDLE_TIMEOUT = 30000;
  const sleepScreenEnabled = data?.settings?.sleep_screen_enabled === true;

  useEffect(() => {
    if (data?.settings?.default_language) {
      setLang(data.settings.default_language as Lang);
    }
  }, [data?.settings?.default_language, setLang]);

  const resetIdleTimer = useCallback(() => { setIsIdle(false); }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleActivity = () => {
      resetIdleTimer();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (sleepScreenEnabled) setIsIdle(true);
        setCurrentView('home');
      }, IDLE_TIMEOUT);
    };
    const evts = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'click'] as const;
    evts.forEach(ev => window.addEventListener(ev, handleActivity));
    handleActivity();
    return () => { evts.forEach(ev => window.removeEventListener(ev, handleActivity)); clearTimeout(timeoutId); };
  }, [resetIdleTimer, sleepScreenEnabled]);

  if (loading || !data) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-uni-light">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-16 h-16 border-4 border-uni-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'map': return <MapView />;
      case 'faculties': return <FacultyBrowserView faculties={data.faculties} schedules={data.schedules || []} />;
      case 'events': return <EventsView events={data.events} />;
      case 'cafeteria': return <CafeteriaView menu={data.cafeteria} />;
      case 'announcements': return <AnnouncementsView announcements={data.announcements} />;
      case 'info': return <InfoView info={data.info} />;
      case 'feedback': return <FeedbackQrView />;
      default: return <HomeMenu onNavigate={setCurrentView} announcements={data.announcements} settings={data.settings} />;
    }
  };

  const getViewTitle = () => {
    const titleKeys: Record<string, string> = {
      map: 'title.map', faculties: 'title.faculties', events: 'title.events',
      cafeteria: 'title.cafeteria', info: 'title.info', announcements: 'title.announcements',
      feedback: 'title.feedback'
    };
    const key = titleKeys[currentView];
    return key ? (t(key as any) as string) : (t('nav.home') as string);
  };

  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden">
      <div className="ambient-bg"></div>
      <SecretExitZone />
      {data.settings?.kiosk_paused && <MaintenanceScreen />}
      <AnimatePresence>{isIdle && !data.settings?.kiosk_paused && sleepScreenEnabled && <Screensaver onWake={resetIdleTimer} weather={weather} />}</AnimatePresence>
      {(!isIdle || !sleepScreenEnabled) && (
        <>
          <Header title={getViewTitle()} onHome={() => setCurrentView('home')} onBack={currentView !== 'home' ? () => setCurrentView('home') : undefined} weather={weather} />
          <main className="flex-1 flex flex-col relative">
            <AnimatePresence mode="wait">
              <motion.div key={currentView} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 flex flex-col">
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}

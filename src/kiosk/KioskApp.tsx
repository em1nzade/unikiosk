import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, CalendarDays, GraduationCap, Info, Clock, ChevronLeft, ChevronRight,
  Home, Search, ArrowRight, Bell, Coffee, Globe, Building2, BookOpen, Megaphone, FileText,
  MapPin
} from 'lucide-react';
import { useKioskData } from '../shared/useKioskData';
import { useI18n, type Lang } from '../shared/i18n';
import type { Announcement, Faculty, Event as KioskEvent, CafeteriaCategory, InfoContent, KioskSettings } from '../shared/types';

const LOCALE_MAP: Record<Lang, string> = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU' };
const LANG_LABELS: Record<Lang, string> = { az: 'AZ', en: 'EN', ru: 'RU' };

const AZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const AZ_WEEKDAYS = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];

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
const FacultyBrowserView = ({ faculties }: { faculties: Faculty[] }) => {
  const { t } = useI18n();
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [contentTab, setContentTab] = useState<'schedule' | 'announcement' | 'exam'>('schedule');
  const [courseYear, setCourseYear] = useState<number>(1);

  const faculty = faculties.find(f => f.id === selectedFacultyId);
  const department = faculty?.departments.find(d => d.id === selectedDeptId);

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
            {faculties.map((f, i) => (
              <motion.button key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                whileTap={{ scale: 0.98 }} onClick={() => setSelectedFacultyId(f.id)}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all text-left flex items-center gap-6 group">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-uni-blue shrink-0 group-hover:bg-uni-blue group-hover:text-white transition-colors">
                  <GraduationCap size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{f.name}</h4>
                  <p className="text-lg text-gray-500">{f.departments.length} {t('faculty.deptCount') as string}</p>
                </div>
                <ChevronRight size={32} className="text-gray-300 group-hover:text-uni-blue transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Level 2: Department list
  if (!department) {
    return (
      <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setSelectedFacultyId(null)}
            className="flex items-center gap-3 text-xl font-bold text-uni-blue bg-white px-6 py-3 rounded-full shadow-sm mb-8 hover:bg-gray-50 transition-colors w-fit border border-gray-100">
            <ChevronLeft size={24} /> {t('faculty.back') as string}
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h3 className="text-4xl font-bold text-uni-blue mb-2">{faculty.name}</h3>
            <p className="text-xl text-gray-500">{t('faculty.selectDept') as string}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-5">
            {faculty.departments.map((d, i) => (
              <motion.button key={d.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.99 }} onClick={() => { setSelectedDeptId(d.id); setContentTab('schedule'); setCourseYear(1); }}
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

  // Level 3: Department content
  const tabs: { key: 'schedule' | 'announcement' | 'exam'; label: string; icon: React.ReactNode }[] = [
    { key: 'schedule', label: t('dept.schedules') as string, icon: <Clock size={24} /> },
    { key: 'announcement', label: t('dept.announcements') as string, icon: <Megaphone size={24} /> },
    { key: 'exam', label: t('dept.exams') as string, icon: <FileText size={24} /> },
  ];

  const contentForTab = department.content.filter(c => c.type === contentTab);
  const scheduleContent = contentTab === 'schedule' ? contentForTab.filter(c => c.course_year === courseYear) : contentForTab;

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
            <button key={tb.key} onClick={() => { setContentTab(tb.key); setCourseYear(1); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-full text-xl font-bold transition-all ${contentTab === tb.key ? 'bg-uni-blue text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* Course year selector for schedules */}
        {contentTab === 'schedule' && (
          <div className="flex gap-3 mb-8">
            {[1, 2, 3, 4].map(y => (
              <button key={y} onClick={() => setCourseYear(y)}
                className={`w-16 h-16 rounded-2xl text-2xl font-bold transition-all ${courseYear === y ? 'bg-uni-gold text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {y}
              </button>
            ))}
            <span className="flex items-center text-xl text-gray-400 ml-2">{t('dept.courseYear') as string}</span>
          </div>
        )}

        {/* Content display */}
        {scheduleContent.length > 0 ? (
          <div className="space-y-6">
            {scheduleContent.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-full max-h-[600px] object-contain bg-gray-50" referrerPolicy="no-referrer" />
                )}
                <div className="p-8">
                  <h4 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h4>
                  {item.description && <p className="text-xl text-gray-600 leading-relaxed">{item.description}</p>}
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
    <div className="flex-1 pt-32 pb-10 px-12 overflow-hidden flex flex-col items-center justify-center gap-6 max-h-screen">
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
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/campus3d/800/800')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
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
          className="col-span-2 row-span-1 rounded-[2.5rem] relative overflow-hidden group shadow-xl text-left flex items-center p-8 gap-6">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/unievents/800/400')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-emerald-900/70 to-emerald-900/30"></div>
          <div className="glass-panel-dark w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 z-10 transition-transform group-hover:scale-110"><CalendarDays size={32} /></div>
          <div className="relative z-10">
            <h3 className="text-4xl font-bold text-white mb-2 text-shadow-md">{t('nav.events') as string}</h3>
            <p className="text-xl text-emerald-100">{t('nav.events.desc') as string}</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('cafeteria')}
          className="col-span-1 row-span-1 rounded-[2.5rem] bg-gradient-to-br from-orange-400 to-red-500 p-8 relative overflow-hidden group shadow-xl text-left flex flex-col justify-end">
          <div className="absolute right-0 top-0 bottom-0 w-full bg-[url('https://picsum.photos/seed/cafeteria/400/400')] bg-cover bg-center opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center text-white backdrop-blur-md mb-4 transition-colors group-hover:bg-white group-hover:text-amber-600"><Coffee size={28} /></div>
            <h3 className="text-3xl font-bold text-white mb-1 text-shadow-md">{t('nav.cafeteria') as string}</h3>
            <p className="text-lg text-orange-100">{t('nav.cafeteria.desc') as string}</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

// --- Map View ---
const MapView = () => {
  const { t } = useI18n();
  const places = t('map.places') as string[];
  return (
    <div className="absolute inset-0 bg-gray-100">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/campusmapbig/1920/1080')] bg-cover bg-center"></div>
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
  const selectedEvent = events.find(ev => ev.id === selectedEventId);

  if (selectedEvent) {
    return (
      <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setSelectedEventId(null)} className="flex items-center gap-3 text-xl font-bold text-uni-blue bg-white px-6 py-3 rounded-full shadow-sm mb-6 hover:bg-gray-50 transition-colors w-fit border border-gray-100">
            <ChevronLeft size={24} /> {t('events.back') as string}
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-xl overflow-hidden flex flex-col">
            <div className="w-full h-96 relative">
              <img src={selectedEvent.image_url || 'https://picsum.photos/seed/event/800/600'} alt={selectedEvent.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-12 pr-12">
                <span className="bg-uni-gold text-white px-5 py-2 rounded-full font-bold tracking-wider uppercase text-sm mb-4 inline-block shadow-md">{selectedEvent.type}</span>
                <h2 className="text-5xl font-bold text-white text-shadow-lg">{selectedEvent.title}</h2>
              </div>
            </div>
            <div className="p-12 flex flex-col lg:flex-row gap-12">
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-uni-blue mb-6 border-b border-gray-100 pb-4">{t('events.about') as string}</h3>
                <p className="text-2xl text-gray-600 leading-relaxed font-light">{selectedEvent.description}</p>
                <div className="mt-12 flex justify-start">
                  <button className="bg-uni-blue text-white px-10 py-5 rounded-[2rem] text-2xl font-bold shadow-xl hover:bg-blue-900 transition-colors cursor-pointer w-full text-center">{t('events.register') as string}</button>
                </div>
              </div>
              <div className="w-full lg:w-1/3 bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 h-fit">
                <h4 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">{t('events.details') as string}</h4>
                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-uni-gold shadow-sm shrink-0"><CalendarDays size={32} /></div>
                    <div><p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">{t('events.date') as string}</p><p className="text-xl font-bold text-gray-800">{selectedEvent.date}</p></div>
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
                <div className="flex items-center gap-4"><CalendarDays size={28} className="text-uni-gold" /><span>{event.date} &bull; {event.time_slot}</span></div>
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
  const totalPrice = menu.find(c => c.highlight)?.items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="flex-1 pt-40 pb-12 px-12 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-16 rounded-[3rem] shadow-xl max-w-4xl w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-400 to-red-500"></div>
        <div className="w-32 h-32 bg-orange-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 rotate-3"><Coffee size={64} className="text-orange-500 -rotate-3" /></div>
        <h3 className="text-5xl font-bold text-uni-blue mb-6">{t('cafeteria.title') as string}</h3>
        <p className="text-2xl text-gray-500 mb-12 leading-relaxed max-w-2xl mx-auto">{t('cafeteria.desc') as string}</p>
        <div className="grid grid-cols-2 gap-8 mb-4">
          {menu.map(cat => (
            <div key={cat.id} className={`p-10 border-2 border-gray-100 rounded-[2rem] text-left hover:border-orange-400 hover:shadow-lg transition-all group ${cat.highlight ? 'bg-orange-50/30' : ''}`}>
              <h4 className={`text-3xl font-bold text-uni-blue mb-6 group-hover:text-orange-500 border-b ${cat.highlight ? 'border-orange-100' : 'border-gray-100'} pb-4`}>{cat.name}</h4>
              <ul className="text-xl text-gray-600 space-y-4 font-medium">
                {cat.items.map(item => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span>{item.name}</span>
                    {item.price !== null && <strong className="text-gray-900">{Number(item.price).toFixed(2)} &#8380;</strong>}
                  </li>
                ))}
              </ul>
              {cat.highlight && totalPrice != null && (
                <div className="mt-8 bg-orange-100 text-orange-800 py-3 px-6 rounded-xl font-bold text-2xl flex justify-between items-center shadow-sm">
                  <span>{t('cafeteria.total') as string}:</span><span>{totalPrice.toFixed(2)} &#8380;</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
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
          let colors = { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-200', iconText: 'text-slate-600', titleText: 'text-slate-900', tagBg: 'bg-slate-600', tagText: 'text-white' };
          if (ann.importance === 'high') colors = { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-200', iconText: 'text-red-600', titleText: 'text-red-900', tagBg: 'bg-red-600', tagText: 'text-white' };
          else if (ann.importance === 'medium') colors = { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-200', iconText: 'text-amber-600', titleText: 'text-amber-900', tagBg: 'bg-amber-500', tagText: 'text-white' };

          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={ann.id}
              className={`rounded-[2.5rem] p-8 shadow-sm border-2 ${colors.border} ${colors.bg} flex items-center gap-8 relative overflow-hidden group`}>
              <div className={`w-20 h-20 ${colors.iconBg} rounded-2xl flex items-center justify-center shrink-0`}><Bell size={40} className={colors.iconText} /></div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${colors.tagBg} ${colors.tagText}`}>{ann.type}</span>
                  <span className="text-xl font-medium text-gray-500">{ann.date}</span>
                </div>
                <h3 className={`text-4xl font-bold mb-3 ${colors.titleText}`}>{ann.title}</h3>
                <p className="text-2xl text-gray-700 leading-relaxed max-w-4xl">{ann.description}</p>
              </div>
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
declare global {
  interface Window {
    kioskAPI?: {
      isKiosk: boolean;
      verifyPin: (pin: string) => Promise<boolean>;
      exitApp: () => Promise<void>;
      getDeviceId: () => Promise<string>;
    };
  }
}

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
      timeoutId = setTimeout(() => { setIsIdle(true); setCurrentView('home'); }, IDLE_TIMEOUT);
    };
    const evts = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'click'] as const;
    evts.forEach(ev => window.addEventListener(ev, handleActivity));
    handleActivity();
    return () => { evts.forEach(ev => window.removeEventListener(ev, handleActivity)); clearTimeout(timeoutId); };
  }, [resetIdleTimer]);

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
      case 'faculties': return <FacultyBrowserView faculties={data.faculties} />;
      case 'events': return <EventsView events={data.events} />;
      case 'cafeteria': return <CafeteriaView menu={data.cafeteria} />;
      case 'announcements': return <AnnouncementsView announcements={data.announcements} />;
      case 'info': return <InfoView info={data.info} />;
      default: return <HomeMenu onNavigate={setCurrentView} announcements={data.announcements} settings={data.settings} />;
    }
  };

  const getViewTitle = () => {
    const titleKeys: Record<string, string> = {
      map: 'title.map', faculties: 'title.faculties', events: 'title.events',
      cafeteria: 'title.cafeteria', info: 'title.info', announcements: 'title.announcements'
    };
    const key = titleKeys[currentView];
    return key ? (t(key as any) as string) : (t('nav.home') as string);
  };

  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden">
      <div className="ambient-bg"></div>
      <SecretExitZone />
      {data.settings?.kiosk_paused && <MaintenanceScreen />}
      <AnimatePresence>{isIdle && !data.settings?.kiosk_paused && <Screensaver onWake={resetIdleTimer} weather={weather} />}</AnimatePresence>
      {!isIdle && (
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

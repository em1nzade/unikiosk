import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, CalendarDays, GraduationCap, Info, Clock, ChevronLeft,
  Home, Search, ArrowRight, Bell, Coffee
} from 'lucide-react';
import { useKioskData } from '../shared/useKioskData';
import type { Announcement, Exam, Event as KioskEvent, CafeteriaCategory, InfoContent } from '../shared/types';

// --- Screensaver ---
const Screensaver = ({ onWake }: { onWake: () => void }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} onClick={onWake}
      className="absolute inset-0 bg-uni-blue flex flex-col items-center justify-center cursor-pointer z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/universitycampus/1920/1080')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-uni-blue via-uni-blue/80 to-transparent"></div>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="flex flex-col items-center relative z-10">
        <GraduationCap size={100} className="text-uni-gold mb-8 drop-shadow-2xl" />
        <h1 className="text-7xl font-serif font-semibold mb-4 tracking-tight text-white text-shadow-md">Odlar Yurdu Universiteti</h1>
        <p className="text-3xl text-blue-200 mb-16 font-light tracking-wide uppercase">İnformasiya Kiosku</p>
        <div className="text-[10rem] font-light tracking-tighter mb-20 text-white text-shadow-md leading-none">
          {time.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <motion.div animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1.02, 0.98] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="glass-panel-dark px-10 py-5 rounded-full flex items-center gap-4">
          <span className="text-3xl font-medium text-white tracking-wide">Başlamaq üçün ekrana toxunun</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// --- Header ---
const Header = ({ title, onHome, onBack }: { title: string; onHome: () => void; onBack?: () => void }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

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
        {title !== 'Ana Səhifə' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel px-8 py-5 rounded-full ml-4">
            <h2 className="text-3xl font-bold text-uni-blue">{title}</h2>
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-6 pointer-events-auto">
        <div className="glass-panel px-8 py-4 rounded-3xl text-right">
          <div className="text-3xl font-bold text-uni-blue">{time.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-gray-600 font-medium text-lg">{time.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center text-uni-blue font-bold text-2xl">AZ</div>
      </div>
    </header>
  );
};

// --- Home Menu ---
const HomeMenu = ({ onNavigate, announcements }: { onNavigate: (v: string) => void; announcements: Announcement[] }) => {
  const [annIndex, setAnnIndex] = useState(0);
  useEffect(() => { if (!announcements.length) return; const t = setInterval(() => setAnnIndex(p => (p + 1) % announcements.length), 5000); return () => clearInterval(t); }, [announcements.length]);

  const currentAnn = announcements[annIndex] || { title: '', description: '', type: '', importance: 'low' as const };

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
      {/* Top Banner */}
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

      {/* Bento Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-3 grid-rows-3 gap-6 w-full max-w-7xl flex-1 min-h-0">
        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('exams')}
          className="col-span-2 row-span-2 rounded-[2.5rem] bg-uni-blue p-10 relative overflow-hidden group shadow-xl text-left flex flex-col">
          <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-500 text-uni-gold"><Clock size={300} /></div>
          <div className="absolute bottom-0 right-0 p-10 opacity-20"><GraduationCap size={200} className="text-white" /></div>
          <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-auto text-uni-gold backdrop-blur-md"><Clock size={40} /></div>
          <div className="relative z-10 mt-8">
            <h3 className="text-5xl font-bold text-white mb-3 text-shadow-md">İmtahan Cədvəlləri</h3>
            <p className="text-2xl text-blue-200 max-w-md">Fakültələr və qruplar üzrə ən son imtahan və dərs cədvəlləri</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('map')}
          className="col-span-1 row-span-1 rounded-[2.5rem] relative overflow-hidden group shadow-xl text-left flex flex-col justify-end p-8">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/campus3d/800/800')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
          <div className="relative z-10">
            <div className="glass-panel-dark w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white"><Map size={28} /></div>
            <h3 className="text-3xl font-bold text-white mb-1 text-shadow-md">Xəritə</h3>
            <p className="text-lg text-gray-300">Auditoriyalar</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('info')}
          className="col-span-1 row-span-1 rounded-[2.5rem] bg-white p-8 relative overflow-hidden group shadow-xl text-left flex flex-col justify-center border border-gray-100">
          <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-uni-blue mb-4 transition-colors group-hover:bg-uni-blue group-hover:text-white"><Info size={28} /></div>
          <div><h3 className="text-3xl font-bold text-uni-blue mb-1">Məlumat</h3><p className="text-lg text-gray-500">Əlaqə & Haqqında</p></div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('events')}
          className="col-span-2 row-span-1 rounded-[2.5rem] relative overflow-hidden group shadow-xl text-left flex items-center p-8 gap-6">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/unievents/800/400')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-emerald-900/70 to-emerald-900/30"></div>
          <div className="glass-panel-dark w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 z-10 transition-transform group-hover:scale-110"><CalendarDays size={32} /></div>
          <div className="relative z-10">
            <h3 className="text-4xl font-bold text-white mb-2 text-shadow-md">Tədbirlər və Konfranslar</h3>
            <p className="text-xl text-emerald-100">Bütün tədbirlər üçün qeydiyyat</p>
          </div>
        </motion.button>

        <motion.button variants={itemVariants} whileTap={{ scale: 0.98 }} onClick={() => onNavigate('cafeteria')}
          className="col-span-1 row-span-1 rounded-[2.5rem] bg-gradient-to-br from-orange-400 to-red-500 p-8 relative overflow-hidden group shadow-xl text-left flex flex-col justify-end">
          <div className="absolute right-0 top-0 bottom-0 w-full bg-[url('https://picsum.photos/seed/cafeteria/400/400')] bg-cover bg-center opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center text-white backdrop-blur-md mb-4 transition-colors group-hover:bg-white group-hover:text-amber-600"><Coffee size={28} /></div>
            <h3 className="text-3xl font-bold text-white mb-1 text-shadow-md">Yeməkxana</h3>
            <p className="text-lg text-orange-100">Gündəlik menyu</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

// --- Map View ---
const MapView = () => (
  <div className="absolute inset-0 bg-gray-100">
    <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/campusmapbig/1920/1080')] bg-cover bg-center"></div>
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 w-full max-w-4xl px-8">
      <div className="glass-panel w-full rounded-full p-4 flex items-center gap-4 shadow-2xl">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-uni-blue shadow-sm"><Search size={28} /></div>
        <input type="text" placeholder="Auditoriya, bina və ya obyekt axtar..." className="flex-1 bg-transparent text-2xl text-uni-blue placeholder-gray-500 outline-none px-4 font-medium" />
        <button className="px-10 py-4 bg-uni-blue text-white rounded-full text-xl font-bold shadow-md">Axtar</button>
      </div>
      <div className="flex gap-4">
        {['Əsas Bina', 'Kitabxana', 'Yataqxana', 'İdman Zalı', 'Kafeteriya'].map(place => (
          <button key={place} className="glass-panel px-8 py-4 rounded-full text-xl font-bold text-uni-blue hover:bg-white transition-colors shadow-lg">{place}</button>
        ))}
      </div>
    </div>
  </div>
);

// --- Exams View ---
const ExamsView = ({ exams }: { exams: Exam[] }) => {
  const [groupNumber, setGroupNumber] = useState('');
  const [searchedGroup, setSearchedGroup] = useState<string | null>(null);

  const handleSearch = () => { if (groupNumber.trim().length > 0) setSearchedGroup(groupNumber.trim().toUpperCase()); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSearch(); };
  const filteredExams = searchedGroup ? exams.filter(e => e.group_number.includes(searchedGroup) || searchedGroup.includes(e.group_number)) : [];

  if (!searchedGroup) {
    return (
      <div className="flex-1 pt-40 pb-12 px-12 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-16 rounded-[3rem] shadow-xl max-w-3xl w-full text-center relative overflow-hidden">
          <div className="w-32 h-32 bg-uni-gold/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10"><Clock size={64} className="text-uni-gold" /></div>
          <h3 className="text-5xl font-bold text-uni-blue mb-6">İmtahan Cədvəli</h3>
          <p className="text-2xl text-gray-500 mb-12 leading-relaxed">İmtahanlarınızı görmək üçün qrup nömrənizi daxil edin.</p>
          <div className="glass-panel border-gray-200 border-2 rounded-[2rem] p-4 flex gap-4 mb-6 shadow-sm focus-within:border-uni-blue transition-colors">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500"><Search size={32} /></div>
            <input type="text" value={groupNumber} onChange={e => setGroupNumber(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Məsələn: 652" className="flex-1 bg-transparent text-4xl text-uni-blue placeholder-gray-400 outline-none px-4 font-bold text-center" />
          </div>
          <button onClick={handleSearch} className="w-full py-6 bg-uni-blue text-white rounded-[2rem] text-3xl font-bold shadow-xl hover:bg-blue-900 transition-colors">Axtar</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="glass-panel rounded-[2rem] p-6 flex justify-between items-center mb-10 shadow-lg px-10 border border-gray-100">
          <div className="text-3xl font-bold text-uni-blue">Qrup: <span className="text-uni-gold">{searchedGroup}</span></div>
          <button onClick={() => setSearchedGroup(null)} className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-uni-blue rounded-full text-xl font-bold transition-colors">Başqa qrup axtar</button>
        </div>
        {filteredExams.length > 0 ? (
          <div className="space-y-6">
            {filteredExams.map((exam, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={exam.id}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex items-center gap-8 hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[140px]">
                  <span className="text-5xl font-bold text-uni-blue leading-none mb-1">{exam.exam_date}</span>
                  <span className="text-xl font-medium text-blue-600 uppercase tracking-wider">{exam.exam_month}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{exam.subject}</h3>
                  <p className="text-xl text-gray-500 mb-4">{exam.faculty} • Qrup {exam.group_number}</p>
                  <div className="flex items-center gap-6 text-lg font-medium text-gray-600">
                    <span className="flex items-center gap-2"><Clock size={24} className="text-uni-gold" /> {exam.time_slot}</span>
                    <span className="flex items-center gap-2"><Map size={24} className="text-uni-blue" /> {exam.room}</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><ArrowRight size={32} /></div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center mt-10">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8"><Search size={48} className="text-gray-300" /></div>
            <h3 className="text-4xl font-bold text-uni-blue mb-4">Heç nə tapılmadı</h3>
            <p className="text-2xl text-gray-500 max-w-lg">"{searchedGroup}" qrupu üçün imtahan cədvəli tapılmadı.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Events View ---
const EventsView = ({ events }: { events: KioskEvent[] }) => {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (selectedEvent) {
    return (
      <div className="flex-1 pt-40 pb-12 px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setSelectedEventId(null)} className="flex items-center gap-3 text-xl font-bold text-uni-blue bg-white px-6 py-3 rounded-full shadow-sm mb-6 hover:bg-gray-50 transition-colors w-fit border border-gray-100">
            <ChevronLeft size={24} /> Bütün tədbirlərə qayıt
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
                <h3 className="text-3xl font-bold text-uni-blue mb-6 border-b border-gray-100 pb-4">Tədbir haqqında</h3>
                <p className="text-2xl text-gray-600 leading-relaxed font-light">{selectedEvent.description}</p>
                <div className="mt-12 flex justify-start">
                  <button className="bg-uni-blue text-white px-10 py-5 rounded-[2rem] text-2xl font-bold shadow-xl hover:bg-blue-900 transition-colors cursor-pointer w-full text-center">İştirak üçün qeydiyyatdan keç</button>
                </div>
              </div>
              <div className="w-full lg:w-1/3 bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 h-fit">
                <h4 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">Təfərrüatlar</h4>
                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-uni-gold shadow-sm shrink-0"><CalendarDays size={32} /></div>
                    <div><p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Tarix</p><p className="text-xl font-bold text-gray-800">{selectedEvent.date}</p></div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-uni-gold shadow-sm shrink-0"><Clock size={32} /></div>
                    <div><p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Saat</p><p className="text-xl font-bold text-gray-800">{selectedEvent.time_slot}</p></div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-uni-blue shadow-sm shrink-0"><Map size={32} /></div>
                    <div><p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Məkan</p><p className="text-xl font-bold text-gray-800">{selectedEvent.location}</p></div>
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
                <div className="flex items-center gap-4"><CalendarDays size={28} className="text-uni-gold" /><span>{event.date} • {event.time_slot}</span></div>
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
  const totalPrice = menu.find(c => c.highlight)?.items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="flex-1 pt-40 pb-12 px-12 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-16 rounded-[3rem] shadow-xl max-w-4xl w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-400 to-red-500"></div>
        <div className="w-32 h-32 bg-orange-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 rotate-3"><Coffee size={64} className="text-orange-500 -rotate-3" /></div>
        <h3 className="text-5xl font-bold text-uni-blue mb-6">Tələbə Yeməkxanası</h3>
        <p className="text-2xl text-gray-500 mb-12 leading-relaxed max-w-2xl mx-auto">Tələbə və müəllimlər üçün nəzərdə tutulmuş gündəlik, sağlam və münasib qiymətli yemək menyusu.</p>
        <div className="grid grid-cols-2 gap-8 mb-4">
          {menu.map(cat => (
            <div key={cat.id} className={`p-10 border-2 border-gray-100 rounded-[2rem] text-left hover:border-orange-400 hover:shadow-lg transition-all group ${cat.highlight ? 'bg-orange-50/30' : ''}`}>
              <h4 className={`text-3xl font-bold text-uni-blue mb-6 group-hover:text-orange-500 border-b ${cat.highlight ? 'border-orange-100' : 'border-gray-100'} pb-4`}>{cat.name}</h4>
              <ul className="text-xl text-gray-600 space-y-4 font-medium">
                {cat.items.map(item => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span>{item.name}</span>
                    {item.price !== null && <strong className="text-gray-900">{Number(item.price).toFixed(2)} ₼</strong>}
                  </li>
                ))}
              </ul>
              {cat.highlight && totalPrice != null && (
                <div className="mt-8 bg-orange-100 text-orange-800 py-3 px-6 rounded-xl font-bold text-2xl flex justify-between items-center shadow-sm">
                  <span>CƏMİ:</span><span>{totalPrice.toFixed(2)} ₼</span>
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
const InfoView = ({ info }: { info: InfoContent[] }) => (
  <div className="flex-1 pt-40 pb-12 px-12 flex flex-col items-center justify-center">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-16 rounded-[3rem] shadow-xl max-w-4xl w-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-uni-blue to-blue-700"></div>
      <div className="w-32 h-32 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10">
        <Info size={64} className="text-uni-blue" />
      </div>
      <h3 className="text-5xl font-bold text-uni-blue mb-10 text-center">Ümumi Məlumat</h3>
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

// --- PIN Exit Overlay ---
declare global {
  interface Window {
    kioskAPI?: {
      isKiosk: boolean;
      verifyPin: (pin: string) => Promise<boolean>;
      exitApp: () => Promise<void>;
    };
  }
}

const PinExitOverlay = ({ onClose }: { onClose: () => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + d;
    setPin(newPin);
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
        className="bg-white rounded-[3rem] p-12 w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-3xl font-bold text-uni-blue text-center mb-2">Admin Çıxış</h3>
        <p className="text-gray-500 text-center mb-8 text-lg">PIN kodu daxil edin</p>
        <div className="flex justify-center gap-3 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold transition-colors ${
              pin.length > i ? 'border-uni-blue bg-uni-blue text-white' : error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}>
              {pin.length > i ? '•' : ''}
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-center mb-4 font-medium">Yanlış PIN kod</p>}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-uni-blue transition-colors active:scale-95">{d}</button>
          ))}
          <button onClick={handleDelete} className="h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-500 transition-colors active:scale-95">Sil</button>
          <button onClick={() => handleDigit('0')} className="h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-uni-blue transition-colors active:scale-95">0</button>
          <button onClick={handleSubmit} disabled={pin.length === 0 || verifying}
            className="h-16 rounded-2xl bg-uni-blue hover:bg-blue-900 text-white text-xl font-bold transition-colors active:scale-95 disabled:opacity-50">OK</button>
        </div>
        <button onClick={onClose} className="w-full py-3 text-gray-400 hover:text-gray-600 font-medium text-lg">Ləğv et</button>
      </motion.div>
    </motion.div>
  );
};

// Secret touch zone: 5 taps in top-right corner within 3 seconds
const SecretExitZone = () => {
  const [taps, setTaps] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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
  const IDLE_TIMEOUT = 30000;

  const resetIdleTimer = useCallback(() => { setIsIdle(false); }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleActivity = () => {
      resetIdleTimer();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { setIsIdle(true); setCurrentView('home'); }, IDLE_TIMEOUT);
    };
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'click'] as const;
    events.forEach(e => window.addEventListener(e, handleActivity));
    handleActivity();
    return () => { events.forEach(e => window.removeEventListener(e, handleActivity)); clearTimeout(timeoutId); };
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
      case 'exams': return <ExamsView exams={data.exams} />;
      case 'events': return <EventsView events={data.events} />;
      case 'cafeteria': return <CafeteriaView menu={data.cafeteria} />;
      case 'announcements': return <AnnouncementsView announcements={data.announcements} />;
      case 'info': return <InfoView info={data.info} />;
      default: return <HomeMenu onNavigate={setCurrentView} announcements={data.announcements} />;
    }
  };

  const getViewTitle = () => {
    const titles: Record<string, string> = { map: 'Xəritə və Yönləndirmə', exams: 'İmtahan Cədvəli', events: 'Tədbirlər', cafeteria: 'Tələbə Yeməkxanası', info: 'Ümumi Məlumat', announcements: 'Universitet üzrə Elanlar' };
    return titles[currentView] || 'Ana Səhifə';
  };

  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden">
      <div className="ambient-bg"></div>
      <SecretExitZone />
      <AnimatePresence>{isIdle && <Screensaver onWake={resetIdleTimer} />}</AnimatePresence>
      {!isIdle && (
        <>
          <Header title={getViewTitle()} onHome={() => setCurrentView('home')} onBack={currentView !== 'home' ? () => setCurrentView('home') : undefined} />
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

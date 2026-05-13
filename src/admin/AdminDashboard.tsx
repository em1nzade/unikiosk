import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { adminFetch, apiFetch } from '../shared/api';
import { normalizeAnnouncementTable, splitActiveItems, normalizeAnnouncementTheme, type AnnouncementTheme } from '../shared/announcementContent';
import { formatDisplayDate, toDateInputValue } from '../shared/dateFormat';
import type { Announcement, Faculty, Department, DeptContent, Event as KioskEvent, EventRegistration, CafeteriaCategory, InfoContent, KioskSettings, Schedule, ScheduleCell, FeedbackMessage } from '../shared/types';
import {
  LogOut, Bell, Clock, CalendarDays, Coffee, Info, Plus, Trash2, Edit3, Save, X, ChevronRight, ChevronLeft,
  GraduationCap, LayoutDashboard, Loader2, Users, Shield, ShieldCheck, Settings, Check, ChevronDown, Monitor, Table2,
  MessageSquare, RefreshCw, Archive, RotateCcw, ImagePlus, QrCode, ClipboardList
} from 'lucide-react';

const ANNOUNCEMENT_THEME_OPTIONS: { value: AnnouncementTheme; label: string; chip: string }[] = [
  { value: 'blue', label: 'Göy', chip: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'emerald', label: 'Yaşıl', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'amber', label: 'Sarı', chip: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'red', label: 'Qırmızı', chip: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'neutral', label: 'Neytral', chip: 'bg-gray-100 text-gray-700 border-gray-200' },
];

type Tab = 'dashboard' | 'announcements' | 'faculties' | 'schedules' | 'events' | 'cafeteria' | 'info' | 'feedback' | 'users' | 'settings' | 'devices';

const ALL_PERMISSIONS: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Panel' },
  { key: 'announcements', label: 'Elanlar' },
  { key: 'faculties', label: 'Fakültələr' },
  { key: 'schedules', label: 'Dərs Cədvəlləri' },
  { key: 'events', label: 'Tədbirlər' },
  { key: 'cafeteria', label: 'Yeməkxana' },
  { key: 'info', label: 'Məlumat' },
  { key: 'feedback', label: 'Təklif və iradlar' },
  { key: 'settings', label: 'Tənzimləmələr' },
  { key: 'users', label: 'İstifadəçilər' },
  { key: 'devices', label: 'Kiosklar' },
];

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  active: boolean;
  permissions: string[] | null;
  created_at: string;
}

// ─── CreatableSelect ────────────────────────────────────
function CreatableSelect({ label, value, onChange, options, onCreateOption, loading: extLoading }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { id: number; name: string }[];
  onCreateOption: (name: string) => Promise<void>;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await onCreateOption(newName.trim());
      onChange(newName.trim());
      setNewName('');
      setCreating(false);
    } finally { setBusy(false); }
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue flex items-center justify-between bg-white text-left">
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || 'Seçin...'}</span>
        <ChevronDown size={16} className={"text-gray-400 transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {options.map(o => (
            <button key={o.id} type="button" onClick={() => { onChange(o.name); setOpen(false); }}
              className={"w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 " + (o.name === value ? "bg-blue-50 text-uni-blue font-medium" : "text-gray-700")}>
              {o.name === value && <Check size={14} />}
              <span>{o.name}</span>
            </button>
          ))}
          <div className="border-t border-gray-100">
            {creating ? (
              <div className="p-3 flex gap-2">
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-uni-blue" placeholder="Yeni tip adı..." />
                <button type="button" onClick={handleCreate} disabled={busy || !newName.trim()}
                  className="px-3 py-1.5 bg-uni-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button type="button" onClick={() => { setCreating(false); setNewName(''); }}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => setCreating(true)}
                className="w-full text-left px-4 py-2.5 text-uni-blue font-medium hover:bg-blue-50 flex items-center gap-2">
                <Plus size={14} /> Yeni tip yarat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generic Components ─────────────────────────────────
function FormModal({ title, children, onClose, onSave, saving }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">Ləğv et</button>
          <button onClick={onSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-uni-blue text-white font-medium hover:bg-blue-900 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Yadda saxla
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageUploadField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [error, setError] = useState('');
  const onFileChange = (file?: File) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Yalnız şəkil faylı seçin.');
      return;
    }
    if (file.size > 2_500_000) {
      setError('Şəkil 2.5 MB-dan böyükdür. Bir az kiçildib yükləyin.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.onerror = () => setError('Şəkil oxunmadı.');
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
          <ImagePlus size={16} /> Şəkil seç
          <input type="file" accept="image/*" className="hidden" onChange={event => onFileChange(event.target.files?.[0])} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="px-3 py-2 rounded-xl bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100">
            Şəkli sil
          </button>
        )}
      </div>
      {value && <img src={value} alt="" className="mt-3 h-32 max-w-full rounded-xl border border-gray-100 object-contain bg-gray-50" />}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function AnnouncementTableEditor({ headers, rows, onChange }: { headers: string[]; rows: string[][]; onChange: (headers: string[], rows: string[][]) => void }) {
  const hasTable = headers.length > 0 || rows.length > 0;
  const currentHeaders = headers.length > 0 ? headers : ['N0', 'Mövzu', 'Aparıcı', 'Tarix və saat'];
  const currentRows = rows.length > 0 ? rows : [['', '', '', '']];

  const setHeader = (index: number, value: string) => {
    const next = currentHeaders.map((header, i) => i === index ? value : header);
    onChange(next, currentRows.map(row => next.map((_, i) => row[i] ?? '')));
  };

  const setCell = (rowIndex: number, cellIndex: number, value: string) => {
    const nextRows = currentRows.map((row, i) => i === rowIndex ? currentHeaders.map((_, j) => j === cellIndex ? value : (row[j] ?? '')) : currentHeaders.map((_, j) => row[j] ?? ''));
    onChange(currentHeaders, nextRows);
  };

  const addRow = () => onChange(currentHeaders, [...currentRows, currentHeaders.map(() => '')]);
  const removeRow = (index: number) => onChange(currentHeaders, currentRows.filter((_, i) => i !== index));
  const clearTable = () => onChange([], []);

  if (!hasTable) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-4">
        <button type="button" onClick={() => onChange(currentHeaders, currentRows)}
          className="flex items-center gap-2 text-sm font-bold text-uni-blue hover:text-blue-900">
          <Table2 size={16} /> Cədvəl əlavə et
        </button>
        <p className="text-xs text-gray-400 mt-1">Cədvəl boş qalarsa elanda yalnız mətn görünəcək.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Cədvəl</label>
        <button type="button" onClick={clearTable} className="text-xs font-bold text-red-600 hover:text-red-700">Cədvəli sil</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {currentHeaders.map((header, index) => (
                <th key={index} className="p-2 min-w-36">
                  <input value={header} onChange={event => setHeader(index, event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-semibold outline-none focus:border-uni-blue" />
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-100">
                {currentHeaders.map((_, cellIndex) => (
                  <td key={cellIndex} className="p-2 min-w-36">
                    <input value={row[cellIndex] ?? ''} onChange={event => setCell(rowIndex, cellIndex, event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-uni-blue" />
                  </td>
                ))}
                <td className="p-2">
                  <button type="button" onClick={() => removeRow(rowIndex)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-uni-blue hover:text-blue-900">
        <Plus size={14} /> Sətir əlavə et
      </button>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', ...props }: { label: string; value: string; onChange: (v: string) => void; type?: string; [k: string]: any }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue transition-colors" {...props} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full whitespace-pre-wrap text-left px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue transition-colors resize-none" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function AdminDashboard() {
  const { token, user: currentUser, logout, loginTime } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [events, setEvents] = useState<KioskEvent[]>([]);
  const [cafeteria, setCafeteria] = useState<CafeteriaCategory[]>([]);
  const [info, setInfo] = useState<InfoContent[]>([]);
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<KioskSettings>({ ticker_enabled: true, ticker_mode: 'scroll', ticker_pinned_id: null, default_language: 'az', sleep_screen_enabled: false });
  const [loading, setLoading] = useState(true);
  const [kioskSyncing, setKioskSyncing] = useState(false);
  const [kioskSyncSent, setKioskSyncSent] = useState(false);
  const [killClicks, setKillClicks] = useState(0);
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const killTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const userPerms: string[] = currentUser?.permissions ?? [];
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const hasPermission = (p: string) => isSuperAdmin || userPerms.includes(p);
  const allowedFacultyIds: number[] = isSuperAdmin ? [] :
    (currentUser?.faculty_ids?.length ? currentUser.faculty_ids :
      userPerms.filter(p => /^faculty_\d+$/.test(p)).map(p => parseInt(p.replace('faculty_', ''), 10)));

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [a, ex, ev, c, i, s] = await Promise.all([
      (isSuperAdmin || hasPermission('announcements')) ? adminFetch<Announcement[]>('/announcements?include=all', token!) : apiFetch<Announcement[]>('/announcements'),
      apiFetch<Faculty[]>('/exams'),
      (isSuperAdmin || hasPermission('events')) ? adminFetch<KioskEvent[]>('/events?include=all', token!) : apiFetch<KioskEvent[]>('/events'),
      apiFetch<CafeteriaCategory[]>('/cafeteria'),
      apiFetch<InfoContent[]>('/info'),
      apiFetch<Record<string, any>>('/settings'),
    ]);
    setAnnouncements(a); setFaculties(ex); setEvents(ev); setCafeteria(c); setInfo(i);
    setSettings({
      ticker_enabled: s.ticker_enabled ?? true,
      ticker_mode: s.ticker_mode ?? 'scroll',
      ticker_pinned_id: s.ticker_pinned_id ?? null,
      default_language: s.default_language ?? 'az',
      kiosk_paused: s.kiosk_paused ?? false,
      sleep_screen_enabled: s.sleep_screen_enabled ?? false,
      sync_requested_at: s.sync_requested_at ?? null,
    });
    // Force-logout check: if force_logout_at is newer than login time, kick out
    if (s.force_logout_at && loginTime && new Date(s.force_logout_at).getTime() > loginTime && !isSuperAdmin) {
      logout();
      return;
    }
    if (isSuperAdmin || hasPermission('users')) {
      try {
        const u = await adminFetch<AdminUser[]>('/users', token!);
        setUsers(u);
      } catch {}
    }
    if (isSuperAdmin || hasPermission('feedback')) {
      try {
        const f = await adminFetch<FeedbackMessage[]>('/feedback', token!);
        setFeedback(f);
      } catch {}
    }
    setLoading(false);
  }, [token, currentUser?.role, currentUser?.permissions, currentUser?.faculty_ids, loginTime, isSuperAdmin]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleLogoClick = () => {
    if (!isSuperAdmin) return;
    setKillClicks(prev => {
      const next = prev + 1;
      clearTimeout(killTimerRef.current);
      if (next >= 3) {
        setShowKillSwitch(true);
        return 0;
      }
      killTimerRef.current = setTimeout(() => setKillClicks(0), 2000);
      return next;
    });
  };

  const toggleKioskPause = async () => {
    const newVal = !settings.kiosk_paused;
    await adminFetch('/settings', token!, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kiosk_paused: newVal }) });
    setSettings(prev => ({ ...prev, kiosk_paused: newVal }));
  };

  const terminateAllSessions = async () => {
    await adminFetch('/settings', token!, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force_logout_at: new Date().toISOString() }) });
  };

  const requestKioskSync = async () => {
    setKioskSyncing(true);
    try {
      const result = await adminFetch<{ sync_requested_at: string }>('/settings?action=sync-signal', token!, { method: 'POST', body: JSON.stringify({}) });
      setSettings(prev => ({ ...prev, sync_requested_at: result.sync_requested_at }));
      setKioskSyncSent(true);
      setTimeout(() => setKioskSyncSent(false), 2500);
    } finally {
      setKioskSyncing(false);
    }
  };

  const { active: activeAnnouncements } = splitActiveItems(announcements);
  const { active: activeEvents } = splitActiveItems(events);

  const allTabs: { key: Tab; label: string; icon: React.ReactNode; count?: number; perm: string }[] = [
    { key: 'dashboard', label: 'Panel', icon: <LayoutDashboard size={20} />, perm: 'dashboard' },
    { key: 'announcements', label: 'Elanlar', icon: <Bell size={20} />, count: activeAnnouncements.length, perm: 'announcements' },
    { key: 'faculties', label: 'Fakültələr', icon: <Clock size={20} />, count: faculties.length, perm: 'faculties' },
    { key: 'schedules', label: 'Dərs Cədvəlləri', icon: <Table2 size={20} />, perm: 'schedules' },
    { key: 'events', label: 'Tədbirlər', icon: <CalendarDays size={20} />, count: activeEvents.length, perm: 'events' },
    { key: 'cafeteria', label: 'Yeməkxana', icon: <Coffee size={20} />, perm: 'cafeteria' },
    { key: 'info', label: 'Məlumat', icon: <Info size={20} />, perm: 'info' },
    { key: 'feedback', label: 'Təklif və iradlar', icon: <MessageSquare size={20} />, count: feedback.length, perm: 'feedback' },
    { key: 'settings', label: 'Tənzimləmələr', icon: <Settings size={20} />, perm: 'settings' },
    { key: 'users', label: 'İstifadəçilər', icon: <Users size={20} />, count: users.length, perm: 'users' },
    { key: 'devices', label: 'Kiosklar', icon: <Monitor size={20} />, perm: 'devices' },
  ];

  const visibleTabs = allTabs.filter(t => hasPermission(t.perm));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 cursor-default select-none" onClick={handleLogoClick}>
            <div className="w-10 h-10 bg-uni-blue rounded-xl flex items-center justify-center"><GraduationCap size={22} className="text-uni-gold" /></div>
            <div><h1 className="font-bold text-uni-blue text-lg">OYU Kiosk</h1><p className="text-xs text-gray-400">Admin Panel</p></div>
          </div>
          {showKillSwitch && isSuperAdmin && (
            <div className="mt-3 space-y-2">
              <div className="p-3 rounded-xl border border-red-200 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-700">{settings.kiosk_paused ? 'Kiosk DAYANDIRILIB' : 'Kiosk aktiv'}</p>
                    <p className="text-[10px] text-red-400">Sistemi dayandır/başlat</p>
                  </div>
                  <button onClick={toggleKioskPause}
                    className={"px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors " + (settings.kiosk_paused ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}>
                    {settings.kiosk_paused ? 'BAŞLAT' : 'DAYANDÍR'}
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-700">Sessiyalar</p>
                    <p className="text-[10px] text-amber-500">Bütün admin sessiyalarını bitir</p>
                  </div>
                  <button onClick={terminateAllSessions}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors">
                    TERMINATE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleTabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={"w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors " + (tab === t.key ? "bg-uni-blue text-white" : "text-gray-600 hover:bg-gray-100")}>
              {t.icon}<span>{t.label}</span>
              {t.count !== undefined && <span className={"ml-auto text-xs px-2 py-0.5 rounded-full " + (tab === t.key ? "bg-white/20" : "bg-gray-200")}>{t.count}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-gray-800">{currentUser?.name}</p>
            <p className="text-xs text-gray-400">{currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin'}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={20} /><span>Çıxış</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {!loading && (
          <div className="flex justify-end mb-5">
            <button onClick={requestKioskSync} disabled={kioskSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
              {kioskSyncing ? <Loader2 size={18} className="animate-spin" /> : kioskSyncSent ? <Check size={18} /> : <RefreshCw size={18} />}
              {kioskSyncSent ? 'Refresh göndərildi' : 'Kiosklara refresh göndər'}
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-uni-blue" /></div>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardView announcements={activeAnnouncements} faculties={faculties} events={activeEvents} feedback={feedback} onNavigate={setTab} />}
            {tab === 'announcements' && <AnnouncementsManager items={announcements} token={token!} onRefresh={loadAll} faculties={faculties} allowedFacultyIds={allowedFacultyIds} />}
            {tab === 'faculties' && <FacultyManager faculties={faculties} token={token!} onRefresh={loadAll} />}
            {tab === 'schedules' && <ScheduleEditor faculties={faculties} token={token!} />}
            {tab === 'events' && <EventsManager items={events} token={token!} onRefresh={loadAll} />}
            {tab === 'cafeteria' && <CafeteriaManager items={cafeteria} token={token!} onRefresh={loadAll} />}
            {tab === 'info' && <InfoManager items={info} token={token!} onRefresh={loadAll} />}
            {tab === 'feedback' && <FeedbackManager items={feedback} />}
            {tab === 'settings' && <SettingsManager settings={settings} announcements={activeAnnouncements} token={token!} onRefresh={loadAll} />}
            {tab === 'users' && <UsersManager items={users} token={token!} onRefresh={loadAll} faculties={faculties} />}
            {tab === 'devices' && <DevicesManager token={token!} />}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────
function DashboardView({ announcements, faculties, events, feedback, onNavigate }: { announcements: Announcement[]; faculties: Faculty[]; events: KioskEvent[]; feedback: FeedbackMessage[]; onNavigate: (t: Tab) => void }) {
  const stats = [
    { label: 'Elanlar', count: announcements.length, icon: <Bell size={24} />, color: 'bg-red-50 text-red-600', tab: 'announcements' as Tab },
    { label: 'Fakültələr', count: faculties.length, icon: <Clock size={24} />, color: 'bg-blue-50 text-blue-600', tab: 'faculties' as Tab },
    { label: 'Tədbirlər', count: events.length, icon: <CalendarDays size={24} />, color: 'bg-green-50 text-green-600', tab: 'events' as Tab },
    { label: 'Təklif və iradlar', count: feedback.length, icon: <MessageSquare size={24} />, color: 'bg-amber-50 text-amber-600', tab: 'feedback' as Tab },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">İdarəetmə Paneli</h2>
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map(s => (
          <button key={s.label} onClick={() => onNavigate(s.tab)} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow text-left">
            <div className={"w-12 h-12 rounded-xl flex items-center justify-center mb-4 " + s.color}>{s.icon}</div>
            <h3 className="text-4xl font-bold text-gray-900 mb-1">{s.count}</h3>
            <p className="text-gray-500 font-medium flex items-center gap-1">{s.label} <ChevronRight size={16} /></p>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Son Elanlar</h3>
        <div className="space-y-3">
          {announcements.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
              <div className={"w-3 h-3 rounded-full " + (a.importance === 'high' ? 'bg-red-500' : a.importance === 'medium' ? 'bg-amber-500' : 'bg-gray-400')} />
              <span className="font-medium text-gray-800 flex-1">{a.title}</span>
              <span className="text-sm text-gray-400">{formatDisplayDate(a.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackManager({ items }: { items: FeedbackMessage[] }) {
  const categoryLabel = (category: FeedbackMessage['category']) => category === 'irad' ? 'İrad' : 'Təklif';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Təklif və iradlar</h2>
          <p className="text-sm text-gray-500 mt-1">Kiosk QR formundan göndərilən son mesajlar</p>
        </div>
        <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">{items.length} mesaj</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Hələ mesaj yoxdur</p>
          <p className="text-sm mt-1">Tələbələr QR formundan yazdıqdan sonra burada görünəcək.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <article key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className={"rounded-full px-3 py-1 text-xs font-bold " +
                    (item.category === 'irad' ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700")}>
                    {categoryLabel(item.category)}
                  </span>
                  <span className="text-sm text-gray-400">{new Date(item.created_at).toLocaleString('az-AZ')}</span>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-gray-800 leading-7">{item.message}</p>
              {(item.name || item.contact) && (
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {item.name && <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">{item.name}</span>}
                  {item.contact && <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">{item.contact}</span>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveList<T extends { id: number; title: string }>({ title, emptyText, count, items, renderMeta, canEdit, onRestore, onDelete }: {
  title: string;
  emptyText: string;
  count: number;
  items: T[];
  renderMeta: (item: T) => string;
  canEdit?: (item: T) => boolean;
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Archive size={18} /> {title}</h3>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">{count}</span>
      </div>
      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-sm text-gray-400">{emptyText}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {items.map(item => {
            const editable = canEdit ? canEdit(item) : true;
            return (
              <div key={item.id} className={"flex items-center gap-4 px-5 py-4" + (!editable ? " opacity-60" : "")}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{renderMeta(item)}</p>
                </div>
                <button onClick={() => editable && onRestore(item.id)} disabled={!editable}
                  className={"px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 " + (editable ? "bg-blue-50 text-uni-blue hover:bg-blue-100" : "bg-gray-50 text-gray-300 cursor-not-allowed")}>
                  <RotateCcw size={14} /> Bərpa et
                </button>
                <button onClick={() => editable && onDelete(item.id)} disabled={!editable}
                  className={"px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 " + (editable ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-gray-50 text-gray-300 cursor-not-allowed")}>
                  <Trash2 size={14} /> Sil
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Settings Manager ───────────────────────────────────
function SettingsManager({ settings, announcements, token, onRefresh }: { settings: KioskSettings; announcements: Announcement[]; token: string; onRefresh: () => void }) {
  const [local, setLocal] = useState<KioskSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSent, setSyncSent] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch('/settings', token, { method: 'PUT', body: JSON.stringify(local) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } finally { setSaving(false); }
  };

  const requestKioskSync = async () => {
    setSyncing(true);
    try {
      const result = await adminFetch<{ sync_requested_at: string }>('/settings?action=sync-signal', token, { method: 'POST', body: JSON.stringify({}) });
      setLocal(prev => ({ ...prev, sync_requested_at: result.sync_requested_at }));
      setSyncSent(true);
      setTimeout(() => setSyncSent(false), 2500);
      onRefresh();
    } finally { setSyncing(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tənzimləmələr</h2>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Yadda saxlanıldı!' : 'Yadda saxla'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Kiosk məlumatları</h3>
              <p className="text-sm text-gray-500 mt-1">
                Elan və cədvəl dəyişəndən sonra kiosklara yenilənmə siqnalı göndər
              </p>
              {local.sync_requested_at && (
                <p className="text-xs text-gray-400 mt-2">Son siqnal: {new Date(local.sync_requested_at).toLocaleString('az-AZ')}</p>
              )}
            </div>
            <button onClick={requestKioskSync} disabled={syncing}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50">
              {syncing ? <Loader2 size={16} className="animate-spin" /> : syncSent ? <Check size={16} /> : <RefreshCw size={16} />}
              {syncSent ? 'Siqnal göndərildi' : 'Kiosklara yenilə'}
            </button>
          </div>
        </div>

        {/* Ticker */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Elan Tikeri</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Tikeri aktiv et</p>
                <p className="text-sm text-gray-500">Ana səhifədə elan tikeri göstərilsin</p>
              </div>
              <button onClick={() => setLocal({ ...local, ticker_enabled: !local.ticker_enabled })}
                className={"relative w-14 h-7 rounded-full transition-colors " + (local.ticker_enabled ? "bg-uni-blue" : "bg-gray-300")}>
                <span className={"absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform " + (local.ticker_enabled ? "translate-x-7" : "translate-x-0.5")} />
              </button>
            </div>
            {local.ticker_enabled && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tiker rejimi</label>
                  <div className="flex gap-3">
                    <button onClick={() => setLocal({ ...local, ticker_mode: 'scroll', ticker_pinned_id: null })}
                      className={"flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors " +
                        (local.ticker_mode === 'scroll' ? "border-uni-blue bg-blue-50 text-uni-blue" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                      Dinamik (sürüşən)
                    </button>
                    <button onClick={() => setLocal({ ...local, ticker_mode: 'static' })}
                      className={"flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors " +
                        (local.ticker_mode === 'static' ? "border-uni-blue bg-blue-50 text-uni-blue" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                      Sabit (bir elan)
                    </button>
                  </div>
                </div>
                {local.ticker_mode === 'static' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Sabit göstəriləcək elan</label>
                    <select value={local.ticker_pinned_id ?? ''} onChange={e => setLocal({ ...local, ticker_pinned_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue">
                      <option value="">Seçin...</option>
                      {announcements.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sleep Screen */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sleep ekranı</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Sleep ekranını aktiv et</p>
              <p className="text-sm text-gray-500">Kiosk istifadə olunmayanda qoruyucu ekran göstərilsin</p>
            </div>
            <button onClick={() => setLocal({ ...local, sleep_screen_enabled: !local.sleep_screen_enabled })}
              className={"relative w-14 h-7 rounded-full transition-colors " + (local.sleep_screen_enabled ? "bg-uni-blue" : "bg-gray-300")}>
              <span className={"absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform " + (local.sleep_screen_enabled ? "translate-x-7" : "translate-x-0.5")} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Dil tənzimləmələri</h3>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Standart dil</label>
            <div className="flex gap-3">
              {[{ v: 'az', l: 'Azərbaycan' }, { v: 'en', l: 'English' }, { v: 'ru', l: 'Русский' }].map(lang => (
                <button key={lang.v} onClick={() => setLocal({ ...local, default_language: lang.v })}
                  className={"flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors " +
                    (local.default_language === lang.v ? "border-uni-blue bg-blue-50 text-uni-blue" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                  {lang.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Announcements Manager ──────────────────────────────
function AnnouncementsManager({ items, token, onRefresh, faculties, allowedFacultyIds }: { items: Announcement[]; token: string; onRefresh: () => void; faculties: Faculty[]; allowedFacultyIds: number[] }) {
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<{ id: number; name: string }[]>([]);
  const { active, archived } = splitActiveItems(items);

  useEffect(() => { apiFetch<{ id: number; name: string }[]>('/announcement-types').then(setTypes).catch(() => {}); }, []);

  const createType = async (name: string) => {
    const created = await adminFetch<{ id: number; name: string }>('/announcement-types', token, { method: 'POST', body: JSON.stringify({ name }) });
    setTypes(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const table = normalizeAnnouncementTable(editing?.table_headers, editing?.table_rows);
      const payload = {
        ...editing,
        image_url: editing?.image_url || null,
        table_headers: table?.headers ?? [],
        table_rows: table?.rows ?? [],
        theme: normalizeAnnouncementTheme(editing?.theme),
      };
      if (editing?.id) {
        await adminFetch('/announcements', token, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/announcements', token, { method: 'POST', body: JSON.stringify(payload) });
      }
      setEditing(null); onRefresh();
    } finally { setSaving(false); }
  };

  const updateActive = async (id: number, active: boolean) => {
    await adminFetch('/announcements', token, { method: 'PUT', body: JSON.stringify({ id, active }) });
    onRefresh();
  };

  const remove = async (id: number) => {
    await adminFetch('/announcements', token, { method: 'DELETE', body: JSON.stringify({ id }) });
    onRefresh();
  };

  // Faculty-scoped: show all items, but only allow editing own faculty's items
  const canEdit = (a: Announcement) =>
    allowedFacultyIds.length === 0 || !a.faculty_id || allowedFacultyIds.includes(a.faculty_id);

  // Default faculty_id when creating (faculty-scoped admin auto-selects their faculty)
  const defaultFacultyId = allowedFacultyIds.length === 1 ? allowedFacultyIds[0] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Elanlar</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing({ importance: 'low', theme: 'blue', type: types[0]?.name || '', date: new Date().toISOString().slice(0, 10), faculty_id: defaultFacultyId, table_headers: [], table_rows: [], image_url: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900">
            <Plus size={18} /> Yeni elan
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Başlıq</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Fakültə</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tip</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Vaciblik</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tarix</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {active.map(a => {
              const fac = faculties.find(f => f.id === a.faculty_id);
              const editable = canEdit(a);
              const table = normalizeAnnouncementTable(a.table_headers, a.table_rows);
              const theme = ANNOUNCEMENT_THEME_OPTIONS.find(option => option.value === normalizeAnnouncementTheme(a.theme));
              return (
              <tr key={a.id} className={"hover:bg-gray-50" + (!editable ? " opacity-60" : "")}>
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div>{a.title}</div>
                  <div className="mt-1 flex gap-1.5">
                    {table && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Cədvəl</span>}
                    {a.image_url && <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Şəkil</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{fac ? <span className="px-2 py-1 bg-blue-50 text-uni-blue rounded-lg text-xs font-medium">{fac.name}</span> : <span className="text-gray-400 text-xs">Ümumi</span>}</td>
                <td className="px-6 py-4 text-gray-500">{a.type}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <span className={"px-3 py-1 rounded-full text-xs font-bold " + (a.importance === 'high' ? 'bg-red-100 text-red-700' : a.importance === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600')}>{a.importance === 'high' ? 'Yüksək' : a.importance === 'medium' ? 'Orta' : 'Aşağı'}</span>
                    {theme && <span className={"px-3 py-1 rounded-full text-xs font-bold border " + theme.chip}>{theme.label}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDisplayDate(a.date)}</td>
                <td className="px-6 py-4 flex gap-2 justify-end">
                  <button onClick={() => editable && setEditing(a)} disabled={!editable} className={"p-2 " + (editable ? "text-gray-400 hover:text-uni-blue" : "text-gray-200 cursor-not-allowed")}><Edit3 size={18} /></button>
                  <button onClick={() => editable && updateActive(a.id, false)} disabled={!editable} className={"p-2 " + (editable ? "text-gray-400 hover:text-amber-600" : "text-gray-200 cursor-not-allowed")} title="Arxivlə"><Archive size={18} /></button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ArchiveList
        title="Arxiv elanlar"
        emptyText="Arxivdə elan yoxdur"
        count={archived.length}
        items={archived}
        renderMeta={item => formatDisplayDate(item.date)}
        canEdit={canEdit}
        onRestore={id => updateActive(id, true)}
        onDelete={remove}
      />
      {editing && (
        <FormModal title={editing.id ? 'Elanı redaktə et' : 'Yeni elan'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Başlıq" value={editing.title || ''} onChange={v => setEditing({ ...editing, title: v })} />
          <TextArea label="Təsvir" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} />
          <ImageUploadField label="Şəkil" value={editing.image_url || ''} onChange={v => setEditing({ ...editing, image_url: v })} />
          <AnnouncementTableEditor
            headers={editing.table_headers || []}
            rows={editing.table_rows || []}
            onChange={(headers, rows) => setEditing({ ...editing, table_headers: headers, table_rows: rows })}
          />
          <CreatableSelect label="Tip" value={editing.type || ''} onChange={v => setEditing({ ...editing, type: v })}
            options={types} onCreateOption={createType} />
          <Select label="Vaciblik" value={editing.importance || 'low'} onChange={v => setEditing({ ...editing, importance: v as any })}
            options={[{ value: 'high', label: 'Yüksək' }, { value: 'medium', label: 'Orta' }, { value: 'low', label: 'Aşağı' }]} />
          <Select label="Rəng" value={normalizeAnnouncementTheme(editing.theme)} onChange={v => setEditing({ ...editing, theme: normalizeAnnouncementTheme(v) })}
            options={ANNOUNCEMENT_THEME_OPTIONS.map(option => ({ value: option.value, label: option.label }))} />
          <Input label="Tarix" value={toDateInputValue(editing.date)} onChange={v => setEditing({ ...editing, date: v })} type="date" />
          {/* Faculty selector: hidden for single-faculty admins, visible for superadmin */}
          {(allowedFacultyIds.length !== 1) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fakültə (boş = ümumi)</label>
              <select value={editing.faculty_id ?? ''} onChange={e => setEditing({ ...editing, faculty_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uni-blue/30">
                <option value="">— Ümumi (bütün fakültələr) —</option>
                {(allowedFacultyIds.length > 0 ? faculties.filter(f => allowedFacultyIds.includes(f.id)) : faculties).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </FormModal>
      )}
    </div>
  );
}

// ─── Schedule Editor (Excel-like) ─────────────────────────
const DAY_NAMES = ['I', 'II', 'III', 'IV', 'V'];
const TIME_SLOTS = ['08:00-09:20', '09:35-10:55', '11:10-12:30', '12:45-14:05', '14:20-15:40', '15:55-17:15'];
const SECTOR_OPTIONS = [{ value: 'az', label: 'AZ' }, { value: 'ru', label: 'RU' }, { value: 'en', label: 'EN' }];

function ScheduleEditor({ faculties, token }: { faculties: Faculty[]; token: string }) {
  const [facultyId, setFacultyId] = useState<number>(faculties[0]?.id ?? 0);
  const [courseYear, setCourseYear] = useState(1);
  const [sector, setSector] = useState('az');
  const [groups, setGroups] = useState<string[]>([]);
  const [cells, setCells] = useState<Record<string, ScheduleCell>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellDraft, setCellDraft] = useState<ScheduleCell>({ s: '', t: '', r: '' });
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  const loadSchedule = useCallback(async () => {
    if (!facultyId) return;
    setLoading(true);
    try {
      const all = await adminFetch<Schedule[]>(`/exams?entity=schedule&faculty_id=${facultyId}`, token);
      const found = all.find(s => s.course_year === courseYear && s.sector === sector);
      if (found) {
        setGroups(found.groups || []);
        setCells(found.cells || {});
      } else {
        setGroups([]);
        setCells({});
      }
      setDirty(false);
    } catch { setGroups([]); setCells({}); }
    setLoading(false);
  }, [facultyId, courseYear, sector, token]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const saveSchedule = async () => {
    setSaving(true);
    try {
      await adminFetch('/exams?entity=schedule', token, {
        method: 'PUT',
        body: JSON.stringify({ faculty_id: facultyId, course_year: courseYear, sector, groups, cells }),
      });
      setDirty(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } finally { setSaving(false); }
  };

  const updateCell = (key: string, field: keyof ScheduleCell, value: string) => {
    setCells(prev => {
      const existing = prev[key] || { s: '', t: '', r: '' };
      const updated = { ...existing, [field]: value };
      if (!updated.s && !updated.t && !updated.r) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });
    setDirty(true);
  };

  const clearCell = (key: string) => {
    setCells(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setDirty(true);
    setEditingCell(null);
  };

  const addGroup = () => {
    if (!newGroupName.trim() || groups.includes(newGroupName.trim())) return;
    setGroups(prev => [...prev, newGroupName.trim()]);
    setNewGroupName('');
    setAddingGroup(false);
    setDirty(true);
  };

  const removeGroup = (idx: number) => {
    setGroups(prev => prev.filter((_, i) => i !== idx));
    // Remove all cells for this group index and re-index higher groups
    setCells(prev => {
      const next: Record<string, ScheduleCell> = {};
      for (const [key, val] of Object.entries(prev)) {
        const [d, t, g] = key.split('_').map(Number);
        if (g === idx) continue;
        const newG = g > idx ? g - 1 : g;
        next[`${d}_${t}_${newG}`] = val;
      }
      return next;
    });
    setDirty(true);
  };

  const startEdit = (key: string) => {
    setEditingCell(key);
    setCellDraft(cells[key] || { s: '', t: '', r: '' });
  };

  const commitEdit = () => {
    if (!editingCell) return;
    if (!cellDraft.s && !cellDraft.t && !cellDraft.r) {
      clearCell(editingCell);
    } else {
      setCells(prev => ({ ...prev, [editingCell!]: { ...cellDraft } }));
      setDirty(true);
    }
    setEditingCell(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dərs Cədvəlləri</h2>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-medium text-sm flex items-center gap-1"><Check size={16} /> Yadda saxlanıldı</span>}
          {dirty && (
            <button onClick={saveSchedule} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Yadda saxla
            </button>
          )}
        </div>
      </div>

      {/* Selectors */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fakültə</label>
          <select value={facultyId} onChange={e => setFacultyId(Number(e.target.value))}
            className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue bg-white text-sm font-medium min-w-[240px]">
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Kurs</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(y => (
              <button key={y} onClick={() => setCourseYear(y)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${courseYear === y ? 'bg-uni-blue text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {y}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sektor</label>
          <div className="flex gap-1">
            {SECTOR_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setSector(s.value)}
                className={`px-4 h-10 rounded-lg text-sm font-bold transition-all ${sector === s.value ? 'bg-uni-gold text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={28} className="animate-spin text-uni-blue" /></div>
      ) : (
        <>
          {/* Group management */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm font-medium text-gray-500">Qruplar:</span>
            {groups.map((g, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                {g}
                <button onClick={() => removeGroup(i)} className="ml-1 text-blue-400 hover:text-red-500" title="Qrupu sil"><X size={14} /></button>
              </span>
            ))}
            {addingGroup ? (
              <div className="inline-flex items-center gap-1">
                <input autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addGroup(); if (e.key === 'Escape') setAddingGroup(false); }}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-24 outline-none focus:border-uni-blue" placeholder="Qrup..." />
                <button onClick={addGroup} className="p-1.5 bg-uni-blue text-white rounded-lg"><Check size={14} /></button>
                <button onClick={() => setAddingGroup(false)} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setAddingGroup(true)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-lg text-sm hover:border-uni-blue hover:text-uni-blue">
                <Plus size={14} /> Qrup əlavə et
              </button>
            )}
          </div>

          {/* Schedule grid */}
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <Table2 size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Qrup əlavə edərək cədvəli yaradın</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-3 text-xs font-bold text-gray-500 border-b border-r border-gray-200 sticky left-0 bg-gray-50 z-10 w-20">Gün</th>
                    <th className="px-3 py-3 text-xs font-bold text-gray-500 border-b border-r border-gray-200 sticky left-20 bg-gray-50 z-10 w-28">Saat</th>
                    {groups.map((g, i) => (
                      <th key={i} className="px-2 py-3 text-xs font-bold text-blue-700 border-b border-r border-gray-200 min-w-[140px] whitespace-nowrap">{g}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAY_NAMES.map((dayName, dayIdx) =>
                    TIME_SLOTS.map((slot, slotIdx) => (
                      <tr key={`${dayIdx}_${slotIdx}`} className={`${slotIdx === 0 ? 'border-t-2 border-gray-300' : 'border-t border-gray-100'} hover:bg-blue-50/30`}>
                        {slotIdx === 0 && (
                          <td rowSpan={TIME_SLOTS.length} className="px-3 py-2 text-center font-black text-lg text-uni-blue border-r border-gray-200 sticky left-0 bg-white z-10 align-middle">{dayName}</td>
                        )}
                        <td className="px-2 py-2 text-xs font-medium text-gray-500 border-r border-gray-200 sticky left-20 bg-white z-10 whitespace-nowrap">{slot}</td>
                        {groups.map((_, gIdx) => {
                          const key = `${dayIdx + 1}_${slotIdx + 1}_${gIdx}`;
                          const cell = cells[key];
                          const isEditing = editingCell === key;
                          return (
                            <td key={gIdx} className={`px-1 py-1 border-r border-gray-100 align-top transition-colors ${isEditing ? 'bg-blue-50 ring-2 ring-uni-blue ring-inset' : 'cursor-pointer hover:bg-yellow-50'}`}
                              onClick={() => !isEditing && startEdit(key)}>
                              {isEditing ? (
                                <div className="space-y-1 p-1" onClick={e => e.stopPropagation()}>
                                  <textarea value={cellDraft.s} onChange={e => setCellDraft(p => ({ ...p, s: e.target.value }))}
                                    placeholder="Fənn" rows={2}
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-uni-blue resize-none" />
                                  <input value={cellDraft.t} onChange={e => setCellDraft(p => ({ ...p, t: e.target.value }))}
                                    placeholder="Müəllim"
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-uni-blue" />
                                  <input value={cellDraft.r} onChange={e => setCellDraft(p => ({ ...p, r: e.target.value }))}
                                    placeholder="Aud."
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-uni-blue" />
                                  <div className="flex gap-1 justify-end">
                                    <button onClick={() => clearCell(key)} className="px-2 py-0.5 text-[10px] text-red-500 hover:bg-red-50 rounded" title="Təmizlə"><Trash2 size={12} /></button>
                                    <button onClick={() => setEditingCell(null)} className="px-2 py-0.5 text-[10px] text-gray-400 hover:bg-gray-100 rounded"><X size={12} /></button>
                                    <button onClick={commitEdit} className="px-2 py-0.5 text-[10px] bg-uni-blue text-white rounded"><Check size={12} /></button>
                                  </div>
                                </div>
                              ) : cell ? (
                                <div className="p-1 min-h-[40px]">
                                  <p className="text-[11px] font-semibold text-gray-800 leading-tight whitespace-pre-line">{cell.s}</p>
                                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5 whitespace-pre-line">{cell.t}</p>
                                  <p className="text-[10px] text-blue-600 font-bold whitespace-pre-line">{cell.r && `Aud: ${cell.r}`}</p>
                                </div>
                              ) : (
                                <div className="min-h-[40px] flex items-center justify-center">
                                  <span className="text-gray-200 text-xs">+</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Faculty Manager ──────────────────────────────────────
function FacultyManager({ faculties, token, onRefresh }: { faculties: Faculty[]; token: string; onRefresh: () => void }) {
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<Partial<Faculty> | null>(null);
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);
  const [editingContent, setEditingContent] = useState<Partial<DeptContent> | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedFaculty = faculties.find(f => f.id === selectedFacultyId);
  const selectedDept = selectedFaculty?.departments.find(d => d.id === selectedDeptId);

  const saveFaculty = async () => {
    setSaving(true);
    try {
      if (editingFaculty?.id) {
        await adminFetch('/exams?entity=faculty', token, { method: 'PUT', body: JSON.stringify(editingFaculty) });
      } else {
        await adminFetch('/exams?entity=faculty', token, { method: 'POST', body: JSON.stringify(editingFaculty) });
      }
      setEditingFaculty(null); onRefresh();
    } finally { setSaving(false); }
  };

  const removeFaculty = async (id: number) => {
    await adminFetch('/exams?entity=faculty', token, { method: 'DELETE', body: JSON.stringify({ id }) });
    setSelectedFacultyId(null); setSelectedDeptId(null); onRefresh();
  };

  const saveDept = async () => {
    setSaving(true);
    try {
      const data = { ...editingDept, faculty_id: selectedFacultyId };
      if (editingDept?.id) {
        await adminFetch('/exams?entity=department', token, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await adminFetch('/exams?entity=department', token, { method: 'POST', body: JSON.stringify(data) });
      }
      setEditingDept(null); onRefresh();
    } finally { setSaving(false); }
  };

  const removeDept = async (id: number) => {
    await adminFetch('/exams?entity=department', token, { method: 'DELETE', body: JSON.stringify({ id }) });
    setSelectedDeptId(null); onRefresh();
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const data = { ...editingContent, department_id: selectedDeptId };
      if (editingContent?.id) {
        await adminFetch('/exams?entity=content', token, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await adminFetch('/exams?entity=content', token, { method: 'POST', body: JSON.stringify(data) });
      }
      setEditingContent(null); onRefresh();
    } finally { setSaving(false); }
  };

  const removeContent = async (id: number) => {
    await adminFetch('/exams?entity=content', token, { method: 'DELETE', body: JSON.stringify({ id }) });
    onRefresh();
  };

  // Level 3: Department content
  if (selectedDept) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedDeptId(null)} className="flex items-center gap-1 text-uni-blue hover:underline font-medium">
            <ChevronLeft size={18} /> {selectedFaculty!.name}
          </button>
          <span className="text-gray-400">/</span>
          <h2 className="text-2xl font-bold text-gray-900">{selectedDept.name}</h2>
        </div>
        <button onClick={() => setEditingContent({ type: 'schedule', course_year: 1 })} className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900 mb-4"><Plus size={18} /> Yeni məzmun</button>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Başlıq</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tip</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Kurs</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Şəkil</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {selectedDept.content.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.title}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.type === 'schedule' ? 'bg-blue-100 text-blue-700' : c.type === 'exam' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {c.type === 'schedule' ? 'Cədvəl' : c.type === 'exam' ? 'İmtahan' : 'Elan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{c.course_year || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{c.image_url ? '✓' : '-'}</td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    <button onClick={() => setEditingContent(c)} className="p-2 text-gray-400 hover:text-uni-blue"><Edit3 size={18} /></button>
                    <button onClick={() => removeContent(c.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editingContent && (
          <FormModal title={editingContent.id ? 'Məzmunu redaktə et' : 'Yeni məzmun'} onClose={() => setEditingContent(null)} onSave={saveContent} saving={saving}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
              <select value={editingContent.type || 'schedule'} onChange={e => setEditingContent({ ...editingContent, type: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-uni-blue/20 focus:border-uni-blue transition-colors outline-none">
                <option value="schedule">Dərs Cədvəli</option>
                <option value="announcement">Elan</option>
                <option value="exam">İmtahan</option>
              </select>
            </div>
            <Input label="Başlıq" value={editingContent.title || ''} onChange={v => setEditingContent({ ...editingContent, title: v })} />
            <Input label="Təsvir" value={editingContent.description || ''} onChange={v => setEditingContent({ ...editingContent, description: v })} />
            <Input label="Şəkil URL" value={editingContent.image_url || ''} onChange={v => setEditingContent({ ...editingContent, image_url: v })} placeholder="https://..." />
            {editingContent.type === 'schedule' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurs</label>
                <select value={editingContent.course_year ?? 1} onChange={e => setEditingContent({ ...editingContent, course_year: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-uni-blue/20 focus:border-uni-blue transition-colors outline-none">
                  <option value={1}>1-ci kurs</option>
                  <option value={2}>2-ci kurs</option>
                  <option value={3}>3-cü kurs</option>
                  <option value={4}>4-cü kurs</option>
                </select>
              </div>
            )}
          </FormModal>
        )}
      </div>
    );
  }

  // Level 2: Departments of a faculty
  if (selectedFaculty) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedFacultyId(null)} className="flex items-center gap-1 text-uni-blue hover:underline font-medium">
            <ChevronLeft size={18} /> Fakültələr
          </button>
          <span className="text-gray-400">/</span>
          <h2 className="text-2xl font-bold text-gray-900">{selectedFaculty.name}</h2>
          <button onClick={() => removeFaculty(selectedFaculty.id)} className="ml-auto p-2 text-gray-400 hover:text-red-600" title="Fakültəni sil"><Trash2 size={18} /></button>
        </div>
        <button onClick={() => setEditingDept({})} className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900 mb-4"><Plus size={18} /> Yeni kafedra</button>
        <div className="space-y-3">
          {selectedFaculty.departments.map(d => (
            <div key={d.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <button onClick={() => setSelectedDeptId(d.id)} className="flex-1 text-left">
                <h4 className="text-lg font-bold text-gray-900">{d.name}</h4>
                <p className="text-sm text-gray-500">{d.content.length} məzmun</p>
              </button>
              <button onClick={() => setEditingDept(d)} className="p-2 text-gray-400 hover:text-uni-blue"><Edit3 size={18} /></button>
              <button onClick={() => removeDept(d.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
              <button onClick={() => setSelectedDeptId(d.id)} className="p-2 text-gray-400 hover:text-uni-blue"><ChevronRight size={18} /></button>
            </div>
          ))}
        </div>
        {editingDept && (
          <FormModal title={editingDept.id ? 'Kafedranı redaktə et' : 'Yeni kafedra'} onClose={() => setEditingDept(null)} onSave={saveDept} saving={saving}>
            <Input label="Kafedra adı" value={editingDept.name || ''} onChange={v => setEditingDept({ ...editingDept, name: v })} />
          </FormModal>
        )}
      </div>
    );
  }

  // Level 1: Faculty list
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fakültələr</h2>
        <button onClick={() => setEditingFaculty({})} className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900"><Plus size={18} /> Yeni fakültə</button>
      </div>
      <div className="space-y-3">
        {faculties.map(f => (
          <div key={f.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <button onClick={() => setSelectedFacultyId(f.id)} className="flex-1 text-left">
              <h4 className="text-lg font-bold text-gray-900">{f.name}</h4>
              <p className="text-sm text-gray-500">{f.departments.length} kafedra</p>
            </button>
            <button onClick={() => setEditingFaculty(f)} className="p-2 text-gray-400 hover:text-uni-blue"><Edit3 size={18} /></button>
            <button onClick={() => removeFaculty(f.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
            <button onClick={() => setSelectedFacultyId(f.id)} className="p-2 text-gray-400 hover:text-uni-blue"><ChevronRight size={18} /></button>
          </div>
        ))}
      </div>
      {editingFaculty && (
        <FormModal title={editingFaculty.id ? 'Fakültəni redaktə et' : 'Yeni fakültə'} onClose={() => setEditingFaculty(null)} onSave={saveFaculty} saving={saving}>
          <Input label="Fakültə adı" value={editingFaculty.name || ''} onChange={v => setEditingFaculty({ ...editingFaculty, name: v })} />
        </FormModal>
      )}
    </div>
  );
}

// ─── Events Manager ─────────────────────────────────────
function EventsManager({ items, token, onRefresh }: { items: KioskEvent[]; token: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Partial<KioskEvent> | null>(null);
  const [registrationViewer, setRegistrationViewer] = useState<{ event: KioskEvent; rows: EventRegistration[]; loading: boolean; error: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<{ id: number; name: string }[]>([]);
  const { active, archived } = splitActiveItems(items);

  useEffect(() => { apiFetch<{ id: number; name: string }[]>('/event-types').then(setTypes).catch(() => {}); }, []);

  const createType = async (name: string) => {
    const created = await adminFetch<{ id: number; name: string }>('/event-types', token, { method: 'POST', body: JSON.stringify({ name }) });
    setTypes(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing?.id) {
        await adminFetch('/events', token, { method: 'PUT', body: JSON.stringify(editing) });
      } else {
        await adminFetch('/events', token, { method: 'POST', body: JSON.stringify(editing) });
      }
      setEditing(null); onRefresh();
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    await adminFetch('/events', token, { method: 'DELETE', body: JSON.stringify({ id }) });
    onRefresh();
  };

  const updateActive = async (id: number, active: boolean) => {
    await adminFetch('/events', token, { method: 'PUT', body: JSON.stringify({ id, active }) });
    onRefresh();
  };

  const openRegistrations = async (event: KioskEvent) => {
    setRegistrationViewer({ event, rows: [], loading: true, error: '' });
    try {
      const rows = await adminFetch<EventRegistration[]>(`/event-registrations?event_id=${event.id}`, token);
      setRegistrationViewer(current => current?.event.id === event.id ? { ...current, rows, loading: false } : current);
    } catch (err: any) {
      setRegistrationViewer(current => current?.event.id === event.id ? { ...current, loading: false, error: err.message || 'Qeydiyyatlar yüklənmədi' } : current);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tədbirlər</h2>
        <button onClick={() => setEditing({ type: types[0]?.name || '', date: new Date().toISOString().slice(0, 10), image_url: null, registration_enabled: true })}
          className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900"><Plus size={18} /> Yeni tədbir</button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {active.map(ev => (
          <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full text-gray-600">{ev.type}</span>
                {ev.registration_enabled !== false && <span className="text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full text-emerald-700">Qeydiyyat açıq</span>}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{ev.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{formatDisplayDate(ev.date)} &bull; {ev.time_slot} &bull; {ev.location}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditing(ev)} className="flex-1 px-4 py-2 text-sm font-medium text-uni-blue bg-blue-50 rounded-xl hover:bg-blue-100 flex items-center justify-center gap-1"><Edit3 size={14} /> Redaktə</button>
                <button onClick={() => openRegistrations(ev)} className="flex-1 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-1"><ClipboardList size={14} /> İştirakçılar ({ev.registration_count ?? 0})</button>
                <button onClick={() => updateActive(ev.id, false)} className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 flex items-center gap-1"><Archive size={14} /> Arxiv</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ArchiveList
        title="Arxiv tədbirlər"
        emptyText="Arxivdə tədbir yoxdur"
        count={archived.length}
        items={archived}
        renderMeta={item => `${formatDisplayDate(item.date)} · ${item.location}`}
        onRestore={id => updateActive(id, true)}
        onDelete={remove}
      />
      {editing && (
        <FormModal title={editing.id ? 'Tədbiri redaktə et' : 'Yeni tədbir'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Başlıq" value={editing.title || ''} onChange={v => setEditing({ ...editing, title: v })} />
          <TextArea label="Təsvir" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} rows={7} />
          <Input label="Tarix" value={toDateInputValue(editing.date)} onChange={v => setEditing({ ...editing, date: v })} type="date" />
          <Input label="Saat" value={editing.time_slot || ''} onChange={v => setEditing({ ...editing, time_slot: v })} placeholder="10:00 - 18:00" />
          <Input label="Məkan" value={editing.location || ''} onChange={v => setEditing({ ...editing, location: v })} />
          <CreatableSelect label="Tip" value={editing.type || ''} onChange={v => setEditing({ ...editing, type: v })}
            options={types} onCreateOption={createType} />
          <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3">
            <span>
              <span className="flex items-center gap-2 text-sm font-bold text-gray-800"><QrCode size={16} /> Qeydiyyat düyməsi</span>
              <span className="mt-1 block text-sm text-gray-500">Açıq olanda kioskda QR qeydiyyat düyməsi görünəcək.</span>
            </span>
            <input
              type="checkbox"
              checked={editing.registration_enabled !== false}
              onChange={event => setEditing({ ...editing, registration_enabled: event.target.checked })}
              className="h-5 w-5 accent-uni-blue"
            />
          </label>
          <ImageUploadField label="Şəkil" value={editing.image_url || ''} onChange={v => setEditing({ ...editing, image_url: v })} />
        </FormModal>
      )}
      {registrationViewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRegistrationViewer(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">İştirakçılar</h3>
                <p className="mt-1 text-sm text-gray-500">{registrationViewer.event.title}</p>
              </div>
              <button onClick={() => setRegistrationViewer(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            {registrationViewer.loading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 size={28} className="animate-spin text-uni-blue" /></div>
            ) : registrationViewer.error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{registrationViewer.error}</p>
            ) : registrationViewer.rows.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 py-12 text-center text-gray-400">
                <ClipboardList size={42} className="mx-auto mb-3 opacity-60" />
                <p className="font-medium">Hələ qeydiyyatdan keçən yoxdur</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Ad Soyad</th>
                      <th className="px-5 py-3">Qrup</th>
                      <th className="px-5 py-3">Vaxt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrationViewer.rows.map(row => (
                      <tr key={row.id}>
                        <td className="px-5 py-4 font-medium text-gray-900">{row.full_name}</td>
                        <td className="px-5 py-4 text-gray-600">{row.group_name}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{new Date(row.created_at).toLocaleString('az-AZ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cafeteria Manager ──────────────────────────────────
function CafeteriaManager({ items, token, onRefresh }: { items: CafeteriaCategory[]; token: string; onRefresh: () => void }) {
  const [saving, setSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [addingItem, setAddingItem] = useState<{ category_id: number; name: string; price: string } | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await adminFetch('/cafeteria', token, { method: 'POST', body: JSON.stringify({ action: 'add_category', name: newCatName.trim() }) });
      setNewCatName(''); setShowNewCat(false); onRefresh();
    } finally { setSaving(false); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Bu kateqoriya və bütün elementləri silinəcək. Əminsiniz?')) return;
    await adminFetch('/cafeteria', token, { method: 'DELETE', body: JSON.stringify({ action: 'delete_category', id }) });
    onRefresh();
  };

  const addSingleItem = async () => {
    if (!addingItem?.name.trim()) return;
    setSaving(true);
    try {
      await adminFetch('/cafeteria', token, { method: 'POST', body: JSON.stringify({ action: 'add_item', ...addingItem, price: addingItem.price ? parseFloat(addingItem.price) : null }) });
      setAddingItem(null); onRefresh();
    } finally { setSaving(false); }
  };

  const removeItem = async (id: number) => {
    await adminFetch('/cafeteria', token, { method: 'DELETE', body: JSON.stringify({ action: 'delete_item', id }) });
    onRefresh();
  };

  const bulkAdd = async (categoryId: number) => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    setSaving(true);
    try {
      const parsedItems = lines.map(line => {
        const parts = line.split(/[\t,;|]/).map(p => p.trim());
        return { name: parts[0], price: parts[1] ? parseFloat(parts[1]) : null };
      });
      await adminFetch('/cafeteria', token, { method: 'POST', body: JSON.stringify({ action: 'bulk_add', category_id: categoryId, items: parsedItems }) });
      setBulkMode(null); setBulkText(''); onRefresh();
    } finally { setSaving(false); }
  };

  const replaceCategory = async (categoryId: number) => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    if (!confirm('Bu kateqoriyanın bütün elementləri silinib yeniləri ilə əvəzlənəcək. Əminsiniz?')) return;
    setSaving(true);
    try {
      const parsedItems = lines.map(line => {
        const parts = line.split(/[\t,;|]/).map(p => p.trim());
        return { name: parts[0], price: parts[1] ? parseFloat(parts[1]) : null };
      });
      await adminFetch('/cafeteria', token, { method: 'POST', body: JSON.stringify({ action: 'replace_category_items', category_id: categoryId, items: parsedItems }) });
      setBulkMode(null); setBulkText(''); onRefresh();
    } finally { setSaving(false); }
  };

  const bulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(selectedItems.size + ' element silinəcək. Əminsiniz?')) return;
    await adminFetch('/cafeteria', token, { method: 'DELETE', body: JSON.stringify({ action: 'bulk_delete', ids: [...selectedItems] }) });
    setSelectedItems(new Set()); onRefresh();
  };

  const toggleItem = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Yeməkxana Menyusu</h2>
        <div className="flex gap-3">
          {selectedItems.size > 0 && (
            <button onClick={bulkDelete} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">
              <Trash2 size={16} /> {selectedItems.size} elementi sil
            </button>
          )}
          <button onClick={() => setShowNewCat(true)} className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900">
            <Plus size={18} /> Yeni kateqoriya
          </button>
        </div>
      </div>

      {showNewCat && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Yeni kateqoriya</h3>
          <div className="flex gap-3">
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Kateqoriya adı..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue" />
            <button onClick={addCategory} disabled={saving} className="px-5 py-2.5 bg-uni-blue text-white rounded-xl font-medium disabled:opacity-50">Yarat</button>
            <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600">Ləğv et</button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {items.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => { setBulkMode(cat.id); setBulkText(''); }} className="text-sm flex items-center gap-1 text-green-600 font-medium hover:underline" title="Toplu əlavə">
                  <Plus size={14} /> Toplu
                </button>
                <button onClick={() => setAddingItem({ category_id: cat.id, name: '', price: '' })} className="text-sm flex items-center gap-1 text-uni-blue font-medium hover:underline">
                  <Plus size={14} /> Tək əlavə
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="text-sm flex items-center gap-1 text-red-500 font-medium hover:underline">
                  <Trash2 size={14} /> Sil
                </button>
              </div>
            </div>

            {bulkMode === cat.id && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Hər sətirdə bir element yazın. Qiymət üçün vergül və ya tab ilə ayırın:</p>
                <p className="text-xs text-gray-400 mb-2">Məs: Toyuq şorbası, 3.50</p>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} placeholder={"Toyuq şorbası, 3.50\nCəsar salatı, 4.00\nÇay"}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue resize-none font-mono text-sm" />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => bulkAdd(cat.id)} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Əlavə et</button>
                  <button onClick={() => replaceCategory(cat.id)} disabled={saving} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Hamısını əvəzlə</button>
                  <button onClick={() => { setBulkMode(null); setBulkText(''); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Ləğv et</button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {cat.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 px-4 rounded-xl hover:bg-gray-50">
                  <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 rounded border-gray-300 text-uni-blue" />
                  <span className="font-medium text-gray-800 flex-1">{item.name}</span>
                  <div className="flex items-center gap-4">
                    {item.price !== null && <span className="font-bold text-gray-900">{Number(item.price).toFixed(2)} &#8380;</span>}
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {cat.items.length === 0 && <p className="text-sm text-gray-400 py-2 text-center">Bu kateqoriyada element yoxdur</p>}
            </div>
          </div>
        ))}
      </div>

      {addingItem && (
        <FormModal title="Yeni menyu elementi" onClose={() => setAddingItem(null)} onSave={addSingleItem} saving={saving}>
          <Input label="Ad" value={addingItem.name} onChange={v => setAddingItem({ ...addingItem, name: v })} />
          <Input label="Qiymət (boş buraxıla bilər)" value={addingItem.price} onChange={v => setAddingItem({ ...addingItem, price: v })} type="number" />
        </FormModal>
      )}
    </div>
  );
}

// ─── Info Manager ───────────────────────────────────────
function InfoManager({ items, token, onRefresh }: { items: InfoContent[]; token: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState<InfoContent | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminFetch('/info', token, { method: 'PUT', body: JSON.stringify(editing) });
      setEditing(null); onRefresh();
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ümumi Məlumat</h2>
      <div className="space-y-4">
        {items.map(sec => (
          <div key={sec.id} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">{sec.title}</h3>
              <button onClick={() => setEditing(sec)} className="p-2 text-gray-400 hover:text-uni-blue"><Edit3 size={18} /></button>
            </div>
            <p className="text-gray-600 whitespace-pre-line">{sec.content.replace(/\|/g, '\n')}</p>
          </div>
        ))}
      </div>
      {editing && (
        <FormModal title={editing.title + ' redaktə et'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Başlıq" value={editing.title} onChange={v => setEditing({ ...editing, title: v })} />
          <TextArea label="Məzmun (| ilə sətir ayırın)" value={editing.content} onChange={v => setEditing({ ...editing, content: v })} />
        </FormModal>
      )}
    </div>
  );
}

// ─── Users Manager ──────────────────────────────────────
function UsersManager({ items, token, onRefresh, faculties }: { items: AdminUser[]; token: string; onRefresh: () => void; faculties: Faculty[] }) {
  const [editing, setEditing] = useState<Partial<AdminUser> & { password?: string; permissions?: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...editing };
      if (editing?.id) {
        await adminFetch('/users', token, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/users', token, { method: 'POST', body: JSON.stringify(payload) });
      }
      setEditing(null); onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Bu istifadəçini silmək istədiyinizə əminsiniz?')) return;
    try { await adminFetch('/users', token, { method: 'DELETE', body: JSON.stringify({ id }) }); onRefresh(); }
    catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (user: AdminUser) => {
    try { await adminFetch('/users', token, { method: 'PUT', body: JSON.stringify({ id: user.id, active: !user.active }) }); onRefresh(); }
    catch (err: any) { alert(err.message); }
  };

  const togglePerm = (perm: string) => {
    if (!editing) return;
    const current = editing.permissions || [];
    const next = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
    setEditing({ ...editing, permissions: next });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">İstifadəçilər</h2>
        <button onClick={() => setEditing({ role: 'admin', permissions: ['dashboard', 'announcements', 'faculties', 'schedules', 'events', 'cafeteria', 'info', 'feedback'] })}
          className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900">
          <Plus size={18} /> Yeni istifadəçi
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Ad</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Rol</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">İcazələr</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(u => {
              const perms: string[] = (Array.isArray(u.permissions) ? u.permissions : []) as string[];
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + (u.role === 'superadmin' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600")}>
                        {u.role === 'superadmin' ? <ShieldCheck size={18} /> : <Shield size={18} />}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={"px-3 py-1 rounded-full text-xs font-bold " + (u.role === 'superadmin' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                      {u.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.role === 'superadmin' ? (
                        <span className="text-xs text-amber-600 font-medium">Tam icazə</span>
                      ) : perms.slice(0, 3).map(p => (
                        <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}</span>
                      ))}
                      {u.role !== 'superadmin' && perms.length > 3 && <span className="text-xs text-gray-400">+{perms.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(u)} className={"px-3 py-1 rounded-full text-xs font-bold cursor-pointer " + (u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {u.active ? 'Aktiv' : 'Deaktiv'}
                    </button>
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    <button onClick={() => setEditing({ ...u, password: '', permissions: (Array.isArray(u.permissions) ? u.permissions : []) as string[] })} className="p-2 text-gray-400 hover:text-uni-blue"><Edit3 size={18} /></button>
                    <button onClick={() => remove(u.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && (
        <FormModal title={editing.id ? 'İstifadəçini redaktə et' : 'Yeni istifadəçi'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Ad" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} />
          <Input label="Email" value={editing.email || ''} onChange={v => setEditing({ ...editing, email: v })} type="email" />
          <Input label={editing.id ? 'Yeni şifrə (boş qalsa dəyişməz)' : 'Şifrə'} value={editing.password || ''} onChange={v => setEditing({ ...editing, password: v })} type="password" />
          <Select label="Rol" value={editing.role || 'admin'} onChange={v => setEditing({ ...editing, role: v })}
            options={[{ value: 'admin', label: 'Admin' }, { value: 'superadmin', label: 'Super Admin' }]} />
          {editing.role !== 'superadmin' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sidebar icazələri</label>
                <p className="text-xs text-gray-400 mb-3">İstifadəçi hansı panelləri görəcək</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.key} className={"flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors " +
                      ((editing.permissions || []).includes(p.key) ? "border-uni-blue bg-blue-50" : "border-gray-200 hover:bg-gray-50")}>
                      <input type="checkbox" checked={(editing.permissions || []).includes(p.key)} onChange={() => togglePerm(p.key)}
                        className="w-4 h-4 rounded border-gray-300 text-uni-blue" />
                      <span className="text-sm font-medium text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {faculties.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Fakültə icazələri</label>
                  <p className="text-xs text-gray-400 mb-3">Seçilməsə admin bütün fakültələr üçün elan verə bilər. Seçilirsə yalnız seçilli fakültələr üçün elan verə bilər.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {faculties.map(f => {
                      const key = `faculty_${f.id}`;
                      return (
                        <label key={key} className={"flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors " +
                          ((editing.permissions || []).includes(key) ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-gray-50")}>
                          <input type="checkbox" checked={(editing.permissions || []).includes(key)} onChange={() => togglePerm(key)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-sm font-medium text-gray-700">{f.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </FormModal>
      )}
    </div>
  );
}

/* ─── Devices Manager ────────────────────────────────── */
interface KioskDevice {
  id: number;
  device_id: string;
  name: string;
  floor: string;
  location: string;
  active: boolean;
  last_seen: string | null;
  hidden_sections: string[];
  created_at: string;
}

const SECTION_OPTIONS = [
  { key: 'announcements', label: 'Elanlar' },
  { key: 'faculties', label: 'Fakültələr' },
  { key: 'events', label: 'Tədbirlər' },
  { key: 'cafeteria', label: 'Yeməkxana' },
  { key: 'info', label: 'Məlumat' },
];

function DevicesManager({ token }: { token: string }) {
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<KioskDevice | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<KioskDevice[]>('/settings?action=devices', token);
      setDevices(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    await adminFetch('/settings?action=devices', token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id,
        name: editing.name,
        floor: editing.floor,
        location: editing.location,
        active: editing.active,
        hidden_sections: editing.hidden_sections,
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Bu cihazı silmək istəyirsiniz?')) return;
    await adminFetch('/settings?action=devices', token, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 60000;
  };

  const toggleSection = (section: string) => {
    if (!editing) return;
    const hs = editing.hidden_sections || [];
    setEditing({
      ...editing,
      hidden_sections: hs.includes(section) ? hs.filter(s => s !== section) : [...hs, section],
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-uni-blue" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Kiosk cihazları</h2>
        <p className="text-sm text-gray-500">{devices.length} cihaz qeydiyyatda</p>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Monitor size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Hələ heç bir kiosk qoşulmayıb</p>
          <p className="text-sm mt-1">Electron proqramı işə düşdükdə cihazlar avtomatik qeydiyyatdan keçəcək</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={"w-3 h-3 rounded-full " + (isOnline(d.last_seen) ? "bg-green-400" : "bg-gray-300")} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.name || 'Adsız kiosk'}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.floor && `Mərtəbə ${d.floor}`}{d.floor && d.location && ' · '}{d.location}
                      {!d.floor && !d.location && d.device_id.slice(0, 8) + '...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"text-xs px-2 py-1 rounded-full font-medium " + (d.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
                    {d.active ? 'Aktiv' : 'Dayandırılıb'}
                  </span>
                  <button onClick={() => setEditing({ ...d, hidden_sections: d.hidden_sections || [] })}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"><Edit3 size={16} /></button>
                  <button onClick={() => remove(d.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
              {d.hidden_sections && d.hidden_sections.length > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {d.hidden_sections.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                      {SECTION_OPTIONS.find(o => o.key === s)?.label || s} gizli
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-300 mt-3">
                Son görülmə: {d.last_seen ? new Date(d.last_seen).toLocaleString('az-AZ') : 'heç vaxt'}
              </p>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <FormModal title="Kiosku redaktə et" onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Cihaz adı" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} />
          <Input label="Mərtəbə" value={editing.floor || ''} onChange={v => setEditing({ ...editing, floor: v })} />
          <Input label="Yer" value={editing.location || ''} onChange={v => setEditing({ ...editing, location: v })} />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <label className={"flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors " +
              (editing.active ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50")}>
              <input type="checkbox" checked={editing.active} onChange={() => setEditing({ ...editing, active: !editing.active })}
                className="w-4 h-4 rounded border-gray-300 text-green-600" />
              <span className="text-sm font-medium text-gray-700">{editing.active ? 'Aktiv' : 'Dayandırılıb'}</span>
            </label>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Gizli bölmələr</label>
            <p className="text-xs text-gray-400 mb-3">Bu kiosk-da göstərilməyəcək bölmələr</p>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_OPTIONS.map(s => (
                <label key={s.key} className={"flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors " +
                  (editing.hidden_sections.includes(s.key) ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:bg-gray-50")}>
                  <input type="checkbox" checked={editing.hidden_sections.includes(s.key)} onChange={() => toggleSection(s.key)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}

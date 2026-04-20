import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { adminFetch, apiFetch } from '../shared/api';
import type { Announcement, Exam, Event as KioskEvent, CafeteriaCategory, InfoContent } from '../shared/types';
import {
  LogOut, Bell, Clock, CalendarDays, Coffee, Info, Plus, Trash2, Edit3, Save, X, ChevronRight, GraduationCap, LayoutDashboard, Loader2
} from 'lucide-react';

type Tab = 'dashboard' | 'announcements' | 'exams' | 'events' | 'cafeteria' | 'info';

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [events, setEvents] = useState<KioskEvent[]>([]);
  const [cafeteria, setCafeteria] = useState<CafeteriaCategory[]>([]);
  const [info, setInfo] = useState<InfoContent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [a, ex, ev, c, i] = await Promise.all([
      apiFetch<Announcement[]>('/announcements'),
      apiFetch<Exam[]>('/exams'),
      apiFetch<KioskEvent[]>('/events'),
      apiFetch<CafeteriaCategory[]>('/cafeteria'),
      apiFetch<InfoContent[]>('/info'),
    ]);
    setAnnouncements(a); setExams(ex); setEvents(ev); setCafeteria(c); setInfo(i);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: 'Panel', icon: <LayoutDashboard size={20} /> },
    { key: 'announcements', label: 'Elanlar', icon: <Bell size={20} />, count: announcements.length },
    { key: 'exams', label: 'İmtahanlar', icon: <Clock size={20} />, count: exams.length },
    { key: 'events', label: 'Tədbirlər', icon: <CalendarDays size={20} />, count: events.length },
    { key: 'cafeteria', label: 'Yeməkxana', icon: <Coffee size={20} /> },
    { key: 'info', label: 'Məlumat', icon: <Info size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-uni-blue rounded-xl flex items-center justify-center"><GraduationCap size={22} className="text-uni-gold" /></div>
            <div><h1 className="font-bold text-uni-blue text-lg">UniKiosk</h1><p className="text-xs text-gray-400">Admin Panel</p></div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-uni-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.icon}<span>{t.label}</span>
              {t.count !== undefined && <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-gray-200'}`}>{t.count}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={20} /><span>Çıxış</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-uni-blue" /></div>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardView announcements={announcements} exams={exams} events={events} onNavigate={setTab} />}
            {tab === 'announcements' && <AnnouncementsManager items={announcements} token={token!} onRefresh={loadAll} />}
            {tab === 'exams' && <ExamsManager items={exams} token={token!} onRefresh={loadAll} />}
            {tab === 'events' && <EventsManager items={events} token={token!} onRefresh={loadAll} />}
            {tab === 'cafeteria' && <CafeteriaManager items={cafeteria} token={token!} onRefresh={loadAll} />}
            {tab === 'info' && <InfoManager items={info} token={token!} onRefresh={loadAll} />}
          </>
        )}
      </main>
    </div>
  );
}

// Dashboard
function DashboardView({ announcements, exams, events, onNavigate }: { announcements: Announcement[]; exams: Exam[]; events: KioskEvent[]; onNavigate: (t: Tab) => void }) {
  const stats = [
    { label: 'Elanlar', count: announcements.length, icon: <Bell size={24} />, color: 'bg-red-50 text-red-600', tab: 'announcements' as Tab },
    { label: 'İmtahanlar', count: exams.length, icon: <Clock size={24} />, color: 'bg-blue-50 text-blue-600', tab: 'exams' as Tab },
    { label: 'Tədbirlər', count: events.length, icon: <CalendarDays size={24} />, color: 'bg-green-50 text-green-600', tab: 'events' as Tab },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">İdarəetmə Paneli</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {stats.map(s => (
          <button key={s.label} onClick={() => onNavigate(s.tab)} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow text-left">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>{s.icon}</div>
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
              <div className={`w-3 h-3 rounded-full ${a.importance === 'high' ? 'bg-red-500' : a.importance === 'medium' ? 'bg-amber-500' : 'bg-gray-400'}`} />
              <span className="font-medium text-gray-800 flex-1">{a.title}</span>
              <span className="text-sm text-gray-400">{a.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic CRUD helpers
function FormModal({ title, children, onClose, onSave, saving }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
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

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-uni-blue transition-colors resize-none" />
    </div>
  );
}

// Announcements Manager
function AnnouncementsManager({ items, token, onRefresh }: { items: Announcement[]; token: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (editing?.id) {
        await adminFetch('/announcements', token, { method: 'PUT', body: JSON.stringify(editing) });
      } else {
        await adminFetch('/announcements', token, { method: 'POST', body: JSON.stringify(editing) });
      }
      setEditing(null);
      onRefresh();
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    await adminFetch('/announcements', token, { method: 'DELETE', body: JSON.stringify({ id }) });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Elanlar</h2>
        <button onClick={() => setEditing({ importance: 'low', type: 'Məlumat' })} className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900">
          <Plus size={18} /> Yeni elan
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Başlıq</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tip</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Vaciblik</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tarix</th><th className="px-6 py-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{a.title}</td>
                <td className="px-6 py-4 text-gray-500">{a.type}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${a.importance === 'high' ? 'bg-red-100 text-red-700' : a.importance === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{a.importance}</span></td>
                <td className="px-6 py-4 text-gray-500">{a.date}</td>
                <td className="px-6 py-4 flex gap-2 justify-end">
                  <button onClick={() => setEditing(a)} className="p-2 text-gray-400 hover:text-uni-blue"><Edit3 size={18} /></button>
                  <button onClick={() => remove(a.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <FormModal title={editing.id ? 'Elanı redaktə et' : 'Yeni elan'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Başlıq" value={editing.title || ''} onChange={v => setEditing({ ...editing, title: v })} />
          <TextArea label="Təsvir" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} />
          <Input label="Tip" value={editing.type || ''} onChange={v => setEditing({ ...editing, type: v })} />
          <Select label="Vaciblik" value={editing.importance || 'low'} onChange={v => setEditing({ ...editing, importance: v as any })} options={[{ value: 'high', label: 'Yüksək' }, { value: 'medium', label: 'Orta' }, { value: 'low', label: 'Aşağı' }]} />
          <Input label="Tarix" value={editing.date || ''} onChange={v => setEditing({ ...editing, date: v })} />
        </FormModal>
      )}
    </div>
  );
}

// Exams Manager
function ExamsManager({ items, token, onRefresh }: { items: Exam[]; token: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Partial<Exam> | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (editing?.id) {
        await adminFetch('/exams', token, { method: 'PUT', body: JSON.stringify(editing) });
      } else {
        await adminFetch('/exams', token, { method: 'POST', body: JSON.stringify(editing) });
      }
      setEditing(null); onRefresh();
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    await adminFetch('/exams', token, { method: 'DELETE', body: JSON.stringify({ id }) });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">İmtahanlar</h2>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900"><Plus size={18} /> Yeni imtahan</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Fənn</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Fakültə</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Qrup</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tarix</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Saat</th><th className="px-6 py-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{e.subject}</td>
                <td className="px-6 py-4 text-gray-500">{e.faculty}</td>
                <td className="px-6 py-4 text-gray-500">{e.group_number}</td>
                <td className="px-6 py-4 text-gray-500">{e.exam_date} {e.exam_month}</td>
                <td className="px-6 py-4 text-gray-500">{e.time_slot}</td>
                <td className="px-6 py-4 flex gap-2 justify-end">
                  <button onClick={() => setEditing(e)} className="p-2 text-gray-400 hover:text-uni-blue"><Edit3 size={18} /></button>
                  <button onClick={() => remove(e.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <FormModal title={editing.id ? 'İmtahanı redaktə et' : 'Yeni imtahan'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Fənn" value={editing.subject || ''} onChange={v => setEditing({ ...editing, subject: v })} />
          <Input label="Fakültə" value={editing.faculty || ''} onChange={v => setEditing({ ...editing, faculty: v })} />
          <Input label="Qrup nömrəsi" value={editing.group_number || ''} onChange={v => setEditing({ ...editing, group_number: v })} />
          <Input label="Otaq" value={editing.room || ''} onChange={v => setEditing({ ...editing, room: v })} />
          <Input label="Saat aralığı" value={editing.time_slot || ''} onChange={v => setEditing({ ...editing, time_slot: v })} placeholder="10:00 - 12:00" />
          <Input label="Gün" value={editing.exam_date || ''} onChange={v => setEditing({ ...editing, exam_date: v })} placeholder="15" />
          <Input label="Ay" value={editing.exam_month || ''} onChange={v => setEditing({ ...editing, exam_month: v })} placeholder="May" />
        </FormModal>
      )}
    </div>
  );
}

// Events Manager
function EventsManager({ items, token, onRefresh }: { items: KioskEvent[]; token: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Partial<KioskEvent> | null>(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tədbirlər</h2>
        <button onClick={() => setEditing({ type: 'Konfrans' })} className="flex items-center gap-2 px-4 py-2.5 bg-uni-blue text-white rounded-xl font-medium hover:bg-blue-900"><Plus size={18} /> Yeni tədbir</button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {items.map(ev => (
          <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full text-gray-600">{ev.type}</span></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{ev.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{ev.date} • {ev.time_slot} • {ev.location}</p>
              <div className="flex gap-2">
                <button onClick={() => setEditing(ev)} className="flex-1 px-4 py-2 text-sm font-medium text-uni-blue bg-blue-50 rounded-xl hover:bg-blue-100 flex items-center justify-center gap-1"><Edit3 size={14} /> Redaktə</button>
                <button onClick={() => remove(ev.id)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <FormModal title={editing.id ? 'Tədbiri redaktə et' : 'Yeni tədbir'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Başlıq" value={editing.title || ''} onChange={v => setEditing({ ...editing, title: v })} />
          <TextArea label="Təsvir" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} />
          <Input label="Tarix" value={editing.date || ''} onChange={v => setEditing({ ...editing, date: v })} placeholder="20 May" />
          <Input label="Saat" value={editing.time_slot || ''} onChange={v => setEditing({ ...editing, time_slot: v })} placeholder="10:00 - 18:00" />
          <Input label="Məkan" value={editing.location || ''} onChange={v => setEditing({ ...editing, location: v })} />
          <Input label="Tip" value={editing.type || ''} onChange={v => setEditing({ ...editing, type: v })} />
          <Input label="Şəkil URL" value={editing.image_url || ''} onChange={v => setEditing({ ...editing, image_url: v })} />
        </FormModal>
      )}
    </div>
  );
}

// Cafeteria Manager
function CafeteriaManager({ items, token, onRefresh }: { items: CafeteriaCategory[]; token: string; onRefresh: () => void }) {
  const [editingItem, setEditingItem] = useState<{ category_id: number; name: string; price: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const addItem = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await adminFetch('/cafeteria', token, { method: 'POST', body: JSON.stringify({ action: 'add_item', ...editingItem, price: editingItem.price ? parseFloat(editingItem.price) : null }) });
      setEditingItem(null); onRefresh();
    } finally { setSaving(false); }
  };

  const removeItem = async (id: number) => {
    await adminFetch('/cafeteria', token, { method: 'DELETE', body: JSON.stringify({ action: 'delete_item', id }) });
    onRefresh();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Yeməkxana Menyusu</h2>
      <div className="space-y-6">
        {items.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
              <button onClick={() => setEditingItem({ category_id: cat.id, name: '', price: '' })} className="text-sm flex items-center gap-1 text-uni-blue font-medium hover:underline"><Plus size={16} /> Əlavə et</button>
            </div>
            <div className="space-y-2">
              {cat.items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 px-4 rounded-xl hover:bg-gray-50">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <div className="flex items-center gap-4">
                    {item.price !== null && <span className="font-bold text-gray-900">{Number(item.price).toFixed(2)} ₼</span>}
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {editingItem && (
        <FormModal title="Yeni menyu elementi" onClose={() => setEditingItem(null)} onSave={addItem} saving={saving}>
          <Input label="Ad" value={editingItem.name} onChange={v => setEditingItem({ ...editingItem, name: v })} />
          <Input label="Qiymət (boş buraxıla bilər)" value={editingItem.price} onChange={v => setEditingItem({ ...editingItem, price: v })} type="number" />
        </FormModal>
      )}
    </div>
  );
}

// Info Manager
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
        <FormModal title={`${editing.title} redaktə et`} onClose={() => setEditing(null)} onSave={save} saving={saving}>
          <Input label="Başlıq" value={editing.title} onChange={v => setEditing({ ...editing, title: v })} />
          <TextArea label="Məzmun (| ilə sətir ayırın)" value={editing.content} onChange={v => setEditing({ ...editing, content: v })} />
        </FormModal>
      )}
    </div>
  );
}

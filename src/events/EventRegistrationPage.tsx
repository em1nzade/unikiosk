import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Loader2, Send, UserPlus } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { formatDisplayDate } from '../shared/dateFormat';
import type { Event as KioskEvent } from '../shared/types';

export default function EventRegistrationPage() {
  const { eventId } = useParams();
  const numericEventId = Number(eventId);
  const [event, setEvent] = useState<KioskEvent | null>(null);
  const [fullName, setFullName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiFetch<KioskEvent>(`/events?id=${numericEventId}`)
      .then(data => {
        if (!data || Array.isArray(data) || typeof data.id !== 'number') {
          throw new Error('Tədbir tapılmadı');
        }
        if (!cancelled) setEvent(data);
      })
      .catch((err: any) => { if (!cancelled) setError(err.message || 'Tədbir tapılmadı'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [numericEventId]);

  const submit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!event) return;
    setError('');
    setSaving(true);
    try {
      await apiFetch('/event-registrations', {
        method: 'POST',
        body: JSON.stringify({ event_id: event.id, full_name: fullName, group_name: groupName }),
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Qeydiyyat alınmadı');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-uni-light">
        <Loader2 size={36} className="animate-spin text-uni-blue" />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-uni-light px-5 py-8">
        <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={44} />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-uni-blue">Qeydiyyat tamamlandı</h1>
          <p className="text-base leading-7 text-gray-600">Adınız bu tədbirin iştirakçı siyahısına əlavə olundu.</p>
        </div>
      </div>
    );
  }

  if (!event || error) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-uni-light px-5 py-8">
        <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center text-center">
          <h1 className="mb-3 text-3xl font-bold text-uni-blue">Qeydiyyat mümkün deyil</h1>
          <p className="text-base leading-7 text-gray-600">{error || 'Tədbir tapılmadı'}</p>
        </div>
      </div>
    );
  }

  const registrationClosed = event.registration_enabled === false;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-uni-light px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-7">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-uni-blue text-white">
            <UserPlus size={28} />
          </div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-gray-500 shadow-sm">
            <CalendarDays size={16} /> {formatDisplayDate(event.date)} · {event.time_slot}
          </p>
          <h1 className="text-3xl font-bold leading-tight text-uni-blue">{event.title}</h1>
          <p className="mt-2 text-base leading-7 text-gray-600">{event.location}</p>
        </div>

        {registrationClosed ? (
          <div className="rounded-3xl border border-amber-100 bg-white p-5 text-center shadow-xl shadow-slate-200/60">
            <p className="text-lg font-bold text-amber-700">Bu tədbir üçün qeydiyyat bağlıdır.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl shadow-slate-200/60">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Ad Soyad</label>
            <input
              value={fullName}
              onChange={changeEvent => setFullName(changeEvent.target.value)}
              maxLength={120}
              required
              className="mb-4 w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-uni-blue"
              placeholder="Məsələn: Aysel Məmmədova"
            />

            <label className="mb-2 block text-sm font-semibold text-gray-700">Qrup</label>
            <input
              value={groupName}
              onChange={changeEvent => setGroupName(changeEvent.target.value)}
              maxLength={80}
              required
              className="mb-5 w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-uni-blue"
              placeholder="Məsələn: TT-23"
            />

            {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={saving || fullName.trim().length < 3 || groupName.trim().length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-uni-blue px-5 py-4 text-base font-bold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              Qeydiyyatdan keç
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { CheckCircle2, Loader2, MessageSquare, Send } from 'lucide-react';
import { apiFetch } from '../shared/api';

type FeedbackCategory = 'teklif' | 'irad';

export default function FeedbackPage() {
  const [category, setCategory] = useState<FeedbackCategory>('teklif');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ category, message, name, contact }),
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Mesaj göndərilmədi');
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-uni-light px-5 py-8">
        <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={44} />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-uni-blue">Mesajınız göndərildi</h1>
          <p className="text-base leading-7 text-gray-600">
            Təklif və ya iradınız administrasiya panelində görünəcək. Təşəkkür edirik.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-uni-light px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-7">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-uni-blue text-white">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-3xl font-bold text-uni-blue">Təklif və iradlar</h1>
          <p className="mt-2 text-base leading-7 text-gray-600">
            Mesajınızı telefondan rahat yazıb göndərə bilərsiniz.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl shadow-slate-200/60">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
            {[
              { key: 'teklif' as const, label: 'Təklif' },
              { key: 'irad' as const, label: 'İrad' },
            ].map(option => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCategory(option.key)}
                className={"rounded-xl px-4 py-3 text-sm font-bold transition-colors " +
                  (category === option.key ? "bg-white text-uni-blue shadow-sm" : "text-gray-500")}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="mb-2 block text-sm font-semibold text-gray-700">Mesaj</label>
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            rows={7}
            maxLength={2000}
            required
            placeholder="Təklifinizi və ya iradınızı yazın..."
            className="mb-4 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-uni-blue"
          />

          <label className="mb-2 block text-sm font-semibold text-gray-700">Ad Soyad (istəyə bağlı)</label>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            maxLength={100}
            className="mb-4 w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-uni-blue"
            placeholder="Adınızı yazın"
          />

          <label className="mb-2 block text-sm font-semibold text-gray-700">Əlaqə (istəyə bağlı)</label>
          <input
            value={contact}
            onChange={event => setContact(event.target.value)}
            maxLength={120}
            className="mb-5 w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-uni-blue"
            placeholder="Telefon və ya e-poçt"
          />

          {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={saving || message.trim().length < 3}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-uni-blue px-5 py-4 text-base font-bold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            Göndər
          </button>
        </form>
      </div>
    </div>
  );
}

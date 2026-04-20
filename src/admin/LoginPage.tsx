import { useState } from 'react';
import { useAuth } from './AuthContext';
import { GraduationCap, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-uni-gold/20 rounded-2xl flex items-center justify-center mb-6">
            <GraduationCap size={40} className="text-uni-gold" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">UniKiosk Admin</h1>
          <p className="text-blue-300 text-sm">Kiosk idarəetmə paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-blue-200 mb-2 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 outline-none focus:border-uni-gold transition-colors"
              placeholder="admin@bsu.edu.az" />
          </div>
          <div>
            <label className="text-sm font-medium text-blue-200 mb-2 block">Şifrə</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 outline-none focus:border-uni-gold transition-colors"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-uni-gold hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
            <span>{loading ? 'Giriş edilir...' : 'Daxil ol'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

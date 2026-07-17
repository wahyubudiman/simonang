import React, { useState } from 'react';
import { Key, User, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Autentikasi gagal');
      }

      // Save token and user details to local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] px-4 relative overflow-hidden">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glassmorphism p-8 rounded-2xl relative z-10">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-xl mb-3 border border-cyan-500/20">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">⚡</span>
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Si Monang
          </h2>
          <p className="text-xs text-cyan-400/80 tracking-widest uppercase mt-1">
            Innovation Gateway 2027
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <ShieldAlert className="text-red-400 shrink-0 w-5 h-5 mt-0.5" />
            <span className="text-sm text-red-200">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0d1527] border border-white/5 rounded-xl focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-white placeholder-slate-600 outline-none text-sm transition-all"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0d1527] border border-white/5 rounded-xl focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-white placeholder-slate-600 outline-none text-sm transition-all"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Masuk...' : 'Masuk Aplikasi'}
          </button>
        </form>

        {/* Demo Accounts List for quick test */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3 text-center">
            Akun Percobaan (Demo Roles / RBAC)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('perencanaan', 'ren123')}
              className="p-2.5 bg-[#0d1527] border border-white/5 hover:border-cyan-500/30 hover:bg-[#111c34] rounded-lg text-left text-slate-300 transition-all"
            >
              <div className="font-bold text-cyan-400">User Perencanaan</div>
              <div className="text-[10px] text-slate-500">Role: PERENCANAAN</div>
            </button>
            <button
              onClick={() => handleQuickLogin('keuangan', 'keu123')}
              className="p-2.5 bg-[#0d1527] border border-white/5 hover:border-cyan-500/30 hover:bg-[#111c34] rounded-lg text-left text-slate-300 transition-all"
            >
              <div className="font-bold text-cyan-400">User Keuangan</div>
              <div className="text-[10px] text-slate-500">Role: KEUANGAN</div>
            </button>
            <button
              onClick={() => handleQuickLogin('manajer', 'boss123')}
              className="p-2.5 bg-[#0d1527] border border-white/5 hover:border-cyan-500/30 hover:bg-[#111c34] rounded-lg text-left text-slate-300 transition-all"
            >
              <div className="font-bold text-cyan-400">User Manajer</div>
              <div className="text-[10px] text-slate-500">Role: MANAJER</div>
            </button>
            <button
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="p-2.5 bg-[#0d1527] border border-white/5 hover:border-cyan-500/30 hover:bg-[#111c34] rounded-lg text-left text-slate-300 transition-all"
            >
              <div className="font-bold text-cyan-400">Super Admin</div>
              <div className="text-[10px] text-slate-500">Role: ADMIN</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

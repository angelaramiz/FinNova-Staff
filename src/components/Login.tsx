import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, RefreshCw, Key, ShieldCheck, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onLoginSuccess: (token: string, profile: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seeded mock account options for easy bypass
  const mockAccounts = [
    { email: 'admin@finnova.academy', label: 'Administrador Master', role: 'Administrador' },
    { email: 'profesor.senior@finanzas.edu', label: 'Profe Finanzas Senior', role: 'Instructor' }
  ];

  // Check if real Supabase environment variables are configured
  const isRealSupabaseConfigured = 
    import.meta.env.SUPABASE_URL && 
    !import.meta.env.SUPABASE_URL.includes('placeholder') &&
    import.meta.env.SUPABASE_ANON_KEY &&
    !import.meta.env.SUPABASE_ANON_KEY.includes('placeholder');

  // Parse authorization errors returned by Supabase triggers in the URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errDescription = params.get('error_description');
    const errCode = params.get('error');
    
    if (errDescription || errCode) {
      const displayMsg = errDescription || errCode || 'Error de autenticación';
      setError(decodeURIComponent(displayMsg.replace(/\+/g, ' ')));
      // Clean query parameters from URL silently
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleRealGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!isRealSupabaseConfigured) {
        throw new Error('Supabase no está configurado en las variables de entorno locales.');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el flujo de Google OAuth.');
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo institucional de personal.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await api.loginSimulated(email.trim());
      onLoginSuccess(response.token, response.profile);
    } catch (err: any) {
      setError(err.message || 'Error al validar las credenciales de personal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMock = async (mockEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.loginSimulated(mockEmail);
      onLoginSuccess(response.token, response.profile);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con la cuenta piloto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="staff-login-view" className="min-h-screen bg-[#060b16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2">
          <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-2xl text-indigo-400 shadow-lg">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-xl font-extrabold text-slate-100 tracking-wide">
          FINNOVA ACADEMY
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Portal del Personal Docente y Administrativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0a0f1d]/80 border border-slate-800/60 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-200">Acceso del Staff</h3>
            <p className="text-[11px] text-slate-500">
              Registrado previamente por el panel central de administración.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-455 p-3 rounded-2xl text-[11px] flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Active production Google OAuth Login button */}
          <div className="space-y-3">
            <button
              onClick={handleRealGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition duration-150 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              )}
              Iniciar Sesión con Google
            </button>
            
            {!isRealSupabaseConfigured && (
              <p className="text-[9px] text-center text-slate-500 font-mono">
                * Nota: El entorno no cuenta con credenciales de Google OAuth. Usa el simulador de abajo.
              </p>
            )}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-850/60"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-mono uppercase">O</span>
            <div className="flex-grow border-t border-slate-850/60"></div>
          </div>

          {/* Sandbox email validator */}
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="email" className="block text-[10px] font-mono uppercase text-slate-450 mb-1.5">
                Bypass Sandbox: Validar por correo electrónico
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-650" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. admin@finnova.academy"
                  className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition font-normal"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-305 bg-slate-900/40 hover:bg-slate-900/90 transition duration-150 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                Validar Acceso (Simulación Local)
              </button>
            </div>
          </form>

          {/* Sandbox Developer Bypass */}
          <div className="pt-4 border-t border-slate-850/60 space-y-2.5">
            <div className="flex items-center gap-1.5 text-teal-400">
              <Key className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
                Bypass de Desarrollo (Personal)
              </span>
            </div>
            <div className="space-y-2">
              {mockAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelectMock(acc.email)}
                  disabled={loading}
                  className="w-full text-left bg-slate-900/30 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-800 p-2.5 rounded-xl transition cursor-pointer flex justify-between items-center group"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-slate-350 block group-hover:text-indigo-455 transition">
                      {acc.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      {acc.email}
                    </span>
                  </div>
                  <span className="bg-teal-500/10 border border-teal-500/20 text-teal-305 text-[8px] px-1.5 py-0.5 rounded-md font-mono">
                    {acc.role === 'Administrador' ? 'Admin' : 'Docente'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

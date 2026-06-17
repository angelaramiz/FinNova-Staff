import React, { useState } from 'react';
import { api } from '../lib/api';
import { ClipboardCheck, ArrowLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function RegisterRequest() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.submitRegisterRequest({
        fullName: fullName.trim(),
        email: email.trim(),
        role: 'instructor', // Strictly Instructor/Staff Request
        specialty: specialty.trim() || undefined,
      });
      setSuccess(true);
      setFullName('');
      setEmail('');
      setSpecialty('');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-request-view" className="min-h-screen bg-[#060b16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background radial gradients for glassmorphism vibes */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex justify-center items-center p-3 bg-slate-900 border border-slate-800/80 rounded-2xl text-indigo-400 shadow-xl mb-4">
          <ClipboardCheck className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-wide">
          AuraFi Academy
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Solicitud de Alta de Personal Docente / Staff
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0a0f1d]/80 border border-slate-800/60 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-850/60">
            <a
              href="/"
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Acceso
            </a>
            <span className="text-[10px] text-slate-500 font-mono">Portal de Staff</span>
          </div>

          {success ? (
            <div className="space-y-4 text-center py-6 animate-fade-in">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200">¡Solicitud Enviada con Éxito!</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  El administrador ha recibido tu petición en la pestaña de <strong>"Gestor de Cuentas"</strong>. Una vez aprobada tu cuenta de instructor, recibirás tus credenciales de acceso por correo.
                </p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Enviar otra Solicitud
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="text-center space-y-1">
                <p className="text-[11px] text-slate-400">
                  Rellena los campos para solicitar tu credencial de acceso como instructor o docente de la academia.
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/5 border border-rose-500/20 text-rose-455 p-3 rounded-2xl text-[11px] flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Lic. Carlos Andrés Fuentes"
                  className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                  Correo Electrónico Propuesto
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: carlos.fuentes@finanzas.edu"
                  className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                  Materia / Especialidad (Opcional)
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Finanzas Corporativas / Trading de Opciones"
                  className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Enviar Solicitud de Instructor'
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

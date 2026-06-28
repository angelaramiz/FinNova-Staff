import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, RefreshCw, Key, ShieldCheck, Mail, Sparkles, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onLoginSuccess: (token: string, profile: any) => void;
  backendWarming?: boolean;
}

export default function Login({ onLoginSuccess, backendWarming = false }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'login' | 'force-change' | 'otp' | 'reset'>('login');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (step === 'otp') {
      setResendTimer(60); // Inicia cuenta regresiva de 60 segundos
    }
  }, [step]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      if (password) {
        await api.loginWithCredentials(email.trim(), password);
      } else {
        await api.requestPasswordReset(email.trim());
      }
      setInfoMessage('Código OTP reenviado con éxito.');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el código OTP.');
    } finally {
      setLoading(false);
    }
  };



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
    setInfoMessage(null);
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
    setInfoMessage(null);
    setLoading(true);

    try {
      if (!password) {
        setError('Por favor, ingresa tu contraseña.');
        setLoading(false);
        return;
      }
      const response = await api.loginWithCredentials(email.trim(), password);
      if (response.status === 'MUST_CHANGE_PASSWORD') {
        setStep('force-change');
      } else if (response.status === 'OTP_REQUIRED') {
        setStep('otp');
      } else if (response.token && response.profile) {
        onLoginSuccess(response.token, response.profile);
      }
    } catch (err: any) {
      setError(err.message || 'Error al validar las credenciales de personal.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.forceChangePassword({
        email: email.trim(),
        currentTempPassword: otpCode || password,
        newPassword
      });
      localStorage.removeItem('supabase_auth_token');
      setPassword(newPassword);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('login');
      setInfoMessage('Contraseña temporal actualizada con éxito. Inicia sesión con tus nuevas credenciales.');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña temporal.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Por favor ingresa el código OTP.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await api.verifyOtp({
        email: email.trim(),
        otpCode: otpCode.trim()
      });
      // Si la verificación es exitosa y requiere cambiar contraseña (por reset)
      if (response.profile?.mustChangePassword) {
        if (response.token) {
          localStorage.setItem('supabase_auth_token', response.token);
        }
        setStep('force-change');
      } else {
        onLoginSuccess(response.token, response.profile);
      }
    } catch (err: any) {
      setError(err.message || 'Código OTP inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo institucional.');
      return;
    }
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await api.requestPasswordReset(email.trim());
      if (res && res.status === 'ADMIN_APPROVAL_REQUIRED') {
        setInfoMessage(res.message || 'Solicitud de recuperación registrada ante el administrador.');
        setStep('login');
      } else {
        setInfoMessage('Código de recuperación enviado. Revisa tu correo e ingresa el código OTP aquí.');
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el código de recuperación.');
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
        <h2 className="mt-4 text-center text-xl font-extrabold text-slate-100 tracking-wide font-sans">
          FINNOVA ACADEMY
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Portal del Personal Docente y Administrativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0a0f1d]/80 border border-slate-800/60 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
          
          {backendWarming && (
            <div className="bg-amber-500/5 border border-amber-500/20 text-amber-450 p-3 rounded-2xl text-[11px] flex items-start gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
              <span>
                Conectando al servidor en la nube (despertando servicio de pruebas)... Esto puede demorar hasta 1 minuto. Por favor, espera.
              </span>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-450 p-3 rounded-2xl text-[11px] flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl text-[11px] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'login' && (
            <>
              <div className="text-center space-y-1 pt-2">
                <h3 className="text-xs font-bold text-slate-200">
                  Acceso Seguro con Contraseña
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Ingresa tus credenciales de staff. Se enviará un OTP por correo.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label htmlFor="email" className="block text-[10px] font-mono uppercase text-slate-450 mb-1.5">
                    Correo Institucional
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
                      className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-[10px] font-mono uppercase text-slate-450 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-slate-650" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('reset');
                        setError(null);
                        setInfoMessage(null);
                      }}
                      className="text-[11px] font-medium text-indigo-400 hover:text-indigo-355 transition cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || backendWarming}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-955 text-xs font-extrabold rounded-xl shadow-md transition duration-150 cursor-pointer disabled:opacity-50"
                  >
                    {backendWarming ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Despertando Servidor...
                      </>
                    ) : loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>
                </div>
              </form>

              {/* OAuth Google flow fallback */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-850/60"></div>
                <span className="flex-shrink mx-3 text-[9px] text-slate-600 font-mono uppercase">O ingresar con</span>
                <div className="flex-grow border-t border-slate-850/60"></div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleRealGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Google OAuth
                </button>
              </div>
            </>
          )}

          {step === 'reset' && (
            /* Request Password Reset Form */
            <form className="space-y-4 animate-fade-in" onSubmit={handleResetRequestSubmit}>
              <div className="text-center space-y-1.5">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-450 text-indigo-400">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-200">Recuperar Contraseña</h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Ingresa tu correo institucional de personal y te enviaremos un código OTP para restablecer tu contraseña.
                </p>
              </div>

              <div>
                <label htmlFor="reset-email" className="block text-[10px] font-mono uppercase text-slate-450 mb-1.5">
                  Correo Institucional
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-650" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. admin@finnova.academy"
                    className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="flex-1 py-2 px-4 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-900 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-955 text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Enviar Código'}
                </button>
              </div>
            </form>
          )}

          {step === 'force-change' && (
            /* Obligatory password change screen */
            <form className="space-y-4 animate-fade-in" onSubmit={handleForceChangePasswordSubmit}>
              <div className="text-center space-y-1.5">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Lock className="h-5 w-5 animate-bounce" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 font-sans">Configurar Nueva Contraseña</h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Ingresa tu nueva contraseña definitiva de acceso.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-450 mb-1.5">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-450 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="block w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-655 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError(null);
                    localStorage.removeItem('supabase_auth_token');
                  }}
                  className="flex-1 py-2 px-4 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-900 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-955 text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            /* OTP Verification Screen */
            <form className="space-y-5 animate-fade-in" onSubmit={handleOtpSubmit}>
              <div className="text-center space-y-1.5">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <ShieldCheck className="h-5 w-5 animate-pulse" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 font-sans">Verificación OTP Requerida</h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Hemos enviado un código OTP de 6 dígitos a tu correo.
                </p>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 p-2.5 rounded-xl text-[10px] leading-normal flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-450" />
                <span>
                  <strong>Seguridad de la Cuenta:</strong> Por motivos de seguridad institucional, cada vez que inicies sesión en la plataforma se te enviará un nuevo código de verificación OTP a tu correo registrado.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-450 mb-1.5">
                  Código de Verificación OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="ej. 123456"
                  className="block w-full text-center bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2.5 text-base font-bold font-mono tracking-[0.5em] text-indigo-400 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition placeholder-slate-700"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setOtpCode('');
                    setError(null);
                  }}
                  className="flex-1 py-2 px-4 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-900 transition cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-955 text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  Verificar Código
                </button>
              </div>

              <div className="text-center pt-2">
                {resendTimer > 0 ? (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Reenviar código en {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-350 transition cursor-pointer"
                  >
                    ¿No recibiste el código? Reenviar código
                  </button>
                )}
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

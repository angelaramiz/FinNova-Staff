import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  FileText, 
  Sliders, 
  Download, 
  Search, 
  TrendingUp, 
  Cpu, 
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  Check
} from 'lucide-react';
import { api } from '../lib/api';

interface AuditLog {
  id: string;
  timestamp: string;
  actionType: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED';
  output: string;
}

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  verifiedIdentity: boolean;
  points: number;
}

export default function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState('');

  // Allowed emails state
  const [allowedEmails, setAllowedEmails] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [newFullName, setNewFullName] = useState('');
  const [allowedLoading, setAllowedLoading] = useState(false);
  const [allowedError, setAllowedError] = useState<string | null>(null);
  const [allowedSuccess, setAllowedSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAllowedEmails();
  }, []);

  const fetchAllowedEmails = async () => {
    setAllowedLoading(true);
    try {
      const data = await api.getAllowedEmails();
      setAllowedEmails(data);
    } catch (err: any) {
      console.error('Error fetching allowed emails:', err);
    } finally {
      setAllowedLoading(false);
    }
  };

  const handleAddAllowedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newFullName.trim() || allowedLoading) return;
    setAllowedLoading(true);
    setAllowedError(null);
    setAllowedSuccess(null);
    try {
      const added = await api.addAllowedEmail({
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        fullName: newFullName.trim()
      });
      setAllowedEmails(prev => [...prev, added]);
      setAllowedSuccess(`Cuenta escolar autorizada para ${newEmail.trim().toLowerCase()}`);
      setNewEmail('');
      setNewFullName('');
      setNewRole('student');
    } catch (err: any) {
      setAllowedError(err.message || 'Error al agregar la cuenta autorizada.');
    } finally {
      setAllowedLoading(false);
    }
  };

  const handleDeleteAllowedEmail = async (emailToDelete: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas revocar el acceso a ${emailToDelete}? El usuario no podrá iniciar sesión en la escuela.`)) {
      return;
    }
    setAllowedLoading(true);
    setAllowedError(null);
    setAllowedSuccess(null);
    try {
      await api.deleteAllowedEmail(emailToDelete);
      setAllowedEmails(prev => prev.filter(a => a.email !== emailToDelete));
      setAllowedSuccess(`Acceso revocado exitosamente para ${emailToDelete}`);
    } catch (err: any) {
      setAllowedError(err.message || 'Error al eliminar la cuenta autorizada.');
    } finally {
      setAllowedLoading(false);
    }
  };
  
  // Simulated database records for administration
  const [users, setUsers] = useState<UserRecord[]>([
    {
      id: "u1",
      fullName: "Carlos Alberto Rodríguez",
      email: "carlos.rodriguez@itam.mx",
      role: "student",
      verifiedIdentity: true,
      points: 1450
    },
    {
      id: "u2",
      fullName: "Profe Finanzas Senior",
      email: "profesor.senior@finanzas.edu",
      role: "instructor",
      verifiedIdentity: true,
      points: 500
    },
    {
      id: "u3",
      fullName: "Inversor Novato",
      email: "student_tester@gmail.com",
      role: "student",
      verifiedIdentity: false,
      points: 100
    },
    {
      id: "u4",
      fullName: "Administrador Master",
      email: "admin@finnova.academy",
      role: "admin",
      verifiedIdentity: true,
      points: 0
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "log-32101",
      timestamp: "2026-06-08T02:00:15Z",
      actionType: "EVALUATION_SUBMIT",
      durationMs: 1540,
      status: "SUCCESS",
      output: "Calificación 9/10 calculada para ex_90123."
    },
    {
      id: "log-32102",
      timestamp: "2026-06-08T02:10:45Z",
      actionType: "PROJECT_SUBMISSION",
      durationMs: 2480,
      status: "SUCCESS",
      output: "Nvidia DCF subida a S3 y encolada en BullMQ."
    },
    {
      id: "log-32103",
      timestamp: "2026-06-08T02:30:12Z",
      actionType: "WEBHOOK_HMAC_CHECK",
      durationMs: 320,
      status: "SUCCESS",
      output: "Firma HMAC de n8n validada satisfactoriamente."
    },
    {
      id: "log-32104",
      timestamp: "2026-06-08T02:35:10Z",
      actionType: "EVALUATION_SUBMIT",
      durationMs: 1200,
      status: "FAILED",
      output: "Gemini API devolvió error de cuota. Reintento programado."
    }
  ]);

  // Toggle role handler
  const handleToggleRole = (userId: string, currentRole: 'student' | 'instructor' | 'admin') => {
    const roles: ('student' | 'instructor' | 'admin')[] = ['student', 'instructor', 'admin'];
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
    
    // Append log
    const newLog: AuditLog = {
      id: `log-${Math.floor(Math.random() * 90000 + 10000)}`,
      timestamp: new Date().toISOString(),
      actionType: "USER_ROLE_UPDATE",
      durationMs: 85,
      status: "SUCCESS",
      output: `Rol del usuario ID ${userId} actualizado a ${nextRole.toUpperCase()}.`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Toggle KYC status
  const handleToggleKyc = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verifiedIdentity: !u.verifiedIdentity } : u));
    
    const newLog: AuditLog = {
      id: `log-${Math.floor(Math.random() * 90000 + 10000)}`,
      timestamp: new Date().toISOString(),
      actionType: "USER_KYC_UPDATE",
      durationMs: 70,
      status: "SUCCESS",
      output: `Estatus KYC del usuario ID ${userId} modificado.`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Filter logs based on query search
  const filteredLogs = auditLogs.filter(log => 
    log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.output.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportLogs = (type: 'csv' | 'pdf') => {
    alert(`Exportando logs de auditoría en formato ${type.toUpperCase()}. Descarga iniciada.`);
  };

  return (
    <section id="section-admin-panel" className="space-y-6 text-left animate-fade-in">
      {/* Header title */}
      <div className="flex items-center gap-3">
        <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/15 text-teal-400 shadow-sm">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Panel del Administrador (FinNova Control Hub)</h1>
          <p className="text-xs text-slate-500 font-normal">Gestiona la seguridad del ecosistema, audita los logs de Gemini/n8n y edita roles corporativos.</p>
        </div>
      </div>

      {/* 1. Global statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] text-slate-500 font-mono uppercase">Cuentas Activas</span>
            <h3 className="text-xl font-semibold text-slate-200 mt-1 font-mono">{users.length} Cuentas</h3>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl text-slate-500"><Users className="w-4.5 h-4.5" /></div>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] text-slate-500 font-mono uppercase">Transacciones de IA</span>
            <h3 className="text-xl font-semibold text-teal-400 mt-1 font-mono">1,820 Runs</h3>
          </div>
          <div className="bg-teal-500/10 p-2 rounded-xl text-teal-450"><Cpu className="w-4.5 h-4.5" /></div>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] text-slate-500 font-mono uppercase">Evaluados con Éxito</span>
            <h3 className="text-xl font-semibold text-teal-400 mt-1 font-mono">92.4%</h3>
          </div>
          <div className="bg-teal-500/10 p-2 rounded-xl text-teal-450"><CheckCircle className="w-4.5 h-4.5" /></div>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] text-slate-500 font-mono uppercase">Logs de Auditoría</span>
            <h3 className="text-xl font-semibold text-slate-200 mt-1 font-mono">{auditLogs.length} Logs</h3>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl text-slate-500"><FileText className="w-4.5 h-4.5" /></div>
        </div>
      </div>

      {/* 2. User Directory & role manager */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Directorio Corporativo y Permisos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850/80 text-slate-500 font-mono">
                <th className="py-2.5 px-4 font-semibold">Nombre Usuario</th>
                <th className="py-2.5 px-4 font-semibold">Correo</th>
                <th className="py-2.5 px-4 font-semibold">Puntos XP</th>
                <th className="py-2.5 px-4 font-semibold">Rol</th>
                <th className="py-2.5 px-4 font-semibold">KYC Verificación</th>
                <th className="py-2.5 px-4 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 font-normal">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-950/25 transition duration-150">
                  <td className="py-3 px-4 font-semibold text-slate-200">{u.fullName}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{u.email}</td>
                  <td className="py-3 px-4 text-slate-355 font-mono font-medium">{u.points} XP</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-semibold uppercase ${
                      u.role === 'admin' 
                        ? 'bg-rose-500/5 border-rose-500/15 text-rose-450' 
                        : u.role === 'instructor'
                        ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-305'
                        : 'bg-slate-950/40 border-slate-850/80 text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.verifiedIdentity ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-teal-400 bg-teal-500/5 px-2 py-0.5 rounded-md border border-teal-500/15">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-950/40 px-2 py-0.5 rounded-md border border-slate-850/60">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="bg-slate-950/30 hover:bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg transition font-mono text-[9px] font-semibold text-slate-400 cursor-pointer"
                        title="Cambiar Rol"
                      >
                        Rol +
                      </button>
                      <button
                        onClick={() => handleToggleKyc(u.id)}
                        className="bg-slate-950/30 hover:bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg transition font-mono text-[9px] font-semibold text-slate-400 cursor-pointer"
                        title="Alternar KYC"
                      >
                        KYC
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allowed Emails Management Directory */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Directorio de Cuentas Pre-Autorizadas (Control Escolar)
          </h3>
          <p className="text-slate-500 text-[10px] font-normal mt-0.5">
            Autoriza cuentas escolares (correos electrónicos) de estudiantes e instructores. Solo las cuentas en este directorio podrán autenticarse en el sistema.
          </p>
        </div>

        {/* Success/Error Alerts */}
        {(allowedError || allowedSuccess) && (
          <div className="space-y-2">
            {allowedError && (
              <div className="bg-rose-500/5 border border-rose-500/15 text-rose-455 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{allowedError}</span>
              </div>
            )}
            {allowedSuccess && (
              <div className="bg-teal-500/5 border border-teal-500/15 text-teal-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{allowedSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Add Allowed Email Form */}
        <form onSubmit={handleAddAllowedEmail} className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl space-y-4">
          <h4 className="text-[11px] font-semibold text-slate-300 font-mono uppercase tracking-wide">
            Autorizar Nuevo Miembro
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="ej. Estudiante FinNova"
                className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-teal-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Correo Escolar</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ej. student.finance@finnova.edu"
                className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-teal-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Rol en la Academia</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-teal-500/50"
              >
                <option value="student">Alumno (student)</option>
                <option value="instructor">Instructor (instructor)</option>
                <option value="admin">Administrador (admin)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={allowedLoading}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Autorizar Acceso
            </button>
          </div>
        </form>

        {/* Allowed Emails Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850/80 text-slate-500 font-mono">
                <th className="py-2 px-4">Nombre Completo</th>
                <th className="py-2 px-4">Correo Electrónico</th>
                <th className="py-2 px-4">Rol en Sistema</th>
                <th className="py-2 px-4">Fecha Autorización</th>
                <th className="py-2 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50">
              {allowedLoading && allowedEmails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Cargando directorio de acceso...
                  </td>
                </tr>
              ) : allowedEmails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay correos autorizados registrados.
                  </td>
                </tr>
              ) : (
                allowedEmails.map((allowed) => (
                  <tr key={allowed.email} className="hover:bg-slate-955/20 transition duration-150">
                    <td className="py-3 px-4 font-semibold text-slate-200">{allowed.fullName}</td>
                    <td className="py-3 px-4 text-slate-405 font-mono">{allowed.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-semibold uppercase ${
                        allowed.role === 'admin' 
                          ? 'bg-rose-500/5 border-rose-500/15 text-rose-455' 
                          : allowed.role === 'instructor'
                          ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-305'
                          : 'bg-slate-950/40 border-slate-850/85 text-slate-400'
                      }`}>
                        {allowed.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(allowed.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteAllowedEmail(allowed.email)}
                        disabled={allowedLoading}
                        className="bg-slate-950/40 hover:bg-rose-950/20 border border-slate-850 hover:border-rose-900 text-slate-400 hover:text-rose-450 p-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
                        title="Revocar Acceso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Technical Audit Logs */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Bitácora de Auditoría Técnica
            </h3>
            <p className="text-slate-500 text-[10px] font-normal">Trazabilidad detallada de transacciones, ejecuciones de workers y respuestas de Gemini.</p>
          </div>

          {/* Export tools */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExportLogs('csv')}
              className="bg-slate-955/40 hover:bg-slate-900 border border-slate-850 text-teal-450 px-3 py-1 rounded-xl text-[9px] font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => handleExportLogs('pdf')}
              className="bg-slate-955/40 hover:bg-slate-900 border border-slate-850 text-teal-450 px-3 py-1 rounded-xl text-[9px] font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por acción o log output..."
            className="w-full bg-slate-950/50 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 outline-none focus:border-teal-500/50 font-mono font-normal"
          />
          <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850/80 text-slate-500 font-mono font-semibold">
                <th className="py-2 px-4">Fecha</th>
                <th className="py-2 px-4">ID Transacción</th>
                <th className="py-2 px-4">Acción</th>
                <th className="py-2 px-4">Tiempo (ms)</th>
                <th className="py-2 px-4">Estado</th>
                <th className="py-2 px-4">Output Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 font-normal font-mono text-[10px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-normal text-xs">
                    Ningún registro coincide con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-955/25 transition duration-155">
                    <td className="py-2 px-4 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-4 text-slate-400 font-medium">{log.id}</td>
                    <td className="py-2 px-4 text-teal-400/80 font-medium">{log.actionType}</td>
                    <td className="py-2 px-4 text-slate-350 font-medium">{log.durationMs} ms</td>
                    <td className="py-2 px-4">
                      {log.status === 'SUCCESS' ? (
                        <span className="text-teal-405 font-semibold">SUCCESS</span>
                      ) : (
                        <span className="text-rose-450 font-semibold">FAILED</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-slate-500 truncate max-w-[280px] font-normal" title={log.output}>
                      {log.output}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

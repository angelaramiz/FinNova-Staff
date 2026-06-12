import React from 'react';
import { 
  Cpu, 
  PlusCircle, 
  RefreshCw, 
  ChevronRight, 
  FileText, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface InstructorPanelProps {
  pipelines: any[];
  newPipelinePrompt: string;
  setNewPipelinePrompt: (val: string) => void;
  newPipelineTitle: string;
  setNewPipelineTitle: (val: string) => void;
  voiceModel: string;
  setVoiceModel: (val: string) => void;
  isCreatingDraft: boolean;
  handleCreatePipelineDraft: (e: React.FormEvent) => Promise<void>;
  handleApprovePipelineItem: (id: string) => Promise<void>;
  handleRejectPipelineItem: (id: string) => Promise<void>;
}

export default function InstructorPanel({
  pipelines,
  newPipelinePrompt,
  setNewPipelinePrompt,
  newPipelineTitle,
  setNewPipelineTitle,
  voiceModel,
  setVoiceModel,
  isCreatingDraft,
  handleCreatePipelineDraft,
  handleApprovePipelineItem,
  handleRejectPipelineItem
}: InstructorPanelProps) {
  return (
    <section id="section-instructor-studio" className="flex flex-col gap-5 animate-fade-in text-left">
      <div className="flex items-center gap-3">
        <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/15 text-teal-400 shadow-sm">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Taller de Ingesta y Automatización (n8n Webhook)</h1>
          <p className="text-xs text-slate-500 font-normal">Orquesta tus flujos de n8n para renderizar micro-conceptos instantáneos y subirlos a Cloudflare.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Trigger panel form */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <span className="text-slate-350 text-xs font-semibold font-mono tracking-wide uppercase flex items-center gap-1.5 pb-2 border-b border-slate-850/60">
            <PlusCircle className="w-4 h-4 text-teal-450" /> Generar Nuevo Concepto
          </span>

          <form onSubmit={handleCreatePipelineDraft} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium">Título del Concepto</label>
              <input
                type="text"
                required
                value={newPipelineTitle}
                onChange={(e) => setNewPipelineTitle(e.target.value)}
                placeholder="Ej: Costo de Capital de Deuda (Kd)"
                className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 font-mono font-normal"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium">Tono y Guión Breve (Prompt)</label>
              <textarea
                required
                value={newPipelinePrompt}
                onChange={(e) => setNewPipelinePrompt(e.target.value)}
                placeholder="Explica la fórmula Kd = Costo de deuda bruto * (1 - Tasa impositiva) en menos de 50 segundos..."
                rows={4}
                className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-0 leading-relaxed font-mono font-normal"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium">Voz del Actor (ElevenLabs)</label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer text-xs font-semibold"
              >
                <option value="Charon">Charon (Finanzas Corporativas - Hombre)</option>
                <option value="Zephyr">Zephyr (Dinámica - Mujer)</option>
                <option value="Kore">Kore (Educación Técnica - Cálida)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreatingDraft || !newPipelineTitle || !newPipelinePrompt}
              className={`w-full py-2.5 px-4 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isCreatingDraft 
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-850/50' 
                  : 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 shadow-sm'
              }`}
            >
              {isCreatingDraft ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Invocando Webhook...
                </>
              ) : (
                <>
                  Lanzar Ingesta en n8n <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pipeline dashboard logs */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="text-slate-350 text-xs font-semibold font-mono tracking-wide uppercase flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-450" /> Historial de Procesamientos de n8n
          </span>

          <div className="flex flex-col gap-3">
            {pipelines.length === 0 ? (
              <div className="text-center p-8 bg-slate-900/20 border border-slate-850 rounded-xl text-slate-500 text-xs font-normal">
                No hay pipelines encolados. Utiliza el formulario lateral para emitir el webhook inicial.
              </div>
            ) : (
              pipelines.map(item => (
                <div 
                  key={item.id}
                  className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-slate-500 font-mono font-medium tracking-tight">
                        ID: {item.pipelineId}
                      </span>
                      <span className={`text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase ${
                        item.status === 'approved'
                          ? 'bg-teal-500/10 border-teal-500/25 text-teal-400'
                          : item.status === 'rejected'
                          ? 'bg-rose-500/5 border-rose-500/15 text-rose-450'
                          : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-200">
                      {item.inputPrompt.replace('Guión explicativo de:', '')}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-1 italic leading-normal font-normal">
                      Prompt: "{item.inputPrompt}"
                    </p>
                    {item.reviewerNotes && (
                      <div className="text-[10px] text-slate-500 mt-2 bg-slate-950/30 p-2 rounded-lg border border-slate-850/80 font-normal">
                        <strong>Notas de Auditoría:</strong> {item.reviewerNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                    {item.status === 'awaiting_approval' && (
                      <>
                        <button
                          onClick={() => handleApprovePipelineItem(item.id)}
                          className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-350 border border-teal-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                        >
                          Publicar Clip
                        </button>
                        <button
                          onClick={() => handleRejectPipelineItem(item.id)}
                          className="bg-slate-950/30 hover:bg-slate-900 border border-slate-850 text-slate-500 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {item.status === 'approved' && (
                      <div className="bg-teal-500/5 border border-teal-500/10 text-teal-400 p-2 rounded-xl flex items-center justify-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Clip Activo
                      </div>
                    )}
                    {item.status === 'rejected' && (
                      <div className="bg-rose-500/5 border border-rose-500/10 text-rose-400 p-2 rounded-xl flex items-center justify-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Rechazado
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

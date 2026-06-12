/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';
import { 
  Award, 
  TrendingUp, 
  Cpu, 
  User, 
  Database,
  BookOpen,
  Sliders, 
  RefreshCw, 
  CheckCircle2
} from 'lucide-react';
import { api } from './lib/api';
import InstructorPanel from './components/InstructorPanel';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // App profile state
  const [profile, setProfile] = useState<any>({
    fullName: 'Inversor Novato',
    role: 'student',
    pointsEarned: 100,
    certLevel: 'Principiante Financiero',
    institution: 'Instituto de Finanzas Aplicadas',
    verifiedIdentity: true
  });

  // Global Courses
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedCourseProgress, setSelectedCourseProgress] = useState<any>(null);

  // Instructor pipeline states
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [newPipelinePrompt, setNewPipelinePrompt] = useState('');
  const [newPipelineTitle, setNewPipelineTitle] = useState('');
  const [voiceModel, setVoiceModel] = useState('Charon');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Sync utilities
  const [loading, setLoading] = useState(true);
  
  // Local active view role (matches URL path)
  const [currentViewMode, setCurrentViewMode] = useState<'student' | 'instructor' | 'admin'>('instructor');

  // Projects Lab states
  const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(null);
  const [projectFileUrl, setProjectFileUrl] = useState('');
  const [exportingCV, setExportingCV] = useState(false);

  // Synchronize view mode state based on browser URL
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setCurrentViewMode('admin');
    } else {
      setCurrentViewMode('instructor');
    }
  }, [location.pathname]);

  // Load platform data upon mount or role updates
  useEffect(() => {
    loadPlatformData();
  }, [currentViewMode]);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      localStorage.setItem('sandbox_view_mode', currentViewMode);
      localStorage.setItem(
        'sandbox_mock_user_id', 
        currentViewMode === 'student' 
          ? '22222222-2222-2222-2222-222222222222'
          : '11111111-1111-1111-1111-111111111111'
      );

      const userProfile = await api.getProfile();
      setProfile({
        ...userProfile,
        // Override role locally to support admin / instructor preview flows
        role: currentViewMode,
        certLevel: currentViewMode === 'student' 
          ? 'Analista Certificado Nivel I' 
          : currentViewMode === 'instructor' 
          ? 'Instructor Senior' 
          : 'Administrador Master',
        institution: 'ITAM - Especialización en Finanzas Corporativas',
        verifiedIdentity: true
      });

      const courseList = await api.getCourses();
      setCourses(courseList);

      if (currentViewMode === 'instructor') {
        const pipelineData = await api.getPipelineReviews();
        setPipelines(pipelineData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error hydrating platform entities:', err);
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: any) => {
    try {
      setLoading(true);
      const detailed = await api.getCourseDetails(course.id);
      setSelectedCourse(detailed);
      
      const prog = await api.getProgress(course.id);
      setSelectedCourseProgress(prog);
      
      navigate('/student/clips');
      setLoading(false);
    } catch (err) {
      console.error('Failed opening course layout:', err);
      setLoading(false);
    }
  };

  const handleRefreshProgress = async () => {
    if (!selectedCourse) return;
    try {
      const prog = await api.getProgress(selectedCourse.id);
      setSelectedCourseProgress(prog);
      const userProfile = await api.getProfile();
      setProfile((prev: any) => ({ ...prev, pointsEarned: userProfile.pointsEarned }));
    } catch (err) {
      console.error('Failed refreshing progress records:', err);
    }
  };

  const handleCreatePipelineDraft = async (e: any) => {
    e.preventDefault();
    if (!newPipelinePrompt.trim() || !newPipelineTitle.trim() || isCreatingDraft) return;

    setIsCreatingDraft(true);
    try {
      const response = await api.triggerDraftPipeline({
        inputPrompt: `Guión explicativo de: "${newPipelineTitle}". Detalles clave: ${newPipelinePrompt}`,
        voiceModel: `elevenlabs-${voiceModel.toLowerCase()}-finance-v2`,
        videoPrompt: `Professional visual grid displaying market candles representing: ${newPipelineTitle}. Dark backdrop.`,
      });

      setPipelines(prev => [response, ...prev]);
      setNewPipelinePrompt('');
      setNewPipelineTitle('');
      setIsCreatingDraft(false);
      
      const updated = await api.getPipelineReviews();
      setPipelines(updated);
    } catch (err) {
      console.error('Pipeline drafting failed:', err);
      setIsCreatingDraft(false);
    }
  };

  const handleApprovePipelineItem = async (pipelineId: string) => {
    try {
      await api.patchPipelineStatus(pipelineId, 'approved', 'Revisión aprobada por Instructor. Publicado.');
      
      const updated = await api.getPipelineReviews();
      setPipelines(updated);

      const courseList = await api.getCourses();
      setCourses(courseList);
      
      if (selectedCourse) {
        const detailed = await api.getCourseDetails(selectedCourse.id);
        setSelectedCourse(detailed);
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleRejectPipelineItem = async (pipelineId: string) => {
    try {
      await api.patchPipelineStatus(pipelineId, 'rejected', 'Devuelto para optimización de voces.');
      const updated = await api.getPipelineReviews();
      setPipelines(updated);
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  const handleDownloadCV = () => {
    setExportingCV(true);
    setTimeout(() => {
      setExportingCV(false);
      alert("CV de Finanzas en PDF generado. Competencias validadas añadidas satisfactoriamente.");
    }, 1500);
  };

  const handleProjectSubmit = (projectId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFileUrl.trim()) return;
    setSubmittedProjectId(projectId);
    setProjectFileUrl('');
  };

  // Switch role and redirect layout
  const handleSandboxRoleSwitch = (role: 'student' | 'instructor' | 'admin') => {
    setCurrentViewMode(role);
    navigate(`/${role}`);
  };

  return (
    <div id="finance-platform-core" className="min-h-screen bg-[#0a0f1d] text-slate-300 flex flex-col font-sans selection:bg-teal-450 selection:text-neutral-900">
      
      {/* -------------------------------------------------------------
          NAVBAR HEADER
          ------------------------------------------------------------- */}
      <header id="platform-navbar-header" className={`sticky top-0 z-50 bg-[#0a0f1d]/85 backdrop-blur-md border-b border-slate-800/50 px-4 py-3 shadow-md ${location.pathname.startsWith('/student') ? 'hidden md:block' : ''}`}>
        <div className={`mx-auto flex items-center justify-between w-full ${location.pathname.startsWith('/student') ? 'px-4 md:px-6' : 'max-w-7xl'}`}>
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 border border-slate-800/60 p-2 rounded-xl text-teal-400 shadow-sm">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-slate-200 block">
                AURAFI ACADEMY
              </span>
              <span className="text-[9px] text-teal-400/80 font-mono font-semibold tracking-wider uppercase block">
                Enterprise LMS & AI Certification
              </span>
            </div>
          </div>

          {/* Nav links based on permission and routes */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/40 border border-slate-800/60 p-1 rounded-xl">
            {(profile.role === 'instructor' || profile.role === 'admin' || currentViewMode === 'instructor' || currentViewMode === 'admin') && (
              <Link
                to="/instructor"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
                  currentViewMode === 'instructor'
                    ? 'bg-slate-900 border-slate-800/80 text-teal-400 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> Portal Instructor
              </Link>
            )}

            {(profile.role === 'admin' || currentViewMode === 'admin') && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
                  currentViewMode === 'admin'
                    ? 'bg-slate-900 border-slate-800/80 text-teal-400 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> Portal Administrador
              </Link>
            )}
          </nav>

          {/* XP Badge and User Profile tag */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/60 px-3 py-1 rounded-full border border-slate-850/80 flex items-center gap-1.5 shadow-inner">
              <Award className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-300 font-mono tracking-tight">
                {profile.pointsEarned} XP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <img 
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'} 
                alt="Profile Avatar" 
                className="w-7.5 h-7.5 rounded-full border border-slate-800 object-cover"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-300 truncate max-w-[100px] leading-tight">
                  {profile.fullName}
                </p>
                <p className="text-[8px] text-teal-400 font-medium tracking-wider font-mono uppercase leading-none mt-0.5">
                  {profile.certLevel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN ROUTER WORKSPACE
          ------------------------------------------------------------- */}
      <main className={`flex-1 w-full mx-auto pb-20 ${location.pathname.startsWith('/student') ? '' : 'max-w-7xl p-4 md:p-6'}`}>
        
        {loading && (
          <div id="loading-indicator-cover" className="fixed inset-0 bg-[#0a0f1d]/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
              <RefreshCw className="w-7 h-7 text-teal-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">
                Estableciendo conexiones con Supabase...
              </p>
            </div>
          </div>
        )}

        <Routes>


          {/* INSTRUCTOR PANEL ROOT ROUTING */}
          <Route path="/instructor" element={
            <InstructorPanel 
              pipelines={pipelines}
              newPipelinePrompt={newPipelinePrompt}
              setNewPipelinePrompt={setNewPipelinePrompt}
              newPipelineTitle={newPipelineTitle}
              setNewPipelineTitle={setNewPipelineTitle}
              voiceModel={voiceModel}
              setVoiceModel={setVoiceModel}
              isCreatingDraft={isCreatingDraft}
              handleCreatePipelineDraft={handleCreatePipelineDraft}
              handleApprovePipelineItem={handleApprovePipelineItem}
              handleRejectPipelineItem={handleRejectPipelineItem}
            />
          } />

          {/* ADMIN PANEL ROOT ROUTING */}
          <Route path="/admin" element={
            <AdminPanel />
          } />

          {/* ROOT REDIRECT FALLBACK */}
          <Route path="*" element={<Navigate to="/instructor" replace />} />
        </Routes>
      </main>


    </div>
  );
}

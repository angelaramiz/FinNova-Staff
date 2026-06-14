import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  PlusCircle, 
  RefreshCw, 
  ChevronRight, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Folder,
  FolderOpen,
  Trash2,
  Edit,
  PlayCircle,
  ChevronDown,
  X,
  Send,
  Layers,
  Video,
  Workflow,
  HelpCircle
} from 'lucide-react';
import { api, apiFetch } from '../lib/api';

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
  courses: any[];
  refreshCourses: () => Promise<void>;
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
  handleRejectPipelineItem,
  courses,
  refreshCourses
}: InstructorPanelProps) {
  const [activeTab, setActiveTab] = useState<'n8n' | 'chat' | 'courses'>('chat');

  // Chat/Doubts States
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedCourseFilterId, setSelectedCourseFilterId] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  // Courses CRUD States
  const [expandedCourses, setExpandedCourses] = useState<{ [key: string]: boolean }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [selectedLessonCourseId, setSelectedLessonCourseId] = useState<string>('');

  // Modals States
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [activeCourseIdForNewLesson, setActiveCourseIdForNewLesson] = useState<string>('');
  
  // Course Form States
  const [courseForm, setCourseForm] = useState({
    id: '',
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    imageUrl: '',
    isPublished: false
  });

  // Lesson Form States
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 60,
    sequenceOrder: 1,
    section: ''
  });

  // Lesson Drawer Edit States
  const [drawerForm, setDrawerForm] = useState({
    id: '',
    title: '',
    description: '',
    videoUrl: '',
    duration: 60,
    sequenceOrder: 1,
    section: ''
  });

  // Fetch student doubts on mount/tab change
  const fetchQuestions = async () => {
    try {
      setLoadingChats(true);
      const data = await api.getQuestions();
      setQuestions(data);
      if (data.length > 0 && !selectedQuestionId) {
        setSelectedQuestionId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchQuestions();
    }
  }, [activeTab]);

  // Handle student reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const updated = await api.replyQuestion(selectedQuestionId, replyText.trim());
      setQuestions(prev => prev.map(q => q.id === selectedQuestionId ? updated : q));
      setReplyText('');
    } catch (err) {
      console.error('Failed replying:', err);
      alert('Error al enviar la respuesta.');
    } finally {
      setSendingReply(false);
    }
  };

  // Toggle Course tree folders
  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const toggleSectionExpand = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Group clips of a course by section
  const getCourseSections = (course: any) => {
    const clips = course.clips || [];
    const sections: { [key: string]: any[] } = {};
    clips.forEach((clip: any) => {
      const secName = clip.section || 'General';
      if (!sections[secName]) {
        sections[secName] = [];
      }
      sections[secName].push(clip);
    });
    return sections;
  };

  // Course CRUD handlers
  const handleOpenCreateCourse = () => {
    setCourseForm({
      id: '',
      title: '',
      description: '',
      difficulty: 'beginner',
      imageUrl: '',
      isPublished: false
    });
    setShowCreateCourseModal(true);
  };

  const handleOpenEditCourse = (course: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCourseForm({
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      imageUrl: course.imageUrl || '',
      isPublished: course.isPublished
    });
    setShowEditCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent, isEditing: boolean) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateCourse(courseForm.id, {
          title: courseForm.title,
          description: courseForm.description,
          difficulty: courseForm.difficulty,
          imageUrl: courseForm.imageUrl,
          isPublished: courseForm.isPublished
        });
      } else {
        // Create endpoint POST /api/courses exists
        await apiFetch('/api/courses', {
          method: 'POST',
          body: JSON.stringify({
            title: courseForm.title,
            description: courseForm.description,
            difficulty: courseForm.difficulty,
            imageUrl: courseForm.imageUrl
          })
        });
      }
      await refreshCourses();
      setShowCreateCourseModal(false);
      setShowEditCourseModal(false);
    } catch (err) {
      console.error('Failed saving course:', err);
      alert('Error al guardar el curso.');
    }
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas borrar este curso y todas sus lecciones asociadas? Esta acción no se puede deshacer.')) return;

    try {
      await api.deleteCourse(courseId);
      await refreshCourses();
      if (selectedLesson && selectedLessonCourseId === courseId) {
        setSelectedLesson(null);
      }
    } catch (err) {
      console.error('Failed deleting course:', err);
      alert('Error al borrar el curso.');
    }
  };

  // Lesson CRUD handlers
  const handleOpenCreateLesson = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCourseIdForNewLesson(courseId);
    setLessonForm({
      title: '',
      description: '',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      duration: 60,
      sequenceOrder: 1,
      section: 'Fundamentos'
    });
    setShowCreateLessonModal(true);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addClip(activeCourseIdForNewLesson, {
        title: lessonForm.title,
        description: lessonForm.description,
        videoUrl: lessonForm.videoUrl,
        duration: Number(lessonForm.duration),
        sequenceOrder: Number(lessonForm.sequenceOrder),
        section: lessonForm.section || 'General'
      });
      await refreshCourses();
      setShowCreateLessonModal(false);
    } catch (err) {
      console.error('Failed creating lesson:', err);
      alert('Error al crear la lección.');
    }
  };

  const handleSelectLesson = (clip: any, courseId: string) => {
    setSelectedLesson(clip);
    setSelectedLessonCourseId(courseId);
    setDrawerForm({
      id: clip.id,
      title: clip.title,
      description: clip.description || '',
      videoUrl: clip.videoUrl || '',
      duration: clip.duration || 60,
      sequenceOrder: clip.sequenceOrder || 1,
      section: clip.section || 'General'
    });
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson || !selectedLessonCourseId) return;

    try {
      await api.updateClip(selectedLessonCourseId, selectedLesson.id, {
        title: drawerForm.title,
        description: drawerForm.description,
        videoUrl: drawerForm.videoUrl,
        duration: Number(drawerForm.duration),
        sequenceOrder: Number(drawerForm.sequenceOrder),
        section: drawerForm.section
      });
      await refreshCourses();
      setSelectedLesson(null);
    } catch (err) {
      console.error('Failed updating lesson:', err);
      alert('Error al actualizar la lección.');
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson || !selectedLessonCourseId) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta lección?')) return;

    try {
      await api.deleteClip(selectedLessonCourseId, selectedLesson.id);
      await refreshCourses();
      setSelectedLesson(null);
    } catch (err) {
      console.error('Failed deleting lesson:', err);
      alert('Error al borrar la lección.');
    }
  };

  // Filtered Questions for WhatsApp view
  const filteredQuestions = questions.filter(q => {
    if (selectedCourseFilterId === 'all') return true;
    return q.courseId === selectedCourseFilterId;
  });

  const activeQuestion = questions.find(q => q.id === selectedQuestionId);

  // Group questions by course to count them or show sidebar group indicators
  const questionsByCourse: { [key: string]: number } = {};
  questions.forEach(q => {
    questionsByCourse[q.courseId] = (questionsByCourse[q.courseId] || 0) + 1;
  });

  return (
    <section id="section-instructor-studio" className="flex flex-col gap-6 animate-fade-in text-left">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/15 text-teal-400 shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Taller del Instructor Senior</h1>
            <p className="text-xs text-slate-500 font-normal">Gestiona tus materias académicas, edita lecciones multimedia y atiende las dudas de tus alumnos.</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-850 gap-4 pb-1">
        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-3 text-xs font-semibold font-mono tracking-wide border-b-2 transition uppercase cursor-pointer flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'border-teal-500 text-teal-450'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Atención a Alumnos
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 text-xs font-semibold font-mono tracking-wide border-b-2 transition uppercase cursor-pointer flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'border-teal-500 text-teal-455'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <FolderOpen className="w-4 h-4" /> Gestión de Cursos
        </button>
        <button
          onClick={() => setActiveTab('n8n')}
          className={`pb-3 text-xs font-semibold font-mono tracking-wide border-b-2 transition uppercase cursor-pointer flex items-center gap-2 ${
            activeTab === 'n8n'
              ? 'border-teal-500 text-teal-450'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Workflow className="w-4 h-4" /> Automatización (n8n)
        </button>
      </div>

      {/* ----------------------------------------------------------------------
          1. CHAT TAB (WhatsApp style)
          ---------------------------------------------------------------------- */}
      {activeTab === 'chat' && (
        <div className="flex bg-[#0c1325]/45 border border-slate-850/65 rounded-2xl overflow-hidden h-[600px] shadow-lg backdrop-blur-sm">
          {/* Left Panel: Course groups selector */}
          <div className="w-1/4 border-r border-slate-850/60 bg-slate-950/20 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-850/60 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest shrink-0">
              Filtrar por Curso
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCourseFilterId('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition ${
                  selectedCourseFilterId === 'all' 
                    ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                📁 Todos los Cursos ({questions.length})
              </button>
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseFilterId(course.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition truncate block ${
                    selectedCourseFilterId === course.id 
                      ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                  title={course.title}
                >
                  📖 {course.title} ({questionsByCourse[course.id] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Middle Panel: Student Threads */}
          <div className="w-1/3 border-r border-slate-850/60 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-850/60 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between shrink-0">
              <span>Chats de Alumnos</span>
              <button onClick={fetchQuestions} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-850/40 scrollbar-thin">
              {loadingChats && questions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  Cargando chats...
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-normal">
                  No hay dudas pendientes en este curso.
                </div>
              ) : (
                filteredQuestions.map(q => {
                  const isSelected = q.id === selectedQuestionId;
                  const isReplied = !!q.replyText;
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        setSelectedQuestionId(q.id);
                        if (q.replyText) {
                          setReplyText(q.replyText); // Load existing reply for easy edit
                        } else {
                          setReplyText('');
                        }
                      }}
                      className={`p-3.5 text-left cursor-pointer transition ${
                        isSelected 
                          ? 'bg-slate-900/60 text-teal-450 border-l-2 border-teal-500' 
                          : 'hover:bg-slate-900/20 text-slate-350 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase ${
                          isReplied 
                            ? 'bg-teal-500/10 border-teal-500/25 text-teal-450' 
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-300 animate-pulse'
                        }`}>
                          {isReplied ? 'Respondido' : 'Pendiente'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(q.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-200 truncate">
                        👤 {q.studentName}
                      </h4>
                      <p className="text-[9px] text-slate-450 truncate mt-0.5">
                        {q.courseTitle}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        Lección: {q.clipTitle}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1 italic font-normal">
                        "{q.questionText}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: WhatsApp style chat container */}
          <div className="flex-1 bg-slate-950/35 flex flex-col min-w-0">
            {activeQuestion ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Chat Header */}
                <div className="p-4 bg-[#0c1325]/60 border-b border-slate-850/60 flex items-center justify-between shrink-0">
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] text-teal-400 font-mono font-bold uppercase tracking-wider block">
                      {activeQuestion.courseTitle}
                    </span>
                    <h3 className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                      Duda de {activeQuestion.studentName} sobre: {activeQuestion.clipTitle}
                    </h3>
                  </div>
                  <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase shrink-0 ${
                    activeQuestion.replyText 
                      ? 'bg-teal-500/10 border-teal-500/25 text-teal-405' 
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                  }`}>
                    {activeQuestion.replyText ? 'Resuelto' : 'Pendiente'}
                  </span>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {/* Student Question bubble (Left) */}
                  <div className="flex justify-start items-end gap-2 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-[10px] font-bold shrink-0 uppercase">
                      {activeQuestion.studentName.slice(0, 2)}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[8px] text-slate-500 font-mono mb-1">{activeQuestion.studentName} (Alumno)</span>
                      <div className="bg-slate-900 border border-slate-850/80 text-slate-200 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-lg text-left whitespace-pre-wrap">
                        {activeQuestion.questionText}
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono mt-1">
                        {new Date(activeQuestion.createdAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  {/* Instructor Reply bubble (Right, if exists) */}
                  {activeQuestion.replyText && (
                    <div className="flex justify-end items-end gap-2 max-w-[85%] ml-auto">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-500 font-mono mb-1">Tú (Instructor)</span>
                        <div className="bg-teal-600/10 border border-teal-500/20 text-teal-100 p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-lg text-left whitespace-pre-wrap">
                          {activeQuestion.replyText}
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono mt-1">
                          {activeQuestion.repliedAt && new Date(activeQuestion.repliedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-mono text-[10px] font-bold shrink-0">
                        YO
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-3 bg-slate-900/30 border-t border-slate-850/60 flex gap-2 items-end shrink-0">
                  <textarea
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={activeQuestion.replyText ? "Modificar tu respuesta..." : "Escribe una respuesta técnica..."}
                    rows={2}
                    className="bg-slate-950 border border-slate-800 focus:border-teal-500/50 focus:ring-0 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none flex-1 font-mono font-normal resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                      sendingReply || !replyText.trim()
                        ? 'bg-slate-900 text-slate-600'
                        : 'bg-teal-500/10 border border-teal-500/35 text-teal-450 hover:bg-teal-500/25'
                    }`}
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
                <MessageSquare className="w-12 h-12 text-slate-800 mb-2" />
                <span>Selecciona una duda en la columna media para auditar el chat del estudiante.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          2. COURSES MANAGEMENT TAB (Folder Layout)
          ---------------------------------------------------------------------- */}
      {activeTab === 'courses' && (
        <div className="flex gap-5 items-start relative min-h-[500px]">
          {/* Courses Folder List */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Directorio de Cursos</span>
              <button
                onClick={handleOpenCreateCourse}
                className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Crear Curso
              </button>
            </div>

            <div className="space-y-3">
              {courses.length === 0 ? (
                <div className="text-center p-8 bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                  No hay cursos registrados. Haz clic en "Crear Curso" para iniciar el catálogo.
                </div>
              ) : (
                courses.map(course => {
                  const isExpanded = expandedCourses[course.id];
                  const sections = getCourseSections(course);
                  return (
                    <div key={course.id} className="bg-slate-900/20 border border-slate-850 rounded-2xl overflow-hidden shadow-sm">
                      {/* Course Directory Header */}
                      <div 
                        onClick={() => toggleCourseExpand(course.id)}
                        className="p-4 hover:bg-slate-900/25 flex items-center justify-between cursor-pointer transition select-none text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-teal-450 shrink-0">
                            {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-slate-200 truncate">{course.title}</h3>
                              <span className={`text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase shrink-0 ${
                                course.isPublished
                                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
                              }`}>
                                {course.isPublished ? 'Publicado' : 'Borrador'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">{course.description}</p>
                          </div>
                        </div>

                        {/* Course actions */}
                        <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenCreateLesson(course.id, e)}
                            className="p-1.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition text-[10px] font-mono font-bold px-2.5 flex items-center gap-1"
                            title="Añadir Lección"
                          >
                            + Lección
                          </button>
                          <button
                            onClick={(e) => handleOpenEditCourse(course, e)}
                            className="p-1.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-teal-400 rounded-xl transition"
                            title="Editar Curso"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCourse(course.id, e)}
                            className="p-1.5 bg-slate-900/60 border border-slate-800 hover:border-rose-500 text-slate-500 hover:text-rose-400 rounded-xl transition"
                            title="Eliminar Curso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Course Folder Body */}
                      {isExpanded && (
                        <div className="bg-slate-950/15 border-t border-slate-850/60 p-4 space-y-4 text-left">
                          {course.clips && course.clips.length === 0 ? (
                            <div className="text-[11px] text-slate-550 pl-8 font-normal">
                              No hay lecciones en este curso. Haz clic en "+ Lección" para agregar contenido.
                            </div>
                          ) : (
                            Object.entries(sections).map(([secName, clips]) => {
                              const sectionKey = `${course.id}-${secName}`;
                              const isSectionExpanded = expandedSections[sectionKey] !== false; // default expanded
                              return (
                                <div key={secName} className="space-y-1.5 pl-4">
                                  {/* Section Title Node */}
                                  <div 
                                    onClick={() => toggleSectionExpand(sectionKey)}
                                    className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-slate-205 cursor-pointer select-none"
                                  >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isSectionExpanded ? '' : '-rotate-90'}`} />
                                    <Folder className="w-4 h-4 text-indigo-400/80 shrink-0" />
                                    <span>Tema: {secName}</span>
                                    <span className="text-[9px] text-slate-600 font-mono font-medium">({clips.length})</span>
                                  </div>

                                  {/* Section clips list */}
                                  {isSectionExpanded && (
                                    <div className="pl-6 space-y-1 border-l border-slate-850/60 ml-2 pt-1 pb-1">
                                      {clips.map((clip: any) => {
                                        const isSelected = selectedLesson?.id === clip.id;
                                        return (
                                          <div
                                            key={clip.id}
                                            onClick={() => handleSelectLesson(clip, course.id)}
                                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer text-left ${
                                              isSelected 
                                                ? 'bg-slate-900 border border-slate-800 text-teal-400 shadow-inner' 
                                                : 'hover:bg-slate-900/30 text-slate-350 border border-transparent'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <PlayCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                              <span className="truncate font-medium">{clip.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500 font-mono ml-3">
                                              <span>{clip.duration}s</span>
                                              <span className="bg-slate-900 border border-slate-850/60 px-1.5 py-0.2 rounded font-bold">Orden: {clip.sequenceOrder}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side sliding Drawer for editing Clip */}
          {selectedLesson && (
            <div className="w-80 bg-slate-900/60 border border-slate-850 rounded-2xl p-5 shadow-lg shrink-0 sticky top-20 text-left animate-slide-in">
              <div className="flex items-center justify-between border-b border-slate-850/60 pb-3 mb-4">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1">
                  <Video className="w-4 h-4 text-teal-450" /> Editar Lección
                </span>
                <button 
                  onClick={() => setSelectedLesson(null)} 
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300"
                  title="Cerrar Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateLesson} className="space-y-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Título de Lección</label>
                  <input
                    type="text"
                    required
                    value={drawerForm.title}
                    onChange={(e) => setDrawerForm({ ...drawerForm, title: e.target.value })}
                    className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 font-mono font-normal"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Descripción</label>
                  <textarea
                    value={drawerForm.description}
                    onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                    rows={3}
                    className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50 leading-relaxed font-normal"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Tema / Sección Organizadora</label>
                  <input
                    type="text"
                    required
                    value={drawerForm.section}
                    onChange={(e) => setDrawerForm({ ...drawerForm, section: e.target.value })}
                    placeholder="Ej: Múltiplos de Valuación"
                    className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 font-mono font-normal"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Video playback URL</label>
                  <input
                    type="url"
                    required
                    value={drawerForm.videoUrl}
                    onChange={(e) => setDrawerForm({ ...drawerForm, videoUrl: e.target.value })}
                    className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 font-mono font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 font-medium">Duración (seg)</label>
                    <input
                      type="number"
                      required
                      value={drawerForm.duration}
                      onChange={(e) => setDrawerForm({ ...drawerForm, duration: Number(e.target.value) })}
                      className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 font-mono font-normal"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 font-medium">Orden Secuencia</label>
                    <input
                      type="number"
                      required
                      value={drawerForm.sequenceOrder}
                      onChange={(e) => setDrawerForm({ ...drawerForm, sequenceOrder: Number(e.target.value) })}
                      className="bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-teal-500/50 font-mono font-normal"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded-xl transition font-bold cursor-pointer shadow-sm text-center"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteLesson}
                    className="w-full py-2 bg-rose-500/10 border border-rose-500/30 text-rose-450 hover:bg-rose-500/20 rounded-xl transition font-bold cursor-pointer text-center"
                  >
                    Eliminar Lección
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          3. PIPELINE AUTOMATION TAB (n8n Webhooks)
          ---------------------------------------------------------------------- */}
      {activeTab === 'n8n' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Trigger panel form */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex flex-col gap-4 shadow-sm text-left">
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
                    ? 'bg-slate-900 text-slate-650 cursor-not-allowed border border-slate-850/50' 
                    : 'bg-teal-500/10 border border-teal-500/30 text-teal-405 hover:bg-teal-500/20 shadow-sm'
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
          <div className="lg:col-span-2 flex flex-col gap-4 text-left">
            <span className="text-slate-355 text-xs font-semibold font-mono tracking-wide uppercase flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-455" /> Historial de Procesamientos de n8n
            </span>

            <div className="flex flex-col gap-3">
              {pipelines.length === 0 ? (
                <div className="text-center p-8 bg-slate-900/20 border border-slate-850 rounded-xl text-slate-505 text-xs font-normal">
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
                            : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-305'
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
                        <div className="text-[10px] text-slate-505 mt-2 bg-slate-950/30 p-2 rounded-lg border border-slate-855/80 font-normal">
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
                            className="bg-slate-950/30 hover:bg-slate-900 border border-slate-850 text-slate-505 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
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
      )}

      {/* ----------------------------------------------------------------------
          MODALS & OVERLAYS
          ---------------------------------------------------------------------- */}
      
      {/* 1. Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl relative text-left animate-fade-in">
            <button
              onClick={() => setShowCreateCourseModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <PlusCircle className="w-4.5 h-4.5 text-teal-400" /> Crear Nuevo Curso
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Ingresa las propiedades del curso para abrir el catálogo escolar.</p>

            <form onSubmit={(e) => handleSaveCourse(e, false)} className="mt-4 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Título del Curso</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Ej: Valuación y Fusiones de Empresas"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Descripción</label>
                <textarea
                  required
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Describe los objetivos y conceptos principales..."
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50 font-normal leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Dificultad</label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value as any })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 cursor-pointer focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Imagen del Curso (URL)</label>
                  <input
                    type="url"
                    value={courseForm.imageUrl}
                    onChange={(e) => setCourseForm({ ...courseForm, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-405 hover:bg-teal-500/20 rounded-xl transition font-bold cursor-pointer text-center"
                >
                  Crear Curso
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 rounded-xl font-semibold hover:bg-slate-900 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Course Modal */}
      {showEditCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl relative text-left animate-fade-in">
            <button
              onClick={() => setShowEditCourseModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Edit className="w-4.5 h-4.5 text-teal-405" /> Editar Curso
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Modifica los detalles globales de tu curso.</p>

            <form onSubmit={(e) => handleSaveCourse(e, true)} className="mt-4 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Título del Curso</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Descripción</label>
                <textarea
                  required
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-355 focus:outline-none focus:border-teal-500/50 font-normal leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Dificultad</label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value as any })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 cursor-pointer focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Imagen del Curso (URL)</label>
                  <input
                    type="url"
                    value={courseForm.imageUrl}
                    onChange={(e) => setCourseForm({ ...courseForm, imageUrl: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-355 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="chk-published"
                  checked={courseForm.isPublished}
                  onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-teal-500 cursor-pointer focus:ring-0 w-4 h-4"
                />
                <label htmlFor="chk-published" className="text-slate-450 cursor-pointer font-medium">Publicar inmediatamente (Visible para alumnos)</label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded-xl transition font-bold cursor-pointer text-center"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditCourseModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 rounded-xl font-semibold hover:bg-slate-900 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create Lesson Modal */}
      {showCreateLessonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl relative text-left animate-fade-in">
            <button
              onClick={() => setShowCreateLessonModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <PlusCircle className="w-4.5 h-4.5 text-teal-400" /> Añadir Lección al Curso
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Crea una lección (clip conceptual) para estructurar el contenido didáctico.</p>

            <form onSubmit={handleCreateLesson} className="mt-4 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Título de la Lección</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Ej: Costo de Capital Promedio Ponderado (WACC)"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Descripción</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Breve introducción conceptual..."
                  rows={2}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50 font-normal leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Tema / Sección Organizadora</label>
                <input
                  type="text"
                  required
                  value={lessonForm.section}
                  onChange={(e) => setLessonForm({ ...lessonForm, section: e.target.value })}
                  placeholder="Ej: Estructura de Capital"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Video playback URL</label>
                <input
                  type="url"
                  required
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Duración (segundos)</label>
                  <input
                    type="number"
                    required
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Orden Secuencia</label>
                  <input
                    type="number"
                    required
                    value={lessonForm.sequenceOrder}
                    onChange={(e) => setLessonForm({ ...lessonForm, sequenceOrder: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded-xl transition font-bold cursor-pointer text-center"
                >
                  Agregar Lección
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateLessonModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 rounded-xl font-semibold hover:bg-slate-900 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

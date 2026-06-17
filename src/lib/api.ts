/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Global client-side configuration representing backend flags and headers
export const FEATURE_FLAGS = {
  enableAiGrading: true,
  enablePwa: true,
  videoProvider: 'local_mock',
  ttsProvider: 'mock',
};

export class ApiError extends Error {
  status: number;
  details: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelayMs?: number;
}

/**
 * Robust HTTP client with automatic fetch retries, request interceptors,
 * and unified API response formats.
 */
export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { retries = 2, retryDelayMs = 1000, ...fetchConfig } = options;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = `${baseUrl}${endpoint}`;

  // Request Interceptor: Bind standard security and environment simulation headers
  const headers = new Headers(fetchConfig.headers || {});
  if (!headers.has('Content-Type') && !(fetchConfig.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Fetch Supabase Auth JWT from standard browser storage
  const activeToken = localStorage.getItem('supabase_auth_token');
  if (activeToken) {
    headers.set('Authorization', `Bearer ${activeToken}`);
  }

  // Sandbox simulation views: support teaching versus studying modes
  const viewMode = localStorage.getItem('sandbox_view_mode') || 'student';
  headers.set('x-view-mode', viewMode);

  const mockUserId = localStorage.getItem('sandbox_mock_user_id');
  if (mockUserId) {
    headers.set('x-mock-user-id', mockUserId);
  }

  const configuredOptions = {
    ...fetchConfig,
    headers,
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, configuredOptions);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (_) {
          // Fallback if not json
        }
        throw new ApiError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorData.details || null
        );
      }

      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        throw new ApiError(
          `La respuesta del servidor no es un JSON válido (recibido: ${contentType || 'Ninguno'}). Esto ocurre si la URL del backend no está configurada en VITE_API_URL o si el servidor retornó HTML.`,
          response.status
        );
      }

      const json = await response.json();
      return json as T;
    } catch (err: any) {
      lastError = err;
      
      const isRetryable = err instanceof ApiError ? err.status >= 500 : true;
      if (attempt < retries && isRetryable) {
        const backoff = retryDelayMs * Math.pow(2, attempt);
        console.warn(`[API Client] Attempt ${attempt + 1} failed. Retrying in ${backoff}ms... Error: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error(`Failed to dispatch request to ${endpoint}`);
}

// Concrete fetch helpers mapping core domains
export const api = {
  // Authentication
  getProfile: () => apiFetch<any>('/api/auth/me'),
  updateRole: (role: 'student' | 'instructor') => apiFetch<any>('/api/auth/role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  }),
  loginSimulated: (email: string) => apiFetch<{ token: string; profile: any }>('/api/auth/login-simulated', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  getAllowedEmails: () => apiFetch<any[]>('/api/auth/allowed-emails'),
  addAllowedEmail: (payload: { email: string; role: string; fullName: string }) => apiFetch<any>('/api/auth/allowed-emails', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  deleteAllowedEmail: (email: string) => apiFetch<any>(`/api/auth/allowed-emails/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  }),

  // Courses & Clips
  getCourses: (difficulty?: string) => {
    const query = difficulty ? `?difficulty=${difficulty}` : '';
    return apiFetch<any[]>(`/api/courses${query}`);
  },
  getCourseDetails: (id: string) => apiFetch<any>(`/api/courses/${id}`),

  // Student progress logging
  getProgress: (courseId: string) => apiFetch<any>(`/api/progress/${courseId}`),
  logProgress: (payload: {
    courseId: string;
    clipId: string;
    watchedSeconds: number;
    isCompleted?: boolean;
  }) => apiFetch<any>('/api/progress', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Exercises
  submitExercise: (exerciseId: string, userAnswer: string) => apiFetch<any>(`/api/exercises/${exerciseId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ userAnswer }),
  }),
  getAttempts: (exerciseId: string) => apiFetch<any[]>(`/api/exercises/${exerciseId}/attempts`),

  // Teacher pipeline
  getPipelineReviews: () => apiFetch<any[]>('/api/pipeline/reviews'),
  patchPipelineStatus: (id: string, status: string, notes?: string) => apiFetch<any>(`/api/pipeline/reviews/${id}/patch`, {
    method: 'POST',
    body: JSON.stringify({ status, reviewerNotes: notes }),
  }),
  triggerDraftPipeline: (payload: {
    inputPrompt: string;
    voiceModel?: string;
    videoPrompt?: string;
    clipId?: string;
  }) => apiFetch<any>('/api/pipeline/create-draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Questions / Chat API
  getQuestions: () => apiFetch<any[]>('/api/auth/questions'),
  askQuestion: (payload: { courseId: string; courseTitle: string; clipId: string; clipTitle: string; questionText: string }) => apiFetch<any>('/api/auth/questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  replyQuestion: (id: string, replyText: string) => apiFetch<any>(`/api/auth/questions/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ replyText }),
  }),

  // Course Management API (Instructor/Admin only)
  updateCourse: (id: string, payload: any) => apiFetch<any>(`/api/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteCourse: (id: string) => apiFetch<any>(`/api/courses/${id}`, {
    method: 'DELETE',
  }),
  addClip: (courseId: string, payload: any) => apiFetch<any>(`/api/courses/${courseId}/clips`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateClip: (courseId: string, clipId: string, payload: any) => apiFetch<any>(`/api/courses/${courseId}/clips/${clipId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteClip: (courseId: string, clipId: string) => apiFetch<any>(`/api/courses/${courseId}/clips/${clipId}`, {
    method: 'DELETE',
  }),

  // Account Ingestion & Management / Authentication
  submitRegisterRequest: (payload: { fullName: string; email: string; role: string; specialty?: string }) => apiFetch<any>('/api/auth/register-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  loginWithCredentials: (email: string, password: string) => apiFetch<any>('/api/auth/login-credentials', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  forceChangePassword: (payload: { email: string; currentTempPassword: string; newPassword: string }) => apiFetch<any>('/api/auth/change-password-force', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  verifyOtp: (payload: { email: string; otpCode: string }) => apiFetch<{ token: string; profile: any }>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRegisterRequests: () => apiFetch<any[]>('/api/auth/register-requests'),
  approveRegisterRequest: (id: string) => apiFetch<any>(`/api/auth/register-requests/${id}/approve`, {
    method: 'POST',
  }),
  rejectRegisterRequest: (id: string) => apiFetch<any>(`/api/auth/register-requests/${id}/reject`, {
    method: 'POST',
  }),
};


import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data);

export const fetchAuthStatus = () =>
  api.get('/auth/status').then((r) => r.data);
// ── Garmin ──────────────────────────────────────────────────────────────────
export const fetchGarminSummary = (days = 7) =>
  api.get('/garmin/summary', { params: { days } }).then((r) => r.data);

// ── Metrics ─────────────────────────────────────────────────────────────────
export interface UserProfile {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: string;
  activity_level: string;
  goal: string;
}

export const calculateMetrics = (profile: UserProfile) =>
  api.post('/metrics/calculate', profile).then((r) => r.data);

export const fetchProfile = () =>
  api.get('/metrics/profile').then((r) => r.data);

// ── Exercise ─────────────────────────────────────────────────────────────────
export const fetchExerciseSuggestions = () =>
  api.get('/exercise/suggestions').then((r) => r.data);

// ── Diet ─────────────────────────────────────────────────────────────────────
export const fetchDietPlan = () =>
  api.get('/diet/recommendations').then((r) => r.data);

// ── Logs ─────────────────────────────────────────────────────────────────────
export const addWorkoutLog = (data: object) =>
  api.post('/logs/workout', data).then((r) => r.data);

export const fetchWorkoutLogs = (date?: string) =>
  api.get('/logs/workout', { params: date ? { log_date: date } : {} }).then((r) => r.data);

export const deleteWorkoutLog = (id: number) =>
  api.delete(`/logs/workout/${id}`).then((r) => r.data);

export const addMealLog = (data: object) =>
  api.post('/logs/meal', data).then((r) => r.data);

export const fetchMealLogs = (date?: string) =>
  api.get('/logs/meal', { params: date ? { log_date: date } : {} }).then((r) => r.data);

export const deleteMealLog = (id: number) =>
  api.delete(`/logs/meal/${id}`).then((r) => r.data);

export const fetchDailySummary = (date?: string) =>
  api.get('/logs/summary', { params: date ? { log_date: date } : {} }).then((r) => r.data);

// ── Chat (streaming) ─────────────────────────────────────────────────────────
export interface ChatMessage { role: 'user' | 'assistant'; content: string }

export async function streamChat(
  messages: ChatMessage[],
  context: string | null,
  onToken: (token: string) => void
): Promise<void> {
  const response = await fetch('/api/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value));
  }
}

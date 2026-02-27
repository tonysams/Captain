import * as SecureStore from 'expo-secure-store';
import type { CoachingResponse } from '../types/coaching';
import type { AnalyzedFrame, FocusArea, Session, SessionNote, SkillLevel, Student } from '../types/session';
import type { PoseKeypoint } from '../types/pose';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token');
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? `API error ${response.status}`);
  }

  return response.json();
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(params: {
  studentId?: string;
  focusArea: FocusArea;
  skillLevel: SkillLevel;
}): Promise<{ session: Session }> {
  return apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSession(sessionId: string): Promise<{
  session: Session & { frames: AnalyzedFrame[] };
  estimatedCostUsd: number;
}> {
  return apiFetch(`/sessions/${sessionId}`);
}

export async function getSessionReport(sessionId: string): Promise<{ report: unknown }> {
  return apiFetch(`/sessions/${sessionId}/report`);
}

export async function addSessionNote(
  sessionId: string,
  content: string,
): Promise<{ note: SessionNote }> {
  return apiFetch(`/sessions/${sessionId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ─── Frames ──────────────────────────────────────────────────────────────────

export async function uploadFrame(params: {
  sessionId: string;
  frameIndex: number;
  timestamp: number;
  imageBase64: string;
  poseKeypoints: PoseKeypoint[];
  context: {
    skillLevel: SkillLevel;
    focusArea: FocusArea;
    previousNote?: string;
  };
}): Promise<{
  frameId: string;
  analysisId: string;
  coaching: CoachingResponse;
}> {
  const { sessionId, ...body } = params;
  return apiFetch(`/sessions/${sessionId}/frames`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function listStudents(): Promise<{ students: Student[] }> {
  return apiFetch('/students');
}

export async function getStudent(studentId: string): Promise<{
  student: Student;
  sessions: Session[];
}> {
  return apiFetch(`/students/${studentId}`);
}

export async function createStudent(params: {
  email: string;
  name: string;
  skillLevel: SkillLevel;
  notes?: string;
}): Promise<{ studentId: string; email: string }> {
  return apiFetch('/students', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function assignSessionToStudent(
  studentId: string,
  sessionId: string,
): Promise<{ success: boolean }> {
  return apiFetch(`/students/${studentId}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getCostAnalytics(): Promise<{
  period: string;
  sessionCount: number;
  totalFramesAnalyzed: number;
  estimatedCostUsd: number;
  avgFramesPerSession: number;
}> {
  return apiFetch('/analytics/costs');
}

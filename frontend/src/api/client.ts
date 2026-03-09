import type { Person, EprRecord, CreateEprBody, UpdateEprBody, EprSummary } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let currentUserId: string | undefined;

export function setCurrentUserId(id: string | undefined) {
  currentUserId = id;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── People ───────────────────────────────────────────────────────────────────
export function getPeople(params?: { role?: string; search?: string }): Promise<Person[]> {
  const qs = new URLSearchParams();
  if (params?.role) qs.set('role', params.role);
  if (params?.search) qs.set('search', params.search);
  return request<Person[]>(`/api/people${qs.toString() ? `?${qs}` : ''}`);
}

// ─── EPR ──────────────────────────────────────────────────────────────────────
export function getEprs(personId: string): Promise<EprRecord[]> {
  return request<EprRecord[]>(`/api/epr?personId=${personId}`);
}

export function getEpr(id: string): Promise<EprRecord> {
  return request<EprRecord>(`/api/epr/${id}`);
}

export function createEpr(body: CreateEprBody): Promise<EprRecord> {
  return request<EprRecord>('/api/epr', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateEpr(id: string, body: UpdateEprBody): Promise<EprRecord> {
  return request<EprRecord>(`/api/epr/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function getEprSummary(personId: string): Promise<EprSummary> {
  return request<EprSummary>(`/api/epr/summary/${personId}`);
}

export function getAssistRemarks(payload: {
  overallRating: number;
  technicalSkillsRating: number;
  nonTechnicalSkillsRating: number;
}): Promise<{ suggestedRemarks: string }> {
  return request<{ suggestedRemarks: string }>('/api/epr/assist', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

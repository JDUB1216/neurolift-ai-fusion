const API_BASE = process.env.NEUROLIFT_API_URL ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  avatars: {
    list: () => request<{ id: string; name: string; adhd_traits: string[] }[]>('/avatars/'),
    get: (id: string) => request<{ id: string; name: string; adhd_traits: string[] }>(`/avatars/${id}`),
  },
  simulation: {
    start: (body: { avatar_id: string; user_id: string; scenario_id?: string }) =>
      request<{ session_id: string; status: string }>('/simulation/start', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    step: (body: { session_id: string; action: string }) =>
      request('/simulation/step', { method: 'POST', body: JSON.stringify(body) }),
    pause: (sessionId: string) =>
      request(`/simulation/pause/${sessionId}`, { method: 'POST' }),
    resume: (sessionId: string) =>
      request(`/simulation/resume/${sessionId}`, { method: 'POST' }),
    state: (sessionId: string) =>
      request(`/simulation/state/${sessionId}`),
  },
  sessions: {
    forUser: (userId: string) => request(`/sessions/user/${userId}`),
  },
}

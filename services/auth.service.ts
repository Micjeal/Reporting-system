import { apiPost } from '@/services/api-client'

export function signup(payload: {
  email: string
  password: string
  fullName: string
  phone: string
  region?: string
}) {
  return apiPost<{ userId: string; status: 'pending' }, typeof payload>('/api/auth/signup', payload)
}

export function login(payload: { email: string; password: string }) {
  return apiPost<{ userId: string; role: string; status: string }, typeof payload>('/api/auth/login', payload)
}

export function logout() {
  return apiPost<{ success: true }, {}>('/api/auth/logout', {})
}

export function resetPassword(payload: { access_token: string; password: string; confirm_password: string }) {
  return apiPost<{ message: string; success: boolean }, typeof payload>('/api/auth/reset-password', payload)
}


export async function getCurrentUser() {
  const res = await fetch('/api/users/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch current user');
  }

  const data = await res.json();
  return data.data || data;
}

/**
 * Admin Service
 * Handles admin-specific API operations for profile management
 */

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'agent'
  status: 'pending' | 'active' | 'rejected' | 'suspended'
  name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface AdminProfileUpdate {
  name?: string
  phone?: string
}

/**
 * Get current admin user profile
 * @returns Promise<AdminUser> - The current admin user data
 * @throws Error if the request fails
 */
export async function getCurrentAdmin(): Promise<AdminUser> {
  const res = await fetch('/api/users/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch admin profile')
  }

  const data = await res.json()
  return data.data || data
}

/**
 * Update current admin user profile
 * @param updates - The profile fields to update (name, phone)
 * @returns Promise<AdminUser> - The updated admin user data
 * @throws Error if the request fails or validation fails
 */
export async function updateCurrentAdmin(updates: AdminProfileUpdate): Promise<AdminUser> {
  const res = await fetch('/api/users/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to update admin profile')
  }

  const data = await res.json()
  return data.data || data
}

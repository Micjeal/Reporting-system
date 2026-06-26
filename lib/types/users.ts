export type UserRole = 'admin' | 'manager' | 'agent'
export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}

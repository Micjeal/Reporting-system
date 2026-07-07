import { redirect } from 'next/navigation'

export default function Page() {
  // Simple synchronous redirect to /login
  // This bypasses all async operations and Supabase queries
  redirect('/login')
}

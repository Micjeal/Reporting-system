import { redirect } from 'next/navigation'

export default async function Page() {
  // For now, just redirect to login
  // This allows the app to work while we debug the Supabase connection
  redirect('/login')
}

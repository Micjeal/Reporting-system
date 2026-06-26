import type { Metadata } from 'next'
import AnalyticsPage from '@/components/admin/analytics-page'

export const metadata: Metadata = {
  title: 'Analytics - Route Sales Management',
  description: 'Analytics dashboard for Route Sales Management',
}

export default function AdminAnalyticsPage() {
  return <AnalyticsPage />
}


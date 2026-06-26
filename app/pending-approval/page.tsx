'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as authService from '@/services/auth.service'

export default function PendingApprovalPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Pending Approval</CardTitle>
          <CardDescription className="text-center">
            Your account needs to be approved before you can continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you believe this is a mistake, confirm your profile row exists in the `users` table and
              that your Supabase RLS policy allows the logged-in user to read their own profile.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <Button
              disabled={isLoggingOut}
              onClick={async () => {
                setIsLoggingOut(true)
                try {
                  await authService.logout()
                } finally {
                  setIsLoggingOut(false)
                  router.push('/login')
                }
              }}
            >
              Sign out
            </Button>

            <Button variant="outline" asChild>
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


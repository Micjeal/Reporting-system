'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as authService from '@/services/auth.service'

export default function UnauthorizedPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Unauthorized</CardTitle>
          <CardDescription className="text-center">
            You don’t have access to this page.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              If you should have access, verify your `users.role` and `users.status` values in Supabase.
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
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


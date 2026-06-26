'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, MapPin, Calendar, Edit2, Save, X, Shield, LogOut, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Adjust these imports to match your project structure
import * as agentsService from '@/services/agents.service'
import * as authService from '@/services/auth.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().or(z.literal('')),
  region: z.string().optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface AgentProfile {
  id: string
  user_id: string
  name: string
  phone: string
  region: string
  created_at: string
}

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      region: '',
    },
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const agentData = await agentsService.getCurrentAgent()
      setProfile(agentData)
      
      form.reset({
        name: agentData.name || '',
        phone: agentData.phone || '',
        region: agentData.region || '',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await authService.logout()
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      })
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      })
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleSubmit = async (data: ProfileFormData) => {
    setSubmitting(true)
    try {
      const updated = await agentsService.updateCurrentAgent(data)
      setProfile(updated)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        phone: profile.phone || '',
        region: profile.region || '',
      })
    }
    setIsEditing(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full shadow-sm">
          <CardContent className="py-12 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Profile Unavailable</h3>
            <p className="text-sm text-muted-foreground mb-6">We couldn't load your profile information. Please try refreshing the page.</p>
            <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20 lg:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header */}
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-base text-muted-foreground">
            Manage your profile details and account security.
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Quick Snapshot */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-border/60">
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-sm">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-1 line-clamp-1">{profile.name}</h2>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Sales Agent</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-0">
                  Active Account
                </Badge>
              </CardContent>
              <Separator />
              <CardContent className="py-4 space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Joined
                  </span>
                  <span className="font-medium text-foreground">{formatDate(profile.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Region
                  </span>
                  <span className="font-medium text-foreground">{profile.region || 'Not set'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Detailed Settings */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Personal Information Form */}
            <Card className="shadow-sm border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Update your contact details and location.</CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="h-8">
                    <Edit2 className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region / Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Kampala" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting && <Spinner className="mr-2 h-4 w-4" />}
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                        <Button type="button" variant="ghost" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" /> Full Name
                      </p>
                      <p className="text-base font-medium">{profile.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone Number
                      </p>
                      <p className="text-base font-medium">{profile.phone || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Region
                      </p>
                      <p className="text-base font-medium">{profile.region || '—'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account & Security Section */}
            <Card className="shadow-sm border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">System Information</CardTitle>
                <CardDescription>Internal system identifiers and access levels.</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account ID</p>
                    <p className="text-sm font-mono truncate">{profile.id}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</p>
                    <p className="text-sm font-mono truncate">{profile.user_id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="shadow-sm border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Account Actions</CardTitle>
                <CardDescription>Manage your active session across devices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-foreground">Sign Out</h4>
                    <p className="text-sm text-muted-foreground mt-1">End your current session safely. You will need to log back in to access the dashboard.</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    {isLoggingOut ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

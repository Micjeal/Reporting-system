'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Phone, Mail, Calendar, Edit3, Save, 
  ShieldCheck, LogOut, CheckCircle2, AlertTriangle, Fingerprint 
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import * as adminService from '@/services/admin.service'
import * as authService from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// --- Types & Schema ---
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'agent'
  status: 'pending' | 'active' | 'rejected' | 'suspended'
  name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '' },
  })

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const userData = await adminService.getCurrentAdmin()
      setUser(userData)
      form.reset({ name: userData.name || '', phone: userData.phone || '' })
    } catch (error) {
      toast({
        title: 'Session Expired',
        description: 'Please authenticate again to access your settings.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [form, toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await authService.logout()
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast({ title: 'Logout Failed', variant: 'destructive' })
      setIsLoggingOut(false)
    }
  }

  const handleSubmit = async (data: ProfileFormData) => {
    setSubmitting(true)
    try {
      const updated = await adminService.updateCurrentAdmin(data)
      setUser(updated)
      setIsEditing(false)
      toast({ title: 'Profile synchronized successfully.' })
    } catch (error) {
      toast({ title: 'Update Failed', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (user) form.reset({ name: user.name || '', phone: user.phone || '' })
    setIsEditing(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? dateStr : new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    }).format(d)
  }

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Decrypting profile...</p>
        </div>
      </div>
    )
  }

  // --- Error State ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-10 text-center">
          <div className="mx-auto h-20 w-20 bg-rose-100 dark:bg-rose-950/50 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold mb-3 tracking-tight">Access Denied</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            We couldn't verify your credentials. Your session may have timed out for security purposes.
          </p>
          <Button onClick={() => window.location.reload()} size="lg" className="rounded-full w-full shadow-lg hover:shadow-xl transition-all">
            Re-authenticate
          </Button>
        </div>
      </div>
    )
  }

  // --- Main View ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-50 pb-20 lg:pb-12 font-sans selection:bg-primary/20">
      
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              Workspace Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage your preferences and digital identity.
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: ID Card */}
          <div className="xl:col-span-4 space-y-8">
            <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              {/* Card Banner */}
              <div className="h-32 bg-gradient-to-br from-primary/80 to-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
              </div>
              
              <div className="px-8 pb-8 flex flex-col items-center -mt-16 relative z-10">
                {/* Avatar */}
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-lg">
                    <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      {!avatarError ? (
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}&backgroundColor=transparent`}
                          alt="Avatar"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <User className="h-12 w-12 text-slate-400" />
                      )}
                    </div>
                  </div>
                  {user.status === 'active' && (
                    <div className="absolute bottom-2 right-2 h-6 w-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="text-center mt-5 w-full">
                  <h2 className="text-2xl font-bold tracking-tight truncate px-2">
                    {user.name || 'Anonymous User'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 w-fit mx-auto px-4 py-1.5 rounded-full">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold capitalize tracking-wide">{user.role}</span>
                  </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-6"></div>

                {/* Meta Data */}
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Enrolled
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Fingerprint className="h-4 w-4" /> Clearance
                    </span>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-950/30 rounded-full px-3">
                      Level {user.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Settings Panels */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Identity Panel */}
            <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Identity Details</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage the personal information associated with your clearance.</p>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="secondary" className="rounded-full shadow-sm hover:shadow">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Update Info
                  </Button>
                )}
              </div>

              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-slate-700 dark:text-slate-300">Full Legal Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 h-12 rounded-xl px-4 focus-visible:ring-primary/20" 
                                {...field} 
                              />
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
                            <FormLabel className="text-slate-700 dark:text-slate-300">Direct Contact</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+256 (000) 000-000" 
                                className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 h-12 rounded-xl px-4 focus-visible:ring-primary/20" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Authenticated Email</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{user.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button type="submit" disabled={submitting} className="rounded-xl h-11 px-8 shadow-md">
                        {submitting && <Spinner className="mr-2 h-4 w-4" />}
                        <Save className="mr-2 h-4 w-4" />
                        Commit Changes
                      </Button>
                      <Button type="button" variant="ghost" onClick={handleCancel} className="rounded-xl h-11 hover:bg-slate-100 dark:hover:bg-slate-800">
                        Discard
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                  <div className="group">
                    <span className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" /> Display Name
                    </span>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{user.name || '—'}</p>
                  </div>
                  <div className="group">
                    <span className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4" /> Primary Phone
                    </span>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{user.phone || '—'}</p>
                  </div>
                  <div className="group md:col-span-2 bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4" /> Communication Channel
                    </span>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{user.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Panel */}
            <div className="bg-rose-50/50 dark:bg-rose-950/10 backdrop-blur-xl border border-rose-100 dark:border-rose-900/30 rounded-3xl p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 tracking-tight">
                    <LogOut className="h-5 w-5" /> Session Control
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
                    Terminate your current active session. You will be required to provide your credentials upon your next visit.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-xl px-8 h-12 shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-600 w-full sm:w-auto"
                >
                  {isLoggingOut ? (
                    <><Spinner className="mr-2 h-4 w-4" /> Terminating...</>
                  ) : (
                    'End Session'
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
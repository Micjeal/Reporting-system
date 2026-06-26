'use client'

import { useState, useEffect } from 'react'
import { Mail, Smartphone, Bell, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Spinner } from '@/components/ui/spinner'

interface NotificationChannelPreferences {
  salesAlerts: boolean
  inventoryAlerts: boolean
  userApprovals: boolean
  systemUpdates?: boolean
}

interface NotificationPreferences {
  email: NotificationChannelPreferences
  push: NotificationChannelPreferences
  inApp: NotificationChannelPreferences
}

const defaultPreferences: NotificationPreferences = {
  email: {
    salesAlerts: true,
    inventoryAlerts: true,
    userApprovals: true,
    systemUpdates: true,
  },
  push: {
    salesAlerts: true,
    inventoryAlerts: true,
    userApprovals: true,
  },
  inApp: {
    salesAlerts: true,
    inventoryAlerts: true,
    userApprovals: true,
    systemUpdates: true,
  },
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // TODO: Fetch preferences from API
    // const fetchPreferences = async () => {
    //   const data = await getUserSettings()
    //   setPreferences(data.notification_preferences)
    // }
    // fetchPreferences()
    
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  const handleToggle = (channel: keyof NotificationPreferences, type: keyof NotificationChannelPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type],
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Save to API
      // await updateUserSettings({ notification_preferences: preferences })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Preferences Saved',
        description: 'Your notification settings have been updated.',
      })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="space-y-8">
        {/* Email Notifications */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Email Notifications</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Receive updates via email</p>
            </div>
          </div>
          <div className="space-y-4 ml-13">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Sales Alerts</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Get notified about new sales</p>
              </div>
              <Switch
                checked={preferences.email.salesAlerts}
                onCheckedChange={() => handleToggle('email', 'salesAlerts')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Inventory Alerts</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Low stock notifications</p>
              </div>
              <Switch
                checked={preferences.email.inventoryAlerts}
                onCheckedChange={() => handleToggle('email', 'inventoryAlerts')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">User Approvals</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">New user registration requests</p>
              </div>
              <Switch
                checked={preferences.email.userApprovals}
                onCheckedChange={() => handleToggle('email', 'userApprovals')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">System Updates</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Important system announcements</p>
              </div>
              <Switch
                checked={preferences.email.systemUpdates || false}
                onCheckedChange={() => handleToggle('email', 'systemUpdates')}
              />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Push Notifications</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Mobile and desktop alerts</p>
            </div>
          </div>
          <div className="space-y-4 ml-13">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Sales Alerts</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Instant sales notifications</p>
              </div>
              <Switch
                checked={preferences.push.salesAlerts}
                onCheckedChange={() => handleToggle('push', 'salesAlerts')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Inventory Alerts</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Critical stock updates</p>
              </div>
              <Switch
                checked={preferences.push.inventoryAlerts}
                onCheckedChange={() => handleToggle('push', 'inventoryAlerts')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">User Approvals</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Approval requests</p>
              </div>
              <Switch
                checked={preferences.push.userApprovals}
                onCheckedChange={() => handleToggle('push', 'userApprovals')}
              />
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">In-App Notifications</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Notifications within the dashboard</p>
            </div>
          </div>
          <div className="space-y-4 ml-13">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Sales Alerts</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard sales updates</p>
              </div>
              <Switch
                checked={preferences.inApp.salesAlerts}
                onCheckedChange={() => handleToggle('inApp', 'salesAlerts')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Inventory Alerts</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Stock level warnings</p>
              </div>
              <Switch
                checked={preferences.inApp.inventoryAlerts}
                onCheckedChange={() => handleToggle('inApp', 'inventoryAlerts')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">User Approvals</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending user actions</p>
              </div>
              <Switch
                checked={preferences.inApp.userApprovals}
                onCheckedChange={() => handleToggle('inApp', 'userApprovals')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">System Updates</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Platform announcements</p>
              </div>
              <Switch
                checked={preferences.inApp.systemUpdates || false}
                onCheckedChange={() => handleToggle('inApp', 'systemUpdates')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl h-11 px-8 shadow-md"
        >
          {saving && <Spinner className="mr-2 h-4 w-4" />}
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  )
}

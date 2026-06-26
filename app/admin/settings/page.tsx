'use client'

import { useState } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  ShieldAlert,
  BarChart2,
  Users,
  Loader2,
} from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

type NotificationSetting = {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  channels: {
    email: boolean
    push: boolean
  }
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'security_alerts',
    label: 'Security Alerts',
    description:
      'Login attempts, password changes, and permission updates.',
    icon: <ShieldAlert className="h-4 w-4" />,
    channels: {
      email: true,
      push: true,
    },
  },
  {
    id: 'sales_activity',
    label: 'Sales Activity',
    description: 'New sales records created or updated.',
    icon: <BarChart2 className="h-4 w-4" />,
    channels: {
      email: true,
      push: false,
    },
  },
  {
    id: 'user_management',
    label: 'User Management',
    description: 'User approvals, rejections, and role changes.',
    icon: <Users className="h-4 w-4" />,
    channels: {
      email: true,
      push: true,
    },
  },
  {
    id: 'system_notifications',
    label: 'System Notifications',
    description:
      'Platform updates, maintenance windows, and errors.',
    icon: <Bell className="h-4 w-4" />,
    channels: {
      email: false,
      push: false,
    },
  },
]

function NotificationPreferences() {
  const [settings, setSettings] =
    useState<NotificationSetting[]>(defaultSettings)

  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  const toggle = (
    id: string,
    channel: 'email' | 'push'
  ) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id
          ? {
              ...setting,
              channels: {
                ...setting.channels,
                [channel]:
                  !setting.channels[channel],
              },
            }
          : setting
      )
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Simulated API request
      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      )

      toast({
        title: 'Preferences Saved',
        description:
          'Your notification settings have been updated.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description:
          'Failed to save notification settings.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Notification Preferences
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage how your platform notifications are delivered.
        </p>
      </div>

      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-[1fr_100px_100px] gap-4 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Notification Type</span>

        <span className="flex items-center justify-center gap-1">
          <Mail className="h-3 w-3" />
          Email
        </span>

        <span className="flex items-center justify-center gap-1">
          <Smartphone className="h-3 w-3" />
          Push
        </span>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px] gap-4 items-center rounded-2xl border bg-background p-5 shadow-sm"
          >
            {/* Info */}
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                {setting.icon}
              </div>

              <div>
                <h3 className="text-sm font-semibold">
                  {setting.label}
                </h3>

                <p className="text-xs text-muted-foreground">
                  {setting.description}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between sm:justify-center">
              <span className="sm:hidden text-xs text-muted-foreground">
                Email
              </span>

              <Switch
                checked={setting.channels.email}
                onCheckedChange={() =>
                  toggle(setting.id, 'email')
                }
              />
            </div>

            {/* Push */}
            <div className="flex items-center justify-between sm:justify-center">
              <span className="sm:hidden text-xs text-muted-foreground">
                Push
              </span>

              <Switch
                checked={setting.channels.push}
                onCheckedChange={() =>
                  toggle(setting.id, 'push')
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 rounded-xl px-6"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="p-6">
      <NotificationPreferences />
    </div>
  )
}
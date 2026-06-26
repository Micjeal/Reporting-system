'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

type Theme = 'light' | 'dark' | 'system'

interface ThemeOption {
  value: Theme
  label: string
  description: string
  icon: typeof Sun
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Clean and bright interface',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follows your device settings',
    icon: Monitor,
  },
]

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme)
    
    // TODO: Persist to database via API
    // await updateUserSettings({ theme: newTheme })
    
    toast({
      title: 'Theme Updated',
      description: `Switched to ${newTheme} theme.`,
    })
  }

  if (!mounted) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map((option) => {
          const Icon = option.icon
          const isSelected = theme === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 hover:border-primary/50 hover:shadow-md'
                }
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
                </div>
              )}

              {/* Icon */}
              <div className={`
                h-12 w-12 rounded-xl flex items-center justify-center mb-4 mx-auto
                ${isSelected
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }
              `}>
                <Icon className="h-6 w-6" />
              </div>

              {/* Label */}
              <h4 className={`
                text-lg font-bold mb-1
                ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}
              `}>
                {option.label}
              </h4>

              {/* Description */}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {option.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Current Theme Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Current theme:</strong> {theme === 'system' ? 'Following system preferences' : `${theme?.charAt(0).toUpperCase()}${theme?.slice(1)} mode`}
        </p>
      </div>
    </div>
  )
}

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationButtonProps {
  hasUnread?: boolean
}

export function NotificationButton({ hasUnread = true }: NotificationButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className="size-5" />
      {hasUnread && (
        <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
      )}
    </Button>
  )
}

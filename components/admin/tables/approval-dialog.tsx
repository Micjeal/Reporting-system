'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'approve' | 'reject' | null
  onConfirm: () => void
  isLoading: boolean
}

export function ApprovalDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
  isLoading,
}: ApprovalDialogProps) {
  const isApprove = action === 'approve'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isApprove ? 'Approve User?' : 'Reject User?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isApprove
              ? 'This user will be approved and can access the system.'
              : 'This user will be rejected and cannot access the system.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isApprove ? '' : 'bg-red-600 hover:bg-red-700'}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isApprove ? 'Approve' : 'Reject'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function QuickActions() {
  const router = useRouter()

  const handleAddSale = () => {
    router.push('/agent/sales/new')
  }

  const handleAddExpense = () => {
    router.push('/agent/expenses')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={handleAddSale}
          size="lg"
          className="flex-1 sm:flex-none gap-3 h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <Plus size={24} />
          <span className="font-semibold">Record Sale</span>
        </Button>
        <Button
          onClick={handleAddExpense}
          size="lg"
          variant="outline"
          className="flex-1 sm:flex-none gap-3 h-14 text-lg border-2 hover:bg-accent hover:border-primary transition-all duration-300 hover:-translate-y-1"
        >
          <Plus size={24} />
          <span className="font-semibold">Add Expense</span>
        </Button>
      </div>
    </div>
  )
}

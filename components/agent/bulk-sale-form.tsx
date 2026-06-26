'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, ArrowLeft, Package, Plus, Trash2, DollarSign, Calendar } from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import * as salesService from '@/services/sales.service'

interface SaleItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
}

interface BulkSaleFormData {
  items: SaleItem[]
  saleDate: string
  customerName: string
  customerPhone: string
  location: string
  route: string
  bankDetails: string
  expensesTotal: number
  tokensDeducted: number
  returnsAmount: number
  notes: string
}

export function BulkSaleForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<BulkSaleFormData | null>(null)
  const { data: products } = useProducts()

  const [formData, setFormData] = useState<BulkSaleFormData>({
    items: [],
    saleDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    location: '',
    route: '',
    bankDetails: '',
    expensesTotal: 0,
    tokensDeducted: 0,
    returnsAmount: 0,
    notes: '',
  })

  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      productId: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
    }
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    })
  }

  const removeItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== id),
    })
  }

  const updateItem = (id: string, updates: Partial<SaleItem>) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) => {
        if (item.id !== id) return item

        const updated = { ...item, ...updates }

        // Auto-calculate total if product is selected
        if (updates.productId) {
          const product = products?.find((p) => p.id === updates.productId)
          if (product) {
            updated.unitPrice = product.unit_price ?? 0
            updated.totalAmount = updated.quantity * updated.unitPrice
          }
        }

        // Recalculate total if quantity changes
        if (updates.quantity !== undefined) {
          updated.totalAmount = updated.quantity * updated.unitPrice
        }

        return updated
      }),
    })
  }

  const stats = useMemo(() => {
    return {
      totalSales: formData.items.reduce((sum, item) => sum + item.totalAmount, 0),
      totalItems: formData.items.length,
      totalQuantity: formData.items.reduce((sum, item) => sum + item.quantity, 0),
    }
  }, [formData.items])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      if (formData.items.length === 0) {
        setSubmitError('Please add at least one product')
        setIsSubmitting(false)
        return
      }

      // Create the sale with all items
      await salesService.createSale({
        items: formData.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        sale_date: formData.saleDate,
        customer_name: formData.customerName || undefined,
        customer_phone: formData.customerPhone || undefined,
        location: formData.location || undefined,
        route: formData.route || undefined,
        bank_details: formData.bankDetails || undefined,
        expenses_total: formData.expensesTotal || undefined,
        tokens_deducted: formData.tokensDeducted || undefined,
        returns_amount: formData.returnsAmount || undefined,
        notes: formData.notes || undefined,
      })

      setSuccessData(formData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create sales. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successData) {
    return <BulkSaleSuccessCard data={successData} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Bulk Sales Entry</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Create multiple sales in one transaction</p>
            </div>
          </div>
        </div>

        {submitError && (
          <Alert variant="destructive" className="mb-6 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <p className="font-semibold">{submitError}</p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Items</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{stats.totalItems}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Total Quantity</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">{stats.totalQuantity}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Total Sales</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">${stats.totalSales.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Section */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Add products to this sale</CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {formData.items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 mb-4">No products added yet</p>
                  <Button
                    type="button"
                    onClick={addItem}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => {
                    const selectedProduct = products?.find((p) => p.id === item.productId)
                    return (
                      <div key={item.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white">Product {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {/* Product Select */}
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                              Product
                            </label>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updateItem(item.id, { productId: value })}
                            >
                              <SelectTrigger className="h-10 border-slate-300 dark:border-slate-700">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(products ?? []).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                              Qty
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                              }
                              className="h-10 border-slate-300 dark:border-slate-700"
                            />
                          </div>

                          {/* Unit Price */}
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                              Unit Price
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                                }
                                className="h-10 border-slate-300 dark:border-slate-700 pl-7 bg-slate-100 dark:bg-slate-800"
                                disabled={!!selectedProduct}
                              />
                            </div>
                          </div>

                          {/* Total */}
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                              Total
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.totalAmount.toFixed(2)}
                                disabled
                                className="h-10 border-emerald-300 dark:border-emerald-700 pl-7 bg-emerald-50 dark:bg-emerald-950/30 font-semibold text-emerald-700 dark:text-emerald-300"
                              />
                            </div>
                          </div>

                          {/* Product Name Display */}
                          <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                              Selected
                            </label>
                            <div className="h-10 flex items-center px-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-900 dark:text-blue-100 font-medium truncate">
                              {selectedProduct?.name || 'None'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer & Transaction Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b border-slate-200 dark:border-slate-800">
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Customer Name
                  </label>
                  <Input
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="h-10 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Phone Number
                  </label>
                  <Input
                    placeholder="+1 (555) 123-4567"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="h-10 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Location
                  </label>
                  <Input
                    placeholder="e.g., Downtown Store"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="h-10 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Route
                  </label>
                  <Input
                    placeholder="e.g., Route A"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className="h-10 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-slate-200 dark:border-slate-800">
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Sale Date
                  </label>
                  <Input
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    className="h-10 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Expenses
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.expensesTotal}
                      onChange={(e) => setFormData({ ...formData, expensesTotal: parseFloat(e.target.value) || 0 })}
                      className="h-10 border-slate-300 dark:border-slate-700 pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Tokens Deducted
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tokensDeducted}
                    onChange={(e) => setFormData({ ...formData, tokensDeducted: parseFloat(e.target.value) || 0 })}
                    className="h-10 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Returns Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.returnsAmount}
                      onChange={(e) => setFormData({ ...formData, returnsAmount: parseFloat(e.target.value) || 0 })}
                      className="h-10 border-slate-300 dark:border-slate-700 pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Bank Details
                  </label>
                  <Input
                    placeholder="Account reference"
                    value={formData.bankDetails}
                    onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                    className="h-10 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                placeholder="Add any notes about these sales..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-24 resize-none border-slate-300 dark:border-slate-700"
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-12 px-6 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || formData.items.length === 0}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating {formData.items.length} Sales...
                </div>
              ) : (
                `Create ${formData.items.length} Sale${formData.items.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface BulkSaleSuccessCardProps {
  data: BulkSaleFormData
}

function BulkSaleSuccessCard({ data }: BulkSaleSuccessCardProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/40 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-800">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-300" />
                </div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-emerald-900 dark:text-emerald-100">
                  All Sales Created Successfully! 🎉
                </CardTitle>
                <CardDescription className="text-emerald-800 dark:text-emerald-200 text-base mt-1">
                  {data.items.length} sales have been recorded in the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase">Total Sales Created</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{data.items.length}</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase">Total Amount</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  ${data.items.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase">Total Quantity</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {data.items.reduce((sum, item) => sum + item.quantity, 0)} units
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button
            onClick={() => router.push('/agent/sales/new')}
            className="h-12 text-base font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
            variant="outline"
          >
            Create More Sales
          </Button>
          <Button
            onClick={() => router.push('/agent/dashboard')}
            className="h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

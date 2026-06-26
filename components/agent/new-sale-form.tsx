'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { newSaleSchema, type NewSaleFormData } from '@/lib/schemas/sale-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, ArrowLeft, Package, User, DollarSign, Calendar } from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import * as salesService from '@/services/sales.service'

interface NewSaleFormProps {
  onSuccess?: () => void
}

export function NewSaleForm({ onSuccess }: NewSaleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<NewSaleFormData | null>(null)
  const { data: products } = useProducts()

  const form = useForm<NewSaleFormData>({
    resolver: zodResolver(newSaleSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
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
      paymentMethod: 'cash',
    },
  })

  const selectedProductId = form.watch('productId')
  const quantity = form.watch('quantity')
  const selectedProduct = useMemo(() => {
    return (products ?? []).find((p) => p.id === selectedProductId) ?? null
  }, [selectedProductId, products])

  useEffect(() => {
    if (selectedProduct) {
      const price = selectedProduct.unit_price ?? 0
      form.setValue('unitPrice', price)
      form.clearErrors('unitPrice')
    }
  }, [selectedProduct, form])

  useEffect(() => {
    if (selectedProduct && quantity > 0) {
      const unitPrice = selectedProduct.unit_price ?? 0
      const total = quantity * unitPrice
      form.setValue('totalAmount', parseFloat(total.toFixed(2)))
      form.clearErrors('totalAmount')
    }
  }, [quantity, selectedProduct, form])

  async function onSubmit(data: NewSaleFormData) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await salesService.createSale({
        items: [{
          product_id: String(data.productId),
          quantity: data.quantity,
          unit_price: data.unitPrice,
        }],
        sale_date: typeof data.saleDate === 'string' ? data.saleDate : (data.saleDate as Date).toISOString().slice(0, 10),
        customer_name: data.customerName || undefined,
        customer_phone: data.customerPhone || undefined,
        location: data.location || undefined,
        route: data.route || undefined,
        bank_details: data.bankDetails || undefined,
        expenses_total: data.expensesTotal || undefined,
        tokens_deducted: data.tokensDeducted || undefined,
        returns_amount: data.returnsAmount || undefined,
        payment_method: data.paymentMethod,
        notes: data.notes || undefined,
      })

      setSuccessData(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create sale. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successData) {
    return <SaleSuccessCard data={successData} onAddAnother={() => {
      setSuccessData(null)
      form.reset()
    }} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Create New Sale</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Record a new sales transaction</p>
            </div>
          </div>
        </div>

        {submitError && (
          <Alert variant="destructive" className="mb-6 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <div className="space-y-2">
                <p className="font-semibold">{submitError}</p>
                {submitError.includes('Insufficient issued inventory') && (
                  <p className="text-sm opacity-90">
                    💡 Tip: You need to issue inventory to yourself first. Go to the Inventory tab and issue products before you can sell them.
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Product & Quantity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Selection Card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <CardTitle>Product Details</CardTitle>
                      <CardDescription>Select product and quantity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <div className="space-y-6">
                      {/* Product Selector */}
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-slate-900 dark:text-white">
                              Product
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                                  <SelectValue placeholder="🔍 Select a product..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                                {(products ?? []).length === 0 ? (
                                  <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                                    No products available
                                  </div>
                                ) : (
                                  (products ?? []).map((product) => (
                                    <SelectItem 
                                      key={product.id} 
                                      value={product.id}
                                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 focus:bg-blue-100 dark:focus:bg-blue-900 py-3 px-4"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1">
                                          <span className="font-semibold text-slate-900 dark:text-white">
                                            {product.name}
                                          </span>
                                          <span className="text-xs text-slate-500 dark:text-slate-400">
                                            💰 ${product.unit_price} per unit
                                          </span>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {selectedProduct && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                  <span className="font-semibold">Selected:</span> {selectedProduct.name}
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                  <span className="font-semibold">Unit Price:</span> ${selectedProduct.unit_price}
                                </p>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity and Pricing Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Quantity Input */}
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white">
                                Quantity
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  placeholder="0"
                                  className="h-12 text-lg border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                                  min="1"
                                  max={9999}
                                  {...field}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value, 10) : 0
                                    field.onChange(val)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Unit Price (Read-only) */}
                        <FormField
                          control={form.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white">
                                Unit Price
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-12 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 pl-7"
                                    placeholder="0.00"
                                    disabled
                                    {...field}
                                    value={field.value ? field.value.toFixed(2) : '0.00'}
                                    onChange={() => {}}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Total Amount (Read-only) */}
                        <FormField
                          control={form.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white">
                                Total
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-12 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-emerald-300 dark:border-emerald-700 pl-7 font-bold text-emerald-700 dark:text-emerald-300"
                                    placeholder="0.00"
                                    disabled
                                    {...field}
                                    value={field.value ? field.value.toFixed(2) : '0.00'}
                                    onChange={() => {}}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Form>
                </CardContent>
              </Card>

              {/* Customer & Location Card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <CardTitle>Customer Information</CardTitle>
                      <CardDescription>Optional customer details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Name */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Customer Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter customer name"
                                className="h-10 border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Customer Phone */}
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                className="h-10 border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Location */}
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Location</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Downtown Store"
                                className="h-10 border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Route */}
                      <FormField
                        control={form.control}
                        name="route"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Route</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Route A"
                                className="h-10 border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Additional Info */}
            <div className="space-y-6">
              {/* Sale Date Card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-lg">Sale Date</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <FormField
                      control={form.control}
                      name="saleDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-12 text-base border-slate-300 dark:border-slate-700 focus:ring-amber-500"
                              {...field}
                              value={typeof field.value === 'string' ? field.value : (field.value as Date)?.toISOString().split('T')[0] || ''}
                              onChange={(e) => {
                                field.onChange(e.target.value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                </CardContent>
              </Card>

              {/* Financial Details Card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-lg">Financial Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Form {...form}>
                    {/* Expenses Total */}
                    <FormField
                      control={form.control}
                      name="expensesTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Expenses</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="h-10 border-slate-300 dark:border-slate-700 focus:ring-green-500 pl-7"
                                min="0"
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : 0
                                  field.onChange(val)
                                }}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tokens Deducted */}
                    <FormField
                      control={form.control}
                      name="tokensDeducted"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Tokens</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-10 border-slate-300 dark:border-slate-700 focus:ring-green-500"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : 0
                                field.onChange(val)
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Returns Amount */}
                    <FormField
                      control={form.control}
                      name="returnsAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Returns</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="h-10 border-slate-300 dark:border-slate-700 focus:ring-green-500 pl-7"
                                min="0"
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : 0
                                  field.onChange(val)
                                }}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Bank Details */}
                    <FormField
                      control={form.control}
                      name="bankDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Bank Details</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Account reference"
                              className="h-10 border-slate-300 dark:border-slate-700 focus:ring-green-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Payment Method */}
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Payment Method</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-10 border-slate-300 dark:border-slate-700 focus:ring-green-500">
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notes Section */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Add any extra information about this sale</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about this sale..."
                          className="min-h-24 resize-none border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Max 500 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
            </CardContent>
          </Card>

          {/* Submit Button */}
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
              disabled={isSubmitting}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Sale...
                </div>
              ) : (
                'Create Sale'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface SaleSuccessCardProps {
  data: NewSaleFormData
  onAddAnother: () => void
}

function SaleSuccessCard({ data, onAddAnother }: SaleSuccessCardProps) {
  const router = useRouter()
  const { data: products } = useProducts()
  const product = (products ?? []).find((p) => p.id === data.productId)

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
                  Sale Created Successfully! 🎉
                </CardTitle>
                <CardDescription className="text-emerald-800 dark:text-emerald-200 text-base mt-1">
                  Your sale has been recorded in the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-4">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">Product</span>
                <p className="font-bold text-slate-900 dark:text-white text-lg mt-1">{product?.name}</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-4">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">Quantity</span>
                <p className="font-bold text-slate-900 dark:text-white text-lg mt-1">{data.quantity} units</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-4">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">Unit Price</span>
                <p className="font-bold text-slate-900 dark:text-white text-lg mt-1">${data.unitPrice.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-lg p-4 border border-emerald-300 dark:border-emerald-700">
                <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wide">Total Amount</span>
                <p className="font-bold text-emerald-700 dark:text-emerald-200 text-lg mt-1">
                  ${data.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onAddAnother}
            className="h-12 text-base font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            Add Another Sale
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

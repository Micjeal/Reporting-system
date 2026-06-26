'use client';

import { useEffect, useMemo, useState } from 'react';

import * as productsService from '@/services/products.service';
import * as salesService from '@/services/sales.service';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  unit_price: number;
};

type SaleItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export default function NewSaleForm() {
  const [products, setProducts] = useState<Product[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [location, setLocation] = useState('');
  const [route, setRoute] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [tokensDeducted, setTokensDeducted] = useState(0);
  const [returnsAmount, setReturnsAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [inventoryErrorMessage, setInventoryErrorMessage] = useState('');

  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  const [items, setItems] = useState<SaleItem[]>([
    {
      product_id: '',
      quantity: 1,
      unit_price: 0,
    },
  ]);

  // =========================
  // LOAD PRODUCTS
  // =========================
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productsService.listProducts();
        setProducts(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadProducts();
  }, []);

  // =========================
  // ADD PRODUCT ROW
  // =========================
  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: '',
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  // =========================
  // REMOVE PRODUCT ROW
  // =========================
  const removeRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================
  // UPDATE ROW
  // =========================
  const updateRow = (
    index: number,
    field: keyof SaleItem,
    value: string | number
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // AUTO LOAD PRICE
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value);

      if (product) {
        updated[index].unit_price = Number(product.unit_price);
      }
    }

    setItems(updated);
  };

  // =========================
  // FORM VALIDATION
  // =========================
  const isFormValid = useMemo(() => {
    // Check if all items have a product selected
    const hasValidProducts = items.every(item => item.product_id && item.product_id !== '');
    // Check if all items have valid quantity
    const hasValidQuantities = items.every(item => item.quantity > 0);
    
    return hasValidProducts && hasValidQuantities;
  }, [items]);

  // =========================
  // GRAND TOTAL
  // =========================
  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);
  }, [items]);

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    // Validate that all items have a product selected
    const invalidItems = items.filter(item => !item.product_id || item.product_id === '');
    if (invalidItems.length > 0) {
      alert('Please select a product for all items');
      return;
    }

    // Validate that all items have valid quantity
    const invalidQuantity = items.filter(item => item.quantity <= 0);
    if (invalidQuantity.length > 0) {
      alert('Please enter a valid quantity for all items');
      return;
    }

    try {
      setLoading(true);

      await salesService.createSale({
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        location: location || undefined,
        route: route || undefined,
        bank_details: bankDetails || undefined,
        expenses_total: expensesTotal > 0 ? expensesTotal : undefined,
        tokens_deducted: tokensDeducted > 0 ? tokensDeducted : undefined,
        returns_amount: returnsAmount > 0 ? returnsAmount : undefined,
        notes: notes || undefined,
        payment_method: paymentMethod,
        sale_date: saleDate,
        items,
      });

      alert('Sale recorded successfully');

      setCustomerName('');
      setCustomerPhone('');
      setLocation('');
      setRoute('');
      setBankDetails('');
      setExpensesTotal(0);
      setTokensDeducted(0);
      setReturnsAmount(0);
      setNotes('');

      setItems([
        {
          product_id: '',
          quantity: 1,
          unit_price: 0,
        },
      ]);
    } catch (error) {
      console.error(error);
      
      // Check if it's an inventory error
      const errorMessage = error instanceof Error ? error.message : 'Failed to record sale';
      if (errorMessage.includes('Insufficient inventory')) {
        setInventoryErrorMessage(errorMessage);
        setShowInventoryDialog(true);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">
          New Sale Transaction
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* CUSTOMER */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Customer Name
            </label>

            <Input
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              placeholder="Enter customer name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Sale Date
            </label>

            <Input
              type="date"
              value={saleDate}
              onChange={(e) =>
                setSaleDate(e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Customer Phone
            </label>

            <Input
              value={customerPhone}
              onChange={(e) =>
                setCustomerPhone(e.target.value)
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Location
            </label>

            <Input
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              placeholder="e.g., Downtown Store"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Route
            </label>

            <Input
              value={route}
              onChange={(e) =>
                setRoute(e.target.value)
              }
              placeholder="e.g., Route A"
            />
          </div>
        </div>

        {/* PAYMENT */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Payment Method
          </label>

          <Select
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mobile_money">
                Mobile Money
              </SelectItem>
              <SelectItem value="bank">
                Bank Transfer
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* FINANCIAL DETAILS */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Bank Details
            </label>

            <Input
              value={bankDetails}
              onChange={(e) =>
                setBankDetails(e.target.value)
              }
              placeholder="Account reference"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Expenses Total ($)
            </label>

            <Input
              type="number"
              min="0"
              step="0.01"
              value={expensesTotal || ''}
              onChange={(e) =>
                setExpensesTotal(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tokens Deducted
            </label>

            <Input
              type="number"
              min="0"
              step="0.01"
              value={tokensDeducted || ''}
              onChange={(e) =>
                setTokensDeducted(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Returns Amount ($)
            </label>

            <Input
              type="number"
              min="0"
              step="0.01"
              value={returnsAmount || ''}
              onChange={(e) =>
                setReturnsAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>
        </div>

        {/* NOTES */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Notes
          </label>

          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
          />
        </div>

        {/* PRODUCTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Products
            </h3>

            <Button
              type="button"
              variant="outline"
              onClick={addRow}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {items.map((item, index) => {
            const total =
              item.quantity * item.unit_price;

            return (
              <div
                key={index}
                className="grid gap-4 rounded-xl border p-4 md:grid-cols-5"
              >
                {/* PRODUCT */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Product
                  </label>

                  <Select
                    value={item.product_id}
                    onValueChange={(value) =>
                      updateRow(
                        index,
                        'product_id',
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>

                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id}
                        >
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* QUANTITY */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Qty
                  </label>

                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateRow(
                        index,
                        'quantity',
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                {/* PRICE */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Price
                  </label>

                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateRow(
                        index,
                        'unit_price',
                        Number(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* TOTAL */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total
                    </p>

                    <p className="font-bold">
                      {formatCurrency(total)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* GRAND TOTAL */}
        <div className="rounded-xl bg-muted p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Grand Total
            </span>

            <span className="text-3xl font-bold">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* SUBMIT */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
          className="w-full h-12 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recording Sale...
            </>
          ) : (
            'Record Sale'
          )}
        </Button>
        
        {!isFormValid && (
          <p className="text-sm text-red-500 text-center -mt-2">
            Please select a product and enter valid quantities for all items
          </p>
        )}
      </CardContent>

      {/* INVENTORY ERROR DIALOG */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-xl">Insufficient Inventory</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <DialogDescription className="text-base leading-relaxed">
              {inventoryErrorMessage}
            </DialogDescription>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-1">
                📞 Need more inventory?
              </p>
              <p className="text-sm text-blue-800">
                Please contact your manager or admin to request additional stock.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowInventoryDialog(false)}
              className="w-full sm:w-auto"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}



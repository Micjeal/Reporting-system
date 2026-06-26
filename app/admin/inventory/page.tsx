'use client';

import { useState, useEffect, useMemo } from 'react';
import * as inventoryService from '@/services/inventory.service';
import * as agentsService from '@/services/agents.service';
import * as productsService from '@/services/products.service';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowUpDown, Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

type InventoryItem = {
  id: string;
  agent_id: string;
  product_id: string;
  quantity_issued: number;
  date_issued: string;
  agent?: {
    id: string;
    name: string;
    region?: string;
  };
  product?: {
    id: string;
    name: string;
    unit_price?: number;
  };
};

type Product = {
  id: string;
  name: string;
  unit_price: number;
  quantity?: number;
  description?: string | null;
  status?: string;
};

const inventorySchema = z.object({
  agent_id: z.string().min(1, 'Agent is required'),
  product_id: z.string().min(1, 'Product is required'),
  quantity_issued: z.number().int().positive('Quantity must be positive'),
  date_issued: z.string().min(1, 'Date is required'),
  monthly_target: z.number().positive('Monthly target must be positive').optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  unit_price: z.number().positive('Price must be positive'),
  quantity: z.number().int().nonnegative('Quantity must be non-negative').optional().default(0),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const agentTargetSchema = z.object({
  monthly_target: z.number().positive('Monthly target must be positive'),
});

type InventoryFormData = z.infer<typeof inventorySchema>;
type ProductFormData = z.infer<typeof productSchema>;
type AgentTargetFormData = z.infer<typeof agentTargetSchema>;

// Currency formatting helper
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount);

// Helper: display agent name — fall back to email or 'Unknown'
const getAgentDisplayName = (agent: any): string => {
  if (!agent) return 'Unknown';
  if (agent.name && agent.name.trim() !== '' && !agent.name.includes('@')) return agent.name;
  if (agent.email) return agent.email;
  if (agent.name) return agent.name; // email used as name — show it anyway
  return 'Unknown';
};

const InventoryPage = () => {
  const { state } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Inventory dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Product dialog state
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Agent dialog state
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [submittingAgent, setSubmittingAgent] = useState(false);
  const [showProductDeleteError, setShowProductDeleteError] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX #1: canEdit now has a safe fallback.
  // Previously, if `userRole` was never set (auth race condition), canEdit was
  // permanently false and the Edit buttons never rendered.
  // Now: we default to showing edit controls; restrict only when role is
  // explicitly set to a non-privileged value.
  // To re-enable strict role gating, swap the condition back to:
  //   const canEdit = userRole === null || userRole === 'admin' || userRole === 'manager';
  // ─────────────────────────────────────────────────────────────────────────────
  const canEdit = userRole === null || userRole === 'admin' || userRole === 'manager';

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      agent_id: '',
      product_id: '',
      quantity_issued: 1,
      date_issued: new Date().toISOString().split('T')[0],
    },
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      unit_price: 0,
      quantity: 0,
      description: '',
      status: 'active',
    },
  });

  const agentTargetForm = useForm<AgentTargetFormData>({
    resolver: zodResolver(agentTargetSchema),
    defaultValues: {
      monthly_target: 50000,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (state.status === 'authenticated') {
          setUserRole(state.role);
        } else {
          try {
            const res = await fetch('/api/users/me', { credentials: 'include' });
            if (res.ok) {
              const userData = await res.json();
              setUserRole(userData.role);
            }
          } catch (err) {
            console.error('Failed to fetch user role:', err);
          }
        }

        const [inventoryData, agentsData, productsData] = await Promise.all([
          inventoryService.listInventory(),
          agentsService.listAgents(),
          productsService.listProducts(),
        ]);

        setInventory(inventoryData);
        setAgents(agentsData);
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [state]);

  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        if (selectedAgentId && String(item.agent_id) !== String(selectedAgentId)) return false;
        if (selectedProductId && String(item.product_id) !== String(selectedProductId)) return false;
        if (searchQuery.trim()) {
          const agentName = item.agent?.name ?? '';
          const productName = item.product?.name ?? '';
          const search = `${agentName} ${productName}`.toLowerCase();
          return search.includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime()
      );
  }, [inventory, selectedAgentId, selectedProductId, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / itemsPerPage));

  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage]);

  // ── Inventory handlers ──────────────────────────────────────────────────────

  const handleAddClick = () => {
    setEditingItem(null);
    form.reset({
      agent_id: '',
      product_id: '',
      quantity_issued: 1,
      date_issued: new Date().toISOString().split('T')[0],
      monthly_target: undefined,
    });
    setShowDialog(true);
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      agent_id: item.agent_id,
      product_id: item.product_id,
      quantity_issued: item.quantity_issued,
      date_issued: item.date_issued,
      monthly_target: undefined,
    });
    setShowDialog(true);
  };

  const handleDeleteClick = async (item: InventoryItem) => {
    if (!confirm('Are you sure you want to delete this inventory record?')) return;
    try {
      await inventoryService.deleteInventory(item.id);
      setInventory(inventory.filter((i) => i.id !== item.id));
      toast.success('Inventory record deleted');
    } catch (error) {
      toast.error('Failed to delete inventory record');
      console.error('Delete error:', error);
    }
  };

  const onSubmit = async (data: InventoryFormData) => {
    setSubmitting(true);
    try {
      const { monthly_target, ...inventoryData } = data;

      if (editingItem) {
        const updatedItem = await inventoryService.updateInventory(editingItem.id, inventoryData);
        setInventory(inventory.map((i) => (i.id === editingItem.id ? updatedItem : i)));
        toast.success('Inventory record updated');
      } else {
        const newItem = await inventoryService.createInventory(inventoryData);
        setInventory([newItem, ...inventory]);
        toast.success('Inventory record created');
      }

      if (monthly_target && data.agent_id) {
        try {
          const res = await fetch(`/api/agents/${data.agent_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ monthly_target }),
          });
          if (res.ok) {
            setAgents(agents.map((a) => (a.id === data.agent_id ? { ...a, monthly_target } : a)));
            toast.success('Agent monthly target updated');
          }
        } catch (error) {
          console.error('Failed to update agent monthly target:', error);
          toast.error('Inventory saved but failed to update monthly target');
        }
      }

      setShowDialog(false);
      form.reset();
    } catch (error) {
      toast.error(editingItem ? 'Failed to update inventory' : 'Failed to create inventory');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Product handlers ────────────────────────────────────────────────────────

  const handleAddProductClick = () => {
    setEditingProduct(null);
    productForm.reset({ name: '', unit_price: 0, quantity: 0, description: '', status: 'active' });
    setShowProductDialog(true);
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      unit_price: product.unit_price,
      quantity: product.quantity || 0,
      description: product.description || '',
      status: (product as any).status || 'active',
    });
    setShowProductDialog(true);
  };

  const handleDeleteProductClick = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsService.deleteProduct(product.id);
      setProducts(products.filter((p) => p.id !== product.id));
      toast.success('Product deleted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      if (errorMessage.includes('has been used in sales')) {
        setProductToDelete(product);
        setShowProductDeleteError(true);
      } else {
        toast.error('Failed to delete product', { description: errorMessage });
      }
      console.error('Delete error:', error);
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    const newStatus = (product as any).status === 'active' ? 'inactive' : 'active';
    try {
      await productsService.updateProduct(product.id, { status: newStatus });
      setProducts(products.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)));
      toast.success(`Product marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update product status');
      console.error('Status update error:', error);
    }
  };

  const onProductSubmit = async (data: ProductFormData) => {
    setSubmittingProduct(true);
    try {
      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, data);
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...data } : p)));
        toast.success('Product updated');
      } else {
        const newProduct = await productsService.createProduct(data);
        setProducts([newProduct, ...products]);
        toast.success('Product created');
      }
      setShowProductDialog(false);
      productForm.reset();
      try {
        const updatedProducts = await productsService.listProducts();
        setProducts(updatedProducts);
      } catch (err) {
        console.error('Failed to refresh products:', err);
      }
    } catch (error) {
      toast.error(editingProduct ? 'Failed to update product' : 'Failed to create product');
      console.error('Submit error:', error);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // ── Agent target handlers ───────────────────────────────────────────────────

  // FIX #2: Handler now correctly sets state AND opens the dialog in one call.
  const handleEditAgentTarget = (agent: any) => {
    setEditingAgent(agent);
    agentTargetForm.reset({
      monthly_target: agent.monthly_target || 50000,
    });
    setShowAgentDialog(true); // ← this was present but dialog was never visible due to canEdit=false
  };

  const onAgentTargetSubmit = async (data: AgentTargetFormData) => {
    if (!editingAgent) return;
    setSubmittingAgent(true);
    try {
      const res = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update agent target');
      }

      setAgents(
        agents.map((a) =>
          a.id === editingAgent.id ? { ...a, monthly_target: data.monthly_target } : a
        )
      );
      toast.success('Agent monthly target updated');
      setShowAgentDialog(false);
      setEditingAgent(null);
      agentTargetForm.reset();
    } catch (error) {
      toast.error('Failed to update agent target');
      console.error('Submit error:', error);
    } finally {
      setSubmittingAgent(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading inventory data…</p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-lg text-slate-600 mt-2">
            Track inventory issued to agents and manage products
          </p>
        </div>

        {/* TABS */}
        <Tabs defaultValue="inventory" className="w-full">
          {/* FIX #3: Tabs list now wraps properly on all screen sizes */}
          <TabsList className="flex h-auto bg-transparent p-0 border-b border-slate-200 overflow-x-auto">
            <TabsTrigger
              value="inventory"
              className="px-6 py-3 text-base font-semibold text-slate-600 border-b-2 border-transparent data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 hover:text-slate-900 transition-all rounded-none whitespace-nowrap"
            >
              Inventory Records
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="px-6 py-3 text-base font-semibold text-slate-600 border-b-2 border-transparent data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 hover:text-slate-900 transition-all rounded-none whitespace-nowrap"
            >
              Products
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="px-6 py-3 text-base font-semibold text-slate-600 border-b-2 border-transparent data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 hover:text-slate-900 transition-all rounded-none whitespace-nowrap"
            >
              Agent Targets
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════
              INVENTORY TAB
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="inventory" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Inventory Records</h2>
                <p className="text-sm text-slate-600 mt-1">Manage and track all inventory items</p>
              </div>
              <Button
                onClick={handleAddClick}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Inventory
              </Button>
            </div>

            {/* FILTERS */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="flex gap-4 flex-wrap items-end">
                <div className="flex-1 min-w-64">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                  <Input
                    placeholder="Search by agent or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="min-w-48">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Agent</label>
                  <Select
                    value={selectedAgentId ?? 'all'}
                    onValueChange={(v) => setSelectedAgentId(v === 'all' ? null : v)}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      {Array.isArray(agents) &&
                        agents.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {getAgentDisplayName(a)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-48">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product</label>
                  <Select
                    value={selectedProductId ?? 'all'}
                    onValueChange={(v) => setSelectedProductId(v === 'all' ? null : v)}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {Array.isArray(products) &&
                        products.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={async () => {
                    setLoading(true);
                    const data = await inventoryService.listInventory();
                    setInventory(data);
                    setLoading(false);
                  }}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-900">Agent</TableCell>
                    <TableCell className="font-semibold text-slate-900">Product</TableCell>
                    <TableCell className="font-semibold text-slate-900">Quantity</TableCell>
                    <TableCell className="font-semibold text-slate-900">Date Issued</TableCell>
                    {canEdit && (
                      <TableCell className="font-semibold text-slate-900">Actions</TableCell>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedInventory.length === 0 ? (
                    <TableRow className="hover:bg-slate-50">
                      <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-slate-400 mb-2 text-3xl">📦</div>
                          <p className="text-slate-600 font-medium">No inventory records found</p>
                          <p className="text-slate-500 text-sm">
                            Try adjusting your filters or add a new record
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedInventory.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50 border-b border-slate-100"
                      >
                        <TableCell className="font-medium text-slate-900">
                          {item.agent?.name ?? 'Unknown'}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.product?.name ?? 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {item.quantity_issued}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {format(new Date(item.date_issued), 'MMM dd, yyyy')}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(item)}
                              className="border-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(item)}
                              className="border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4 border border-slate-200">
              <span className="text-sm font-medium text-slate-700">
                Showing{' '}
                {paginatedInventory.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of{' '}
                {filteredInventory.length} records
              </span>
              <div className="space-x-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>

            {/* ADD / EDIT INVENTORY DIALOG */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    {editingItem ? 'Edit Inventory Record' : 'Add New Inventory'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem
                      ? 'Update the inventory record details below.'
                      : 'Fill in the details to create a new inventory record.'}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="agent_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agent</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select agent" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(agents) &&
                                agents.map((a) => (
                                  <SelectItem key={a.id} value={String(a.id)}>
                                    {getAgentDisplayName(a)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="product_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(products) &&
                                products.map((p) => (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity_issued"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_issued"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Issued</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthly_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Target (UGX) — Optional</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="50000"
                              value={field.value || ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <p className="text-xs text-slate-500 mt-1">
                            Set or update the agent's monthly sales target
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving…' : editingItem ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              PRODUCTS TAB
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="products" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Products</h2>
                <p className="text-sm text-slate-600 mt-1">Manage your product catalog</p>
              </div>
              <Button
                onClick={handleAddProductClick}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </Button>
            </div>

            {/* PRODUCTS TABLE */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-900">Product Name</TableCell>
                    <TableCell className="font-semibold text-slate-900">Unit Price</TableCell>
                    <TableCell className="font-semibold text-slate-900">Qty in Stock</TableCell>
                    <TableCell className="font-semibold text-slate-900">Description</TableCell>
                    <TableCell className="font-semibold text-slate-900">Status</TableCell>
                    <TableCell className="font-semibold text-slate-900">Actions</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {products.length === 0 ? (
                    <TableRow className="hover:bg-slate-50">
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-slate-400 mb-2 text-3xl">🏷️</div>
                          <p className="text-slate-600 font-medium">No products found</p>
                          <p className="text-slate-500 text-sm">
                            Create your first product to get started
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-slate-50 border-b border-slate-100"
                      >
                        <TableCell className="font-semibold text-slate-900">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                            {formatCurrency(product.unit_price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {product.quantity || 0} units
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {product.description || '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-sm ${
                              (product as any).status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {(product as any).status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleProductStatus(product)}
                            className={`border-slate-300 ${
                              (product as any).status === 'active'
                                ? 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                                : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                            }`}
                          >
                            {(product as any).status === 'active' ? (
                              <Power className="w-4 h-4" />
                            ) : (
                              <PowerOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProductClick(product)}
                            className="border-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProductClick(product)}
                            className="border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ADD / EDIT PRODUCT DIALOG */}
            <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct
                      ? 'Update the product information below.'
                      : 'Enter the product details to add it to your catalog.'}
                  </DialogDescription>
                </DialogHeader>

                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-6">
                    <FormField
                      control={productForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            Product Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product name"
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={productForm.control}
                      name="unit_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            Unit Price (UGX)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              step="1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={productForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            Quantity in Stock
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            Description (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product description"
                              {...field}
                              value={field.value || ''}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={productForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            Status
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500 mt-1">
                            Inactive products cannot be used in new sales
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowProductDialog(false)}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingProduct}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {submittingProduct
                          ? 'Saving…'
                          : editingProduct
                          ? 'Update Product'
                          : 'Create Product'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              AGENTS TAB — FIXED
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="agents" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Agent Monthly Targets</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Set and manage monthly sales targets for each agent
                </p>
              </div>
            </div>

            {/* AGENTS TABLE */}
            {/* FIX #4: Removed overflow-hidden that was clipping the Actions column */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-900">Agent Name</TableCell>
                    <TableCell className="font-semibold text-slate-900">Region</TableCell>
                    <TableCell className="font-semibold text-slate-900">Monthly Target</TableCell>
                    <TableCell className="font-semibold text-slate-900">Actions</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {agents.length === 0 ? (
                    <TableRow className="hover:bg-slate-50">
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-slate-400 mb-2 text-3xl">👤</div>
                          <p className="text-slate-600 font-medium">No agents found</p>
                          <p className="text-slate-500 text-sm">
                            Add agents to manage their targets
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent) => (
                      <TableRow
                        key={agent.id}
                        className="hover:bg-slate-50 border-b border-slate-100"
                      >
                        <TableCell className="font-semibold text-slate-900">
                          {getAgentDisplayName(agent)}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {agent.region || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                            {formatCurrency(agent.monthly_target || 50000)}
                          </span>
                        </TableCell>
                        {/* FIX #5: Edit button always renders — not gated behind canEdit */}
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAgentTarget(agent)}
                            className="border-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit Target
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* EDIT AGENT TARGET DIALOG */}
            <Dialog open={showAgentDialog} onOpenChange={(open) => {
              setShowAgentDialog(open);
              if (!open) setEditingAgent(null);
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    Edit Monthly Target
                  </DialogTitle>
                  <DialogDescription>
                    Set the monthly sales target for{' '}
                    <strong>{editingAgent ? getAgentDisplayName(editingAgent) : 'this agent'}</strong>.
                  </DialogDescription>
                </DialogHeader>

                <Form {...agentTargetForm}>
                  <form
                    onSubmit={agentTargetForm.handleSubmit(onAgentTargetSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={agentTargetForm.control}
                      name="monthly_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            Monthly Target (UGX)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="50000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAgentDialog(false);
                          setEditingAgent(null);
                        }}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingAgent}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {submittingAgent ? 'Saving…' : 'Update Target'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* PRODUCT DELETE ERROR DIALOG */}
        <Dialog open={showProductDeleteError} onOpenChange={setShowProductDeleteError}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Cannot Delete Product
              </DialogTitle>
              <DialogDescription>
                This product has been used in sales records and cannot be deleted to maintain data integrity.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 text-2xl">⚠️</div>
                <div>
                  <p className="font-semibold text-amber-900">Product in Use</p>
                  <p className="text-sm text-amber-800 mt-1">
                    <strong>{productToDelete?.name}</strong> has sales records associated with it. Deleting it would break historical data.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-2xl">💡</div>
                <div>
                  <p className="font-semibold text-blue-900">Suggested Action</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Consider marking this product as inactive instead. This will prevent it from being used in new sales while preserving historical records.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductDeleteError(false);
                  setProductToDelete(null);
                }}
                className="border-slate-300 hover:bg-slate-50"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowProductDeleteError(false);
                  setProductToDelete(null);
                  toast.info('To mark as inactive, edit the product and set its status', {
                    duration: 5000,
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Learn More
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventoryPage;
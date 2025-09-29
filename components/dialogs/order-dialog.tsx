"use client";

import React, { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn-io/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { orderApi, productApi } from "@/lib/api";
import type { OrderDetail } from "@/types/order";
import type { Product } from "@/types/product";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Form schemas
const orderDetailSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  sku: z.string().min(1, "SKU is required"),
  variant: z.string().optional(),
});

type OrderDetailFormData = z.infer<typeof orderDetailSchema>;

interface OrderDialogProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "details" | "edit" | "add";
  onOrderUpdate?: () => void;
}

export function OrderDialog({
  orderId,
  open,
  onOpenChange,
  initialTab = "details",
  onOrderUpdate,
}: OrderDialogProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderIdString, setOrderIdString] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);

  // Delete confirmation states
  const [deleteConfirmingId, setDeleteConfirmingId] = useState<number | null>(
    null
  );

  // Product search states
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Check if operations are allowed based on order status
  const isOperationAllowed = () => {
    return orderStatus.toLowerCase() === "ready to pick";
  };

  // Show error message for forbidden operations
  const showForbiddenOperationError = () => {
    toast.error("Operation not allowed", {
      description: `Order modifications are only allowed when status is "ready to pick". Current status: "${orderStatus}"`,
    });
  };

  // Form for adding/editing order details
  const form = useForm<OrderDetailFormData>({
    resolver: zodResolver(orderDetailSchema),
    defaultValues: {
      product_name: "",
      quantity: 1,
      sku: "",
      variant: "",
    },
  });

  // Fetch order information
  const fetchOrder = useCallback(async (id: number) => {
    try {
      const response = await orderApi.getOrderById(id);
      setOrderStatus(response.data.status);
      setOrderIdString(response.data.order_id);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to fetch order", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }, []);

  // Fetch order details
  const fetchOrderDetails = useCallback(
    async (id: number) => {
      try {
        setLoading(true);

        // Fetch both order info and order details
        await Promise.all([
          fetchOrder(id),
          (async () => {
            const response = await orderApi.getOrderDetails(id);
            setOrderDetails(response.data.order_details);
          })(),
        ]);
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to fetch order details", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [fetchOrder]
  );

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    try {
      setProductsLoading(true);
      const response = await productApi.getProducts(1, 20, query);
      setProducts(response.data.products as Product[]);
    } catch (error) {
      console.error("Error searching products:", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Debounced product search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearch, searchProducts]);

  // Add new order detail
  const addOrderDetail = async (data: OrderDetailFormData) => {
    if (!orderId) return;

    // Check if operation is allowed
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    try {
      setUpdating(true);
      await orderApi.createOrderDetail(orderId, {
        product_name: data.product_name,
        quantity: data.quantity,
        sku: data.sku,
        variant: data.variant || undefined,
      });

      toast.success("Order detail added successfully");
      form.reset();
      setActiveTab("details");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
    } catch (error) {
      console.error("Error adding order detail:", error);
      toast.error("Failed to add order detail", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Edit order detail
  const editOrderDetail = async (
    detailId: number,
    data: OrderDetailFormData
  ) => {
    if (!orderId) return;

    // Check if operation is allowed
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    try {
      setUpdating(true);
      await orderApi.updateOrderDetail(orderId, detailId, {
        product_name: data.product_name,
        quantity: data.quantity,
        sku: data.sku,
        variant: data.variant || undefined,
      });

      toast.success("Order detail updated successfully");
      form.reset();
      setEditingDetailId(null);
      setActiveTab("details");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
    } catch (error) {
      console.error("Error updating order detail:", error);
      toast.error("Failed to update order detail", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete button click (first click shows confirmation)
  const handleDeleteClick = (detailId: number) => {
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    if (deleteConfirmingId === detailId) {
      // Second click - actually delete
      deleteOrderDetail(detailId);
    } else {
      // First click - show confirmation
      setDeleteConfirmingId(detailId);
      toast.info("Click delete again to confirm", {
        description: "This action cannot be undone",
      });

      // Auto-reset confirmation after 3 seconds
      setTimeout(() => {
        setDeleteConfirmingId(null);
      }, 3000);
    }
  };

  // Delete order detail
  const deleteOrderDetail = async (detailId: number) => {
    if (!orderId) return;

    try {
      setUpdating(true);
      setDeleteConfirmingId(null); // Reset confirmation state

      await orderApi.deleteOrderDetail(orderId, detailId);

      toast.success("Order detail deleted successfully");
      await fetchOrderDetails(orderId);
      onOrderUpdate?.();
    } catch (error) {
      console.error("Error deleting order detail:", error);
      toast.error("Failed to delete order detail", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    form.setValue("product_name", product.name);
    form.setValue("sku", product.sku);
    if (product.variant) {
      form.setValue("variant", product.variant);
    }
    setProductSearchOpen(false);
    setProductSearch("");
  };

  // Handle edit detail
  const handleEditDetail = (detail: OrderDetail) => {
    // Check if operation is allowed
    if (!isOperationAllowed()) {
      showForbiddenOperationError();
      return;
    }

    if (!detail.id) {
      toast.error("Cannot edit detail without ID");
      return;
    }

    form.reset({
      product_name: detail.product_name,
      quantity: detail.quantity || 1,
      sku: detail.sku || "",
      variant: detail.variant || "",
    });
    setEditingDetailId(detail.id);
    setActiveTab("edit");
  };

  // Form submit handler
  const onSubmit = (data: OrderDetailFormData) => {
    if (editingDetailId) {
      editOrderDetail(editingDetailId, data);
    } else {
      addOrderDetail(data);
    }
  };

  // Effects
  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails(orderId);
      setActiveTab(initialTab);
    } else {
      setOrderDetails([]);
      setOrderStatus("");
      setOrderIdString("");
      setEditingDetailId(null);
      setDeleteConfirmingId(null);
      form.reset();
      setProducts([]);
      setProductSearch("");
    }
  }, [open, orderId, initialTab, fetchOrderDetails, form]);

  const isEditing = editingDetailId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : orderId
              ? `Order Details - Order ID: ${orderIdString || orderId}`
              : "Order Details"}
            {orderStatus && (
              <Badge
                variant={
                  orderStatus.toLowerCase() === "ready to pick"
                    ? "default"
                    : "destructive"
                }
                className="ml-2"
              >
                {orderStatus}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {orderId ? (
              <>
                View and manage order details
                {orderStatus &&
                  orderStatus.toLowerCase() !== "ready to pick" && (
                    <span className="text-orange-600 dark:text-orange-400 text-sm block mt-2">
                      ⚠️ Modifications are only allowed when order status is
                      &quot;ready to pick&quot;
                    </span>
                  )}
              </>
            ) : (
              "No order selected"
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading order details...
          </div>
        ) : orderId ? (
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "details" | "edit" | "add")
              }
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Details ({orderDetails.length})
                </TabsTrigger>
                <TabsTrigger value="add" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Detail
                </TabsTrigger>
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  {isEditing ? "Edit Detail" : "Edit Mode"}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 mt-4">
                <TabsContents className="flex-1 overflow-y-auto">
                  {/* Details Tab */}
                  <TabsContent value="details" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      <div className="space-y-4">
                        {orderDetails.length > 0 ? (
                          orderDetails.map((detail) => (
                            <Card key={detail.id} className="w-full">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm max-w-[680px] text-wrap">
                                    {detail.product_name}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                    <RippleButton
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditDetail(detail)}
                                      disabled={!isOperationAllowed()}
                                      className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </RippleButton>
                                    <RippleButton
                                      variant={
                                        deleteConfirmingId === detail.id
                                          ? "destructive"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() =>
                                        detail.id &&
                                        handleDeleteClick(detail.id)
                                      }
                                      disabled={
                                        updating || !isOperationAllowed()
                                      }
                                      className={cn(
                                        "h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                                        deleteConfirmingId === detail.id &&
                                          "animate-pulse border-red-500 bg-red-500 text-white"
                                      )}
                                      title={
                                        deleteConfirmingId === detail.id
                                          ? "Click again to confirm delete"
                                          : "Delete order detail"
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </RippleButton>
                                  </div>
                                </div>
                                <Separator
                                  orientation="horizontal"
                                  className="mt-2 data-[orientation=horizontal]"
                                />
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-center font-mono max-w-[100px]">
                                          SKU
                                        </TableHead>
                                        <TableHead className="text-center font-mono">
                                          Quantity
                                        </TableHead>
                                        <TableHead className="text-center font-mono">
                                          Variant
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell className="font-mono min-w-[150px] max-w-[150px] truncate">
                                          {detail.sku || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Badge variant="outline">
                                            {detail.quantity}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {detail.variant || "N/A"}
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No order details found.
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Add Detail Tab */}
                  <TabsContent value="add" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add New Order Detail
                          </CardTitle>
                          <Separator
                            orientation="horizontal"
                            className="mt-2 data-[orientation=horizontal]"
                          />
                        </CardHeader>
                        <CardContent>
                          <Form {...form}>
                            <form
                              onSubmit={form.handleSubmit(onSubmit)}
                              className="space-y-6"
                            >
                              {/* Product Search */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Search Products
                                </label>
                                <Popover
                                  open={productSearchOpen}
                                  onOpenChange={setProductSearchOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <RippleButton
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={productSearchOpen}
                                      className="w-full justify-between"
                                    >
                                      <div className="flex items-center">
                                        <Search className="mr-2 h-4 w-4" />
                                        Search products to auto-fill details...
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </RippleButton>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onValueChange={setProductSearch}
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          {productsLoading
                                            ? "Searching..."
                                            : "No products found."}
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {products.map((product) => (
                                            <CommandItem
                                              key={product.id}
                                              value={`${product.sku}-${product.name}`}
                                              onSelect={() =>
                                                handleProductSelect(product)
                                              }
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  "opacity-0"
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span>SKU: {product.sku}</span>
                                                <span className="text-xs truncate">
                                                  {product.name}
                                                </span>
                                                {product.variant && (
                                                  <span className="text-xs">
                                                    Variant: {product.variant}
                                                  </span>
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="sku"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>SKU</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter SKU"
                                          {...field}
                                          readOnly
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="product_name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Product Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter product name"
                                          {...field}
                                          readOnly
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="quantity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantity</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="Enter quantity"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              parseInt(e.target.value) || 1
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="variant"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Variant (Optional)</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g., Red - Size M"
                                          {...field}
                                          readOnly
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <RippleButton
                                  type="button"
                                  variant="outline"
                                  onClick={() => form.reset()}
                                  className="cursor-pointer"
                                >
                                  Reset Form
                                </RippleButton>
                                <RippleButton
                                  type="submit"
                                  disabled={updating || !isOperationAllowed()}
                                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updating && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Add Detail
                                </RippleButton>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Edit Detail Tab */}
                  <TabsContent value="edit" className="h-full m-0">
                    <div className="h-full overflow-y-auto">
                      {isEditing ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Edit className="h-5 w-5" />
                              Edit Order Detail
                            </CardTitle>
                            <Separator
                              orientation="horizontal"
                              className="mt-2 data-[orientation=horizontal]"
                            />
                          </CardHeader>
                          <CardContent>
                            <Form {...form}>
                              <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="product_name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="Enter product name"
                                            {...field}
                                            readOnly
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="Enter SKU"
                                            {...field}
                                            readOnly
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="1"
                                            placeholder="Enter quantity"
                                            {...field}
                                            onChange={(e) =>
                                              field.onChange(
                                                parseInt(e.target.value) || 1
                                              )
                                            }
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="variant"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          Variant (Optional)
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="e.g., Red - Size M"
                                            {...field}
                                            readOnly
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <RippleButton
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      form.reset();
                                      setEditingDetailId(null);
                                      setActiveTab("details");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Cancel
                                  </RippleButton>
                                  <RippleButton
                                    type="submit"
                                    disabled={updating || !isOperationAllowed()}
                                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {updating && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Update Detail
                                  </RippleButton>
                                </div>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Select an order detail to edit from the Details tab.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </TabsContents>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No order selected.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

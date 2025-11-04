"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  X,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { orderApi } from "@/lib/api/orderApi";
import { productApi } from "@/lib/api/productApi";
import { storeApi } from "@/lib/api/storeApi";
import type { Product } from "@/types/product";
import type { Store } from "@/types/store";
import { cn } from "@/lib/utils";

interface OrderDetail {
  product_name: string;
  quantity: number;
  sku: string;
  variant: string;
  tempId: string;
}

interface OrderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OrderCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: OrderCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);

  // Form state
  const [orderId, setOrderId] = useState("");
  const [buyer, setBuyer] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Combobox state
  const [storeOpen, setStoreOpen] = useState(false);
  const [productOpenStates, setProductOpenStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [productSearches, setProductSearches] = useState<{
    [key: string]: string;
  }>({});

  // Generate tracking number
  const generateTrackingNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const date = now.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `PJ${year}${month}${date}${random}`;
  };

  const [tracking, setTracking] = useState(generateTrackingNumber());

  // Fetch products with search (only load what user searches for)
  const fetchProducts = async (search: string) => {
    // Don't fetch if search is too short
    if (!search || search.trim().length < 2) {
      setProducts([]);
      return;
    }

    try {
      setLoadingProducts(true);
      const response = await productApi.getProducts(1, 50, search.trim());
      
      if (response.success && response.data) {
        // Products API might have different structure, handle multiple cases
        if (response.data.products && Array.isArray(response.data.products)) {
          setProducts(response.data.products);
        } else if (Array.isArray(response.data.data)) {
          setProducts(response.data.data);
        } else if (Array.isArray(response.data)) {
          setProducts(response.data);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Debounced product search
  useEffect(() => {
    // Get all unique search queries from productSearches
    const searchQueries = Object.values(productSearches).filter((s) => s);
    
    if (searchQueries.length === 0) {
      setProducts([]);
      return;
    }

    // Use the most recent search query
    const latestSearch = searchQueries[searchQueries.length - 1];
    
    const timeoutId = setTimeout(() => {
      fetchProducts(latestSearch);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [productSearches]);

  // Fetch stores
  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const response = await storeApi.getStores(1, 100);
      
      if (response.success && response.data && response.data.stores) {
        setStores(response.data.stores);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Failed to load stores");
    } finally {
      setLoadingStores(false);
    }
  };

  // Reset form
  const resetForm = useCallback(() => {
    setOrderId("");
    setBuyer("");
    setSelectedStore(null);
    setOrderDetails([]);
    setTracking(generateTrackingNumber());
    setProducts([]);
    setProductSearches({});
    setProductOpenStates({});
  }, []);

  useEffect(() => {
    if (open) {
      fetchStores();
      setTracking(generateTrackingNumber());
      setProducts([]); // Clear products on open
      setProductSearches({}); // Clear search states
      setProductOpenStates({}); // Clear open states
    } else {
      // Reset form when dialog closes
      resetForm();
    }
  }, [open, resetForm]);

  // Add order detail
  const addOrderDetail = () => {
    const newDetail: OrderDetail = {
      product_name: "",
      quantity: 1,
      sku: "",
      variant: "",
      tempId: `temp-${Date.now()}-${Math.random()}`,
    };
    setOrderDetails([...orderDetails, newDetail]);
  };

  // Remove order detail
  const removeOrderDetail = (tempId: string) => {
    setOrderDetails(orderDetails.filter((detail) => detail.tempId !== tempId));
  };

  // Update order detail
  const updateOrderDetail = (
    tempId: string,
    field: keyof OrderDetail,
    value: string | number
  ) => {
    setOrderDetails(
      orderDetails.map((detail) =>
        detail.tempId === tempId ? { ...detail, [field]: value } : detail
      )
    );
  };

  // Select product for order detail
  const selectProduct = (tempId: string, product: Product) => {
    setOrderDetails(
      orderDetails.map((detail) =>
        detail.tempId === tempId
          ? {
              ...detail,
              product_name: product.name,
              sku: product.sku,
              variant: product.variant,
            }
          : detail
      )
    );
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!orderId.trim()) {
      toast.error("Order ID is required");
      return;
    }

    if (!buyer.trim()) {
      toast.error("Buyer name is required");
      return;
    }

    if (!selectedStore) {
      toast.error("Please select a store");
      return;
    }

    if (orderDetails.length === 0) {
      toast.error("Please add at least one order detail");
      return;
    }

    // Validate each order detail
    for (let i = 0; i < orderDetails.length; i++) {
      const detail = orderDetails[i];
      if (!detail.product_name.trim()) {
        toast.error(`Product name is required for item ${i + 1}`);
        return;
      }
      if (!detail.sku.trim()) {
        toast.error(`SKU is required for item ${i + 1}`);
        return;
      }
      if (detail.quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for item ${i + 1}`);
        return;
      }
    }

    try {
      setLoading(true);

      const orderData = {
        order_id: orderId,
        buyer: buyer,
        channel: "Offline",
        courier: "Offline",
        status: "ready to pick",
        store: selectedStore.name,
        tracking: tracking,
        order_details: orderDetails.map((detail) => ({
          product_name: detail.product_name,
          quantity: detail.quantity,
          sku: detail.sku,
          variant: detail.variant || undefined,
        })),
      };

      const response = await orderApi.createOrder(orderData);

      if (response.success) {
        toast.success("Order created successfully");
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create order";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Order</DialogTitle>
          <DialogDescription>
            Create a new offline order with order details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_id">
                Order ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="order_id"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer">
                Buyer <span className="text-red-500">*</span>
              </Label>
              <Input
                id="buyer"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="Enter buyer name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Store <span className="text-red-500">*</span>
              </Label>
              <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={storeOpen}
                    className="w-full justify-between"
                  >
                    {selectedStore ? selectedStore.name : "Select store..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search store..." />
                    <CommandList>
                      <CommandEmpty>
                        {loadingStores ? "Loading..." : "No store found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {stores.map((store) => (
                          <CommandItem
                            key={store.id}
                            value={store.name}
                            onSelect={() => {
                              setSelectedStore(store);
                              setStoreOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStore?.id === store.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {store.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <div className="flex gap-2">
                <Input
                  id="tracking"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Tracking number"
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTracking(generateTrackingNumber())}
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Input value="Offline" disabled />
            </div>

            <div className="space-y-2">
              <Label>Courier</Label>
              <Input value="Offline" disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Input value="ready to pick" disabled />
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Order Details <span className="text-red-500">*</span>
              </Label>
              <Button type="button" variant="outline" onClick={addOrderDetail}>
                <span className="mr-2">+</span>
                Add Item
              </Button>
            </div>

            {orderDetails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No items added. Click &quot;Add Item&quot; to add order details.
              </div>
            ) : (
              <div className="space-y-4">
                {orderDetails.map((detail, index) => (
                  <div
                    key={detail.tempId}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Item #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeOrderDetail(detail.tempId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>
                          Product <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                          open={productOpenStates[detail.tempId] || false}
                          onOpenChange={(open) => {
                            setProductOpenStates((prev) => ({
                              ...prev,
                              [detail.tempId]: open,
                            }));
                            if (!open) {
                              // Clear search when closing
                              setProductSearches((prev) => ({
                                ...prev,
                                [detail.tempId]: "",
                              }));
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              <span className="truncate">
                                {detail.product_name || "Select product..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Type to search products (min 2 chars)..."
                                value={productSearches[detail.tempId] || ""}
                                onValueChange={(value) => {
                                  setProductSearches((prev) => ({
                                    ...prev,
                                    [detail.tempId]: value,
                                  }));
                                }}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {loadingProducts
                                    ? "Loading..."
                                    : productSearches[detail.tempId] &&
                                      productSearches[detail.tempId].length < 2
                                    ? "Type at least 2 characters to search"
                                    : "No product found."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={`${product.name} ${product.sku}`}
                                      onSelect={() => {
                                        selectProduct(detail.tempId, product);
                                        setProductOpenStates((prev) => ({
                                          ...prev,
                                          [detail.tempId]: false,
                                        }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          detail.sku === product.sku
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{product.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          SKU: {product.sku} | Variant:{" "}
                                          {product.variant}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={detail.quantity}
                          onChange={(e) =>
                            updateOrderDetail(
                              detail.tempId,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input value={detail.sku} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label>Variant</Label>
                        <Input value={detail.variant} disabled />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

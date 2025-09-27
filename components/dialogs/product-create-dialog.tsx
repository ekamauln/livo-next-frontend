"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { productApi } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

// Zod form schema
const productCreateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  image: z.string().url("Image must be a valid URL").optional(),
  variant: z.string().min(1, "Variant is required"),
  location: z.string().min(1, "Location is required"),
  barcode: z.string().min(1, "Barcode is required"),
});

type ProductCreateFormData = z.infer<typeof productCreateSchema>;

interface ProductCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (product: Product) => void;
}

export function ProductCreateDialog({
  isOpen,
  onOpenChange,
  onProductCreated,
}: ProductCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create product form
  const productCreateForm = useForm<ProductCreateFormData>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      sku: "",
      name: "",
      image: "",
      variant: "",
      location: "",
      barcode: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProductCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await productApi.createProduct(data);
      const product = response.data as Product;
      onProductCreated(product);
      toast.success("Product created successfully!");
      productCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Create New Product
          </DialogTitle>
          <DialogDescription>
            Create a new product by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...productCreateForm}>
            <form
              onSubmit={productCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={productCreateForm.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="variant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter variant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productCreateForm.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter barcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <RippleButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </RippleButton>
                <RippleButton
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Create New Product
                </RippleButton>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

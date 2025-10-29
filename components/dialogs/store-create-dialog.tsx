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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Store as StoreIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Store } from "@/types/store";
import { storeApi } from "@/lib/api/storeApi";
import { Separator } from "@/components/ui/separator";

// Zod form schema
const storeCreateSchema = z.object({
  code: z.string().min(1, "Store code is required"),
  name: z.string().min(1, "Store name is required"),
});

type StoreCreateFormData = z.infer<typeof storeCreateSchema>;

interface StoreCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStoreCreated: (store: Store) => void;
}

export function StoreCreateDialog({
  isOpen,
  onOpenChange,
  onStoreCreated,
}: StoreCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create store form
  const storeCreateForm = useForm<StoreCreateFormData>({
    resolver: zodResolver(storeCreateSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: StoreCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await storeApi.createStore(data);
      const store = response.data as Store;
      onStoreCreated(store);
      toast.success("Store created successfully");
      storeCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create store. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" /> Create New Store
          </DialogTitle>
          <DialogDescription>
            Create a new store by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...storeCreateForm}>
            <form
              onSubmit={storeCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={storeCreateForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter store code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={storeCreateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter store name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <StoreIcon className="mr-2 h-4 w-4" />
                  )}
                  Create New Product
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

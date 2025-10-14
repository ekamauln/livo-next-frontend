"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Loader2, Package, Settings, PackageOpen } from "lucide-react";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { storeApi } from "@/lib/api/storeApi";
import { Store } from "@/types/store";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Form schemas
const storeSchema = z.object({
  code: z.string().min(1, "Store code is required"),
  name: z.string().min(1, "Store name is required"),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface StoreDialogProps {
  storeId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "profile";
  onStoreUpdate?: () => void;
}

export function StoreDialog({
  storeId,
  open,
  onOpenChange,
  initialTab = "detail",
  onStoreUpdate,
}: StoreDialogProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);

  // Store form
  const storeForm = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  // Fetch store details
  const fetchStoreDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await storeApi.getStoreById(id);
        const storeData = response.data;
        setStore(storeData);
        // Update store form with data
        storeForm.reset({
          code: storeData.code,
          name: storeData.name,
        });
      } catch (error) {
        console.error("Error fetching store details:", error);
        toast.error("Failed to fetch store details.", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [storeForm]
  );

  // Update store
  const updateStore = async (data: StoreFormData) => {
    if (!storeId) return;

    try {
      setUpdating(true);
      const response = await storeApi.updateStore(storeId, {
        code: data.code,
        name: data.name,
      });

      toast.success("Store updated successfully");
      // Update local store state with the returned data
      setStore(response.data);
      // Also update the form with the new data
      storeForm.reset({
        code: response.data.code,
        name: response.data.name,
      });
      onStoreUpdate?.();
    } catch (error) {
      console.error("Error updating store:", error);
      toast.error("Failed to update store", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && storeId) {
      fetchStoreDetail(storeId);
      setActiveTab(initialTab);
    } else {
      setStore(null);
      storeForm.reset({
        code: "",
        name: "",
      });
    }
  }, [open, storeId, initialTab, fetchStoreDetail, storeForm]);

  // Update form when store data changes
  useEffect(() => {
    if (store) {
      storeForm.reset({
        code: store.code,
        name: store.name,
      });
    }
  }, [store, storeForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <Package className="h-5 w-5" />
            {loading ? "Loading..." : store ? `${store.name}` : "Store Details"}
          </DialogTitle>
          <DialogDescription>
            {store
              ? `Manage store details for ${store.code}`
              : "View and manage store information"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading store details...
          </div>
        ) : store ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "detail" | "profile")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="detail" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Edit Store
              </TabsTrigger>
            </TabsList>

            <div>
              <TabsContents className="flex-1 overflow-y-auto">
                {/* Store Details Tab */}
                <TabsContent value="detail" className="space-y-6">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <PackageOpen className="h-5 w-5" />
                        Detail Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="w-1/4">Store ID</TableCell>
                              <TableCell className="font-mono">
                                {store.id}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Code</TableCell>
                              <TableCell className="font-mono">
                                {store.code}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Name</TableCell>
                              <TableCell className="text-wrap">
                                {store.name}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Store Tab */}
                <TabsContent value="profile">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <Settings className="h-5 w-5" />
                        Edit Store Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...storeForm}>
                        <form
                          onSubmit={storeForm.handleSubmit(updateStore)}
                          className="space-y-6"
                        >
                          <FormField
                            control={storeForm.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter store code"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={storeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter store name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <RippleButton
                              size="sm"
                              type="button"
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => setActiveTab("detail")}
                            >
                              Cancel
                            </RippleButton>
                            <RippleButton
                              size="sm"
                              type="submit"
                              disabled={updating}
                              className="cursor-pointer"
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Update Store
                            </RippleButton>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </TabsContents>
            </div>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No store selected or store not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

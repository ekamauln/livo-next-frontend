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
  TabsContents,
  TabsContent,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Edit, Save, X, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Return } from "@/types/return";
import { returnApi } from "@/lib/api/returnApi";
import { ApiError } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

// Form schema for editing return data
const editDataFormSchema = z.object({
  old_tracking: z.string().min(1, "Old tracking is required"),
  return_reason: z.string().min(1, "Return reason is required"),
  return_type: z.string().min(1, "Return type is required"),
});

type EditDataFormValues = z.infer<typeof editDataFormSchema>;

// Form schema for editing return admin data
const editAdminFormSchema = z.object({
  old_tracking: z.string().min(1, "Old tracking is required"),
  return_reason: z.string().min(1, "Return reason is required"),
  return_type: z.string().min(1, "Return type is required"),
  return_number: z.string().min(1, "Return number is required"),
  scrap_number: z.string().min(1, "Scrap number is required"),
});

type EditAdminFormValues = z.infer<typeof editAdminFormSchema>;

interface ReturnDialogProps {
  returnId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "edit-data" | "edit-admin";
  onReturnUpdate?: () => void;
}

export function ReturnDialog({
  returnId,
  open,
  onOpenChange,
  initialTab = "detail",
  onReturnUpdate,
}: ReturnDialogProps) {
  const [returnData, setReturnData] = useState<Return | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);

  // Return data form
  const editDataForm = useForm<EditDataFormValues>({
    resolver: zodResolver(editDataFormSchema),
    defaultValues: {
      old_tracking: "",
      return_reason: "",
      return_type: "",
    },
  });

  // Admin data form
  const editAdminForm = useForm<EditAdminFormValues>({
    resolver: zodResolver(editAdminFormSchema),
    defaultValues: {
      old_tracking: "",
      return_reason: "",
      return_type: "",
      return_number: "",
      scrap_number: "",
    },
  });

  // Fetch return details
  const fetchReturnDetails = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const result = await returnApi.getReturnById(id);

        console.log("API Response:", result); // Debug log

        if (result.success) {
          const returnData = result.data;
          console.log("Return Data:", returnData); // Debug log

          if (returnData) {
            setReturnData(returnData);
            // Update return data form values
            editDataForm.reset({
              old_tracking: returnData.old_tracking || "",
              return_reason: returnData.return_reason || "",
              return_type: returnData.return_type || "",
            });
            // Update admin form values
            editAdminForm.reset({
              old_tracking: returnData.old_tracking || "",
              return_reason: returnData.return_reason || "",
              return_type: returnData.return_type || "",
              return_number: returnData.return_number || "",
              scrap_number: returnData.scrap_number || "",
            });
          } else {
            throw new Error("Return data not found in response");
          }
        } else {
          throw new Error(result.message || "Failed to fetch return details");
        }
      } catch (error) {
        console.error("Error fetching return details:", error);
        if (error instanceof ApiError) {
          toast.error("Failed to fetch return details", {
            description: error.message,
          });
        } else {
          toast.error("Failed to fetch return details", {
            description:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [editDataForm, editAdminForm]
  );

  // Update return data
  const updateReturnData = async (data: EditDataFormValues) => {
    if (!returnId) return;

    try {
      setUpdating(true);
      const result = await returnApi.updateReturnData(returnId, {
        old_tracking: data.old_tracking,
        return_reason: data.return_reason,
        return_type: data.return_type,
      });

      console.log("Update Return Data Response:", result); // Debug log

      if (result.success) {
        const updatedReturn = result.data;
        console.log("Updated Return Data:", updatedReturn); // Debug log

        if (updatedReturn) {
          toast.success("Return data updated successfully");
          // Update local return state
          setReturnData(updatedReturn);
          // Update both forms with new data
          editDataForm.reset({
            old_tracking: updatedReturn.old_tracking || "",
            return_reason: updatedReturn.return_reason || "",
            return_type: updatedReturn.return_type || "",
          });
          editAdminForm.reset({
            old_tracking: updatedReturn.old_tracking || "",
            return_reason: updatedReturn.return_reason || "",
            return_type: updatedReturn.return_type || "",
            return_number: updatedReturn.return_number || "",
            scrap_number: updatedReturn.scrap_number || "",
          });
          onReturnUpdate?.();
        } else {
          throw new Error("Updated return data not found in response");
        }
      } else {
        throw new Error(result.message || "Failed to update return data");
      }
    } catch (error) {
      console.error("Error updating return data:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to update return data", {
          description: error.message,
        });
      } else {
        toast.error("Failed to update return data", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Update return admin data
  const updateReturnAdmin = async (data: EditAdminFormValues) => {
    if (!returnId) return;

    try {
      setUpdating(true);
      const result = await returnApi.updateReturnAdmin(returnId, {
        old_tracking: data.old_tracking,
        return_reason: data.return_reason,
        return_type: data.return_type,
        return_number: data.return_number,
        scrap_number: data.scrap_number,
      });

      console.log("Update Return Admin Response:", result); // Debug log

      if (result.success) {
        const updatedReturn = result.data;
        console.log("Updated Return Admin Data:", updatedReturn); // Debug log

        if (updatedReturn) {
          toast.success("Return admin data updated successfully");
          // Update local return state
          setReturnData(updatedReturn);
          // Update both forms with new data
          editDataForm.reset({
            old_tracking: updatedReturn.old_tracking || "",
            return_reason: updatedReturn.return_reason || "",
            return_type: updatedReturn.return_type || "",
          });
          editAdminForm.reset({
            old_tracking: updatedReturn.old_tracking || "",
            return_reason: updatedReturn.return_reason || "",
            return_type: updatedReturn.return_type || "",
            return_number: updatedReturn.return_number || "",
            scrap_number: updatedReturn.scrap_number || "",
          });
          onReturnUpdate?.();
        } else {
          throw new Error("Updated return admin data not found in response");
        }
      } else {
        throw new Error(result.message || "Failed to update return admin data");
      }
    } catch (error) {
      console.error("Error updating return admin data:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to update return admin data", {
          description: error.message,
        });
      } else {
        toast.error("Failed to update return admin data", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && returnId) {
      fetchReturnDetails(returnId);
      setActiveTab(initialTab);
    } else {
      setReturnData(null);
      editDataForm.reset({
        old_tracking: "",
        return_reason: "",
        return_type: "",
      });
      editAdminForm.reset({
        old_tracking: "",
        return_reason: "",
        return_type: "",
        return_number: "",
        scrap_number: "",
      });
    }
  }, [
    open,
    returnId,
    initialTab,
    fetchReturnDetails,
    editDataForm,
    editAdminForm,
  ]);

  // Update forms when return data changes
  useEffect(() => {
    if (returnData) {
      editDataForm.reset({
        old_tracking: returnData.old_tracking || "",
        return_reason: returnData.return_reason || "",
        return_type: returnData.return_type || "",
      });
      editAdminForm.reset({
        old_tracking: returnData.old_tracking || "",
        return_reason: returnData.return_reason || "",
        return_type: returnData.return_type || "",
        return_number: returnData.return_number || "",
        scrap_number: returnData.scrap_number || "",
      });
    }
  }, [returnData, editDataForm, editAdminForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : returnData
              ? `Return #${returnData.id} - ${returnData.new_tracking}`
              : "Return Details"}
          </DialogTitle>
          <DialogDescription>
            {returnData
              ? `View and manage return details for tracking ${returnData.new_tracking}`
              : "View and manage return details"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Package className="h-6 w-6 animate-spin mr-2" />
            Loading return details...
          </div>
        ) : returnData ? (
          <Tabs
            value={activeTab}
            onValueChange={(value: string) =>
              setActiveTab(value as "detail" | "edit-data" | "edit-admin")
            }
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="detail" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger
                value="edit-data"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Data
              </TabsTrigger>
              <TabsTrigger
                value="edit-admin"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Admin
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0 mt-4">
              <TabsContents>
                {/* Detail Tab */}
                <TabsContent value="detail" className="space-y-6 mt-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Return Information
                          </h3>
                          <Badge variant="outline">ID: {returnData.id}</Badge>
                        </div>
                        <Separator />
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">
                                New Tracking
                              </TableCell>
                              <TableCell>{returnData.new_tracking}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Old Tracking
                              </TableCell>
                              <TableCell>
                                {returnData.old_tracking || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Channel
                              </TableCell>
                              <TableCell>{returnData.channel?.name}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Store ID
                              </TableCell>
                              <TableCell>{returnData.store?.name}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Return Type
                              </TableCell>
                              <TableCell>
                                {returnData.return_type || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Return Reason
                              </TableCell>
                              <TableCell>
                                {returnData.return_reason || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Return Number
                              </TableCell>
                              <TableCell>
                                {returnData.return_number || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Scrap Number
                              </TableCell>
                              <TableCell>
                                {returnData.scrap_number || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Created At
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(returnData.created_at),
                                  "dd MMMM yyyy - HH:mm"
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Updated At
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(returnData.updated_at),
                                  "dd MMMM yyyy - HH:mm"
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Return Details Section */}
                      {returnData.details && returnData.details.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">
                              Return Details
                            </h3>
                            <Table>
                              <TableBody>
                                {returnData.details.map((detail) => (
                                  <TableRow key={detail.id}>
                                    <TableCell className="font-medium">
                                      Product ID: {detail.product_id}
                                    </TableCell>
                                    <TableCell>
                                      Quantity: {detail.quantity}
                                    </TableCell>
                                    <TableCell>
                                      {format(
                                        new Date(detail.created_at),
                                        "PPpp"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Data Tab */}
                <TabsContent value="edit-data" className="space-y-4 mt-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Edit className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">
                            Edit Return Data
                          </h3>
                        </div>
                        <Separator />
                        <Form {...editDataForm}>
                          <form
                            onSubmit={editDataForm.handleSubmit(
                              updateReturnData
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={editDataForm.control}
                              name="old_tracking"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Old Tracking</FormLabel>
                                  <FormControl>
                                    <input
                                      type="text"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter old tracking number"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editDataForm.control}
                              name="return_type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Return Type</FormLabel>
                                  <FormControl>
                                    <input
                                      type="text"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter return type"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editDataForm.control}
                              name="return_reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Return Reason</FormLabel>
                                  <FormControl>
                                    <textarea
                                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter return reason"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab("detail")}
                                disabled={updating}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updating}>
                                <Save className="mr-2 h-4 w-4" />
                                {updating ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Admin Tab */}
                <TabsContent value="edit-admin" className="space-y-4 mt-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Edit className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">
                            Edit Admin Data
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <p>Admin access required to edit these fields</p>
                        </div>
                        <Separator />
                        <Form {...editAdminForm}>
                          <form
                            onSubmit={editAdminForm.handleSubmit(
                              updateReturnAdmin
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={editAdminForm.control}
                              name="old_tracking"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Old Tracking</FormLabel>
                                  <FormControl>
                                    <input
                                      type="text"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter old tracking number"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editAdminForm.control}
                              name="return_type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Return Type</FormLabel>
                                  <FormControl>
                                    <input
                                      type="text"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter return type"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editAdminForm.control}
                              name="return_reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Return Reason</FormLabel>
                                  <FormControl>
                                    <textarea
                                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter return reason"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editAdminForm.control}
                              name="return_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Return Number</FormLabel>
                                  <FormControl>
                                    <input
                                      type="text"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter return number"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editAdminForm.control}
                              name="scrap_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Scrap Number</FormLabel>
                                  <FormControl>
                                    <input
                                      type="text"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Enter scrap number"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab("detail")}
                                disabled={updating}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updating}>
                                <Save className="mr-2 h-4 w-4" />
                                {updating ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </TabsContents>
            </div>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No return selected or return not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

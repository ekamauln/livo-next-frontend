"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Complain } from "@/types/complain";
import { complainApi } from "@/lib/api/complainApi";
import { adminApi } from "@/lib/api/adminApi";
import { ApiError } from "@/lib/api/types";
import type { User } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

// Form schema for editing complain data
const editFormSchema = z.object({
  solution: z.string().min(1, "Solution is required"),
  total_fee: z.number().min(0, "Total fee must be positive"),
  user_details: z
    .array(
      z.object({
        user_id: z.number(),
        fee_charge: z.number().min(0, "Fee charge must be positive"),
        user_name: z.string().optional(), // For display purposes
      })
    )
    .refine(
      (userDetails) => {
        const userIds = userDetails.map((detail) => detail.user_id);
        return userIds.length === new Set(userIds).size;
      },
      {
        message:
          "Duplicate users are not allowed. Each user can only be assigned once.",
        path: ["user_details"],
      }
    ),
});

type EditFormValues = z.infer<typeof editFormSchema>;

interface ComplainDialogProps {
  complainId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "edit-data";
  onComplainUpdate?: () => void;
}

export function ComplainDialog({
  complainId,
  open,
  onOpenChange,
  initialTab = "detail",
  onComplainUpdate,
}: ComplainDialogProps) {
  const [complain, setComplain] = useState<Complain | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState<{
    [key: number]: boolean;
  }>({});
  const [userSearch, setUserSearch] = useState<{ [key: number]: string }>({});

  // Complain data form
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      solution: "",
      total_fee: 0,
      user_details: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: editForm.control,
    name: "user_details",
  });

  // Filter users based on search for a specific index
  const getFilteredUsers = (index: number) => {
    const searchTerm = userSearch[index] || "";
    if (!searchTerm.trim()) {
      return users;
    }

    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Check if user is already added
  const isUserAlreadyAdded = (userId: number) => {
    const currentUserDetails = editForm.getValues("user_details");
    return currentUserDetails.some((detail) => detail.user_id === userId);
  };

  // Handle user selection with duplicate check
  const handleUserSelection = (userId: number, index: number) => {
    if (isUserAlreadyAdded(userId)) {
      const selectedUser = users.find((u) => u.id === userId);
      toast.error("Duplicate User", {
        description: `${
          selectedUser?.full_name || "This user"
        } is already added to the user details.`,
      });
      return;
    }

    const selectedUser = users.find((u) => u.id === userId);

    // Update the form
    editForm.setValue(`user_details.${index}.user_id`, userId);
    if (selectedUser) {
      editForm.setValue(
        `user_details.${index}.user_name`,
        selectedUser.full_name
      );
    }

    // Close the combobox and clear search
    setUserSearchOpen((prev) => ({ ...prev, [index]: false }));
    setUserSearch((prev) => ({ ...prev, [index]: "" }));
  };

  // Fetch users for dropdown
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const result = await adminApi.getUsers(1, 100); // Get first 100 users
      if (result.success && result.data) {
        // The users are directly in data, not in data.users based on API structure
        const usersArray = Array.isArray(result.data.users)
          ? result.data.users
          : [];
        setUsers(usersArray);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch complain details
  const fetchComplainDetails = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const result = await complainApi.getComplainById(id);

        console.log("API Response:", result); // Debug log

        if (result.success) {
          const complain = result.data;
          console.log("Complain Data:", complain); // Debug log

          if (complain) {
            setComplain(complain);
            // Update complain data form values
            editForm.reset({
              solution: complain.solution || "",
              total_fee: complain.total_fee || 0,
              user_details: (complain.user_details || []).map((detail) => ({
                user_id: detail.user_id,
                fee_charge: detail.fee_charge,
                user_name:
                  detail.user?.full_name || `User ID: ${detail.user_id}`,
              })),
            });
          } else {
            throw new Error("Complain data not found in response");
          }
        } else {
          throw new Error(result.message || "Failed to fetch complain details");
        }
      } catch (error) {
        console.error("Error fetching complain details:", error);
        if (error instanceof ApiError) {
          toast.error("Failed to fetch complain details", {
            description: error.message,
          });
        } else {
          toast.error("Failed to fetch complain details", {
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
    [editForm]
  );

  // Update complain data
  const updateComplain = async (data: EditFormValues) => {
    if (!complainId) return;

    try {
      setUpdating(true);
      const result = await complainApi.updateComplain(complainId, {
        solution: data.solution,
        total_fee: data.total_fee,
        user_details: data.user_details.map((detail) => ({
          user_id: detail.user_id,
          fee_charge: detail.fee_charge,
        })),
      });

      console.log("Update Complain Response:", result); // Debug log

      if (result.success) {
        const updatedComplain = result.data;
        console.log("Updated Complain Data:", updatedComplain); // Debug log

        if (updatedComplain) {
          toast.success("Complain data updated successfully");
          // Update local complain state
          setComplain(updatedComplain);
          // Update form with new data
          editForm.reset({
            solution: updatedComplain.solution || "",
            total_fee: updatedComplain.total_fee || 0,
            user_details: (updatedComplain.user_details || []).map(
              (detail) => ({
                user_id: detail.user_id,
                fee_charge: detail.fee_charge,
                user_name:
                  detail.user?.full_name || `User ID: ${detail.user_id}`,
              })
            ),
          });
          onComplainUpdate?.();
          onOpenChange(false);
        } else {
          throw new Error("Updated complain data not found in response");
        }
      } else {
        throw new Error(result.message || "Failed to update complain data");
      }
    } catch (error) {
      console.error("Error updating complain data:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to update complain data", {
          description: error.message,
        });
      } else {
        toast.error("Failed to update complain data", {
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
    if (open && complainId) {
      fetchComplainDetails(complainId);
      fetchUsers();
      setActiveTab(initialTab);
    } else {
      setComplain(null);
      setUserSearch({});
      setUserSearchOpen({});
      editForm.reset({
        solution: "",
        total_fee: 0,
        user_details: [],
      });
    }
  }, [
    open,
    complainId,
    initialTab,
    fetchComplainDetails,
    fetchUsers,
    editForm,
  ]);

  // Update forms when complain data changes
  useEffect(() => {
    if (complain) {
      editForm.reset({
        solution: complain.solution || "",
        total_fee: complain.total_fee || 0,
        user_details: (complain.user_details || []).map((detail) => ({
          user_id: detail.user_id,
          fee_charge: detail.fee_charge,
          user_name: detail.user?.full_name || `User ID: ${detail.user_id}`,
        })),
      });
    }
  }, [complain, editForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : complain
              ? `Complain #${complain.id} - ${complain.tracking}`
              : "Complain Details"}
          </DialogTitle>
          <DialogDescription>
            {complain
              ? `View and manage complain details for tracking ${complain.tracking}.`
              : "View and manage complain details"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Package className="h-6 w-6 animate-spin mr-2" />
            Loading complain details...
          </div>
        ) : complain ? (
          <Tabs
            value={activeTab}
            onValueChange={(value: string) =>
              setActiveTab(value as "detail" | "edit-data")
            }
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className={`grid w-full grid-cols-2 flex-shrink-0`}>
              <TabsTrigger value="detail" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Details
              </TabsTrigger>

              <TabsTrigger
                value="edit-data"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Input Solution
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
                            Complain Information
                          </h3>
                          <Badge variant="outline">ID: {complain.id}</Badge>
                        </div>

                        <div className="border rounded-md">
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Code
                                </TableCell>
                                <TableCell>{complain.code}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Tracking
                                </TableCell>
                                <TableCell>{complain.tracking}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Order ID
                                </TableCell>
                                <TableCell>
                                  {complain.order_id || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Channel
                                </TableCell>
                                <TableCell>
                                  {complain.channel?.name || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Store
                                </TableCell>
                                <TableCell>
                                  {complain.store?.name || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Creator
                                </TableCell>
                                <TableCell>
                                  {complain.creator?.full_name || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Description
                                </TableCell>
                                <TableCell className="break-words whitespace-normal max-w-md">
                                  {complain.description || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Solution
                                </TableCell>
                                <TableCell className="break-words whitespace-normal max-w-md">
                                  {complain.solution || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Total Fee
                                </TableCell>
                                <TableCell>
                                  Rp.{" "}
                                  {(complain.total_fee || 0).toLocaleString(
                                    "id-ID"
                                  )}
                                </TableCell>
                              </TableRow>

                              <TableRow>
                                <TableCell className="font-medium w-1/4">
                                  Created
                                </TableCell>
                                <TableCell>
                                  {format(
                                    new Date(complain.created_at),
                                    "dd MMMM yyyy - HH:mm"
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Product Details Section */}
                      {(() => {
                        const product_details = complain.product_details || [];
                        if (product_details.length === 0) return null;

                        return (
                          <>
                            <div className="space-y-4 mt-6">
                              <h3 className="text-lg font-semibold">
                                Product Details ({product_details.length}{" "}
                                {product_details.length === 1
                                  ? "item"
                                  : "items"}
                                )
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                {product_details.map((detail) => (
                                  <div
                                    key={detail.id}
                                    className="border rounded-lg p-4 bg-muted/30"
                                  >
                                    <div className="flex gap-4">
                                      {/* Product Image */}
                                      {detail.product?.image && (
                                        <div className="flex-shrink-0">
                                          <Image
                                            src={detail.product.image}
                                            alt={
                                              detail.product.name || "Product"
                                            }
                                            width={80}
                                            height={80}
                                            className="w-20 h-20 object-cover rounded-md border"
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                "/images/placeholder.png";
                                            }}
                                          />
                                        </div>
                                      )}

                                      {/* Product Details */}
                                      <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                          <div className="space-y-1">
                                            <div
                                              className="font-medium w-[590px] text-wrap"
                                              title={
                                                detail.product?.name ||
                                                `Product ID: ${detail.product_id}`
                                              }
                                            >
                                              {detail.product?.name ||
                                                `Product ID: ${detail.product_id}`}
                                            </div>
                                            {detail.product?.sku && (
                                              <div className="text-sm text-muted-foreground font-mono">
                                                SKU: {detail.product.sku}
                                              </div>
                                            )}
                                            {detail.product?.variant &&
                                              detail.product.variant !==
                                                "-" && (
                                                <div className="text-sm text-muted-foreground">
                                                  Variant:{" "}
                                                  {detail.product.variant}
                                                </div>
                                              )}
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className="ml-2"
                                          >
                                            Qty: {detail.quantity}
                                          </Badge>
                                        </div>

                                        {detail.product?.location && (
                                          <div className="text-sm text-muted-foreground">
                                            <span className="font-medium">
                                              Location:
                                            </span>{" "}
                                            {detail.product.location}
                                          </div>
                                        )}

                                        <div className="text-xs text-muted-foreground">
                                          Added:{" "}
                                          {format(
                                            new Date(detail.created_at),
                                            "dd MMMM yyyy - HH:mm"
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* User Details Section */}
                      {(() => {
                        const user_details = complain.user_details || [];
                        if (user_details.length === 0) return null;

                        return (
                          <>
                            <div className="space-y-4 mt-6">
                              <h3 className="text-lg font-semibold">
                                User Details ({user_details.length}{" "}
                                {user_details.length === 1 ? "user" : "users"})
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {user_details.map((detail) => (
                                  <div
                                    key={detail.id}
                                    className="border rounded-lg p-4 bg-muted/30"
                                  >
                                    <div className="flex gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                          <div className="space-y-1">
                                            <div className="font-medium">
                                              {detail.user?.full_name ||
                                                `User ID: ${detail.user_id}`}
                                            </div>
                                            {detail.user?.username && (
                                              <div className="text-sm text-muted-foreground font-mono">
                                                Username: {detail.user.username}
                                              </div>
                                            )}
                                            {detail.user?.roles &&
                                              detail.user.roles.length > 0 && (
                                                <div className="text-sm text-muted-foreground">
                                                  Roles:{" "}
                                                  {detail.user.roles
                                                    .map((role) => role.name)
                                                    .join(", ")}
                                                </div>
                                              )}
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className="ml-2"
                                          >
                                            Fee: Rp.{" "}
                                            {(
                                              detail.fee_charge || 0
                                            ).toLocaleString("id-ID")}
                                          </Badge>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                          Added:{" "}
                                          {format(
                                            new Date(detail.created_at),
                                            "dd MMMM yyyy - HH:mm"
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
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
                            Input Complain Solution
                          </h3>
                        </div>
                        <Separator />
                        <Form {...editForm}>
                          <form
                            onSubmit={editForm.handleSubmit(updateComplain)}
                            className="space-y-6"
                          >
                            <FormField
                              control={editForm.control}
                              name="solution"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Solution</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Enter solution for the complain"
                                      disabled={updating}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editForm.control}
                              name="total_fee"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total Fee (Rp)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter total fee"
                                      disabled={updating}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <FormLabel>User Details</FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (users.length > 0) {
                                      // Find first available user that hasn't been added
                                      const currentUserDetails =
                                        editForm.getValues("user_details");
                                      const usedUserIds =
                                        currentUserDetails.map(
                                          (detail) => detail.user_id
                                        );
                                      const availableUser = users.find(
                                        (user) => !usedUserIds.includes(user.id)
                                      );

                                      if (availableUser) {
                                        const newIndex = fields.length;
                                        append({
                                          user_id: availableUser.id,
                                          fee_charge: 0,
                                          user_name: availableUser.full_name,
                                        });
                                        setUserSearch((prev) => ({
                                          ...prev,
                                          [newIndex]: "",
                                        }));
                                      } else {
                                        toast.error("No Available Users", {
                                          description:
                                            "All users have already been added to the user details.",
                                        });
                                      }
                                    }
                                  }}
                                  disabled={updating || loadingUsers}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add User
                                </Button>
                              </div>

                              <div className="space-y-3">
                                {fields.map((field, index) => (
                                  <div
                                    key={field.id}
                                    className="flex gap-3 justify-between items-center"
                                  >
                                    <FormField
                                      control={editForm.control}
                                      name={`user_details.${index}.user_id`}
                                      render={({ field: userField }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Popover
                                              open={
                                                userSearchOpen[index] || false
                                              }
                                              onOpenChange={(open) => {
                                                setUserSearchOpen((prev) => ({
                                                  ...prev,
                                                  [index]: open,
                                                }));
                                              }}
                                            >
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  role="combobox"
                                                  aria-expanded={
                                                    userSearchOpen[index] ||
                                                    false
                                                  }
                                                  className="w-full justify-between"
                                                  disabled={updating}
                                                >
                                                  {userField.value
                                                    ? (() => {
                                                        const selectedUser =
                                                          users.find(
                                                            (u) =>
                                                              u.id ===
                                                              userField.value
                                                          );
                                                        return selectedUser
                                                          ? `${selectedUser.full_name} (${selectedUser.username})`
                                                          : "Select user...";
                                                      })()
                                                    : "Select user..."}
                                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-full p-0">
                                                <Command>
                                                  <CommandInput
                                                    placeholder="Search users..."
                                                    value={
                                                      userSearch[index] || ""
                                                    }
                                                    onValueChange={(value) => {
                                                      setUserSearch((prev) => ({
                                                        ...prev,
                                                        [index]: value,
                                                      }));
                                                    }}
                                                  />
                                                  <CommandList>
                                                    <CommandEmpty>
                                                      {loadingUsers
                                                        ? "Loading users..."
                                                        : "No users found."}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                      {getFilteredUsers(
                                                        index
                                                      ).map((user) => {
                                                        const isAlreadyAdded =
                                                          isUserAlreadyAdded(
                                                            user.id
                                                          );
                                                        const isCurrentSelection =
                                                          userField.value ===
                                                          user.id;

                                                        return (
                                                          <CommandItem
                                                            key={user.id}
                                                            value={`${user.full_name} ${user.username} ${user.email}`}
                                                            onSelect={() => {
                                                              handleUserSelection(
                                                                user.id,
                                                                index
                                                              );
                                                              userField.onChange(
                                                                user.id
                                                              );
                                                            }}
                                                            disabled={
                                                              isAlreadyAdded &&
                                                              !isCurrentSelection
                                                            }
                                                            className={cn(
                                                              isAlreadyAdded &&
                                                                !isCurrentSelection &&
                                                                "opacity-50 cursor-not-allowed"
                                                            )}
                                                          >
                                                            <Check
                                                              className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isCurrentSelection
                                                                  ? "opacity-100"
                                                                  : "opacity-0"
                                                              )}
                                                            />
                                                            <div className="flex flex-col flex-1">
                                                              <div className="flex items-center justify-between">
                                                                <span
                                                                  className={cn(
                                                                    "font-medium",
                                                                    isAlreadyAdded &&
                                                                      !isCurrentSelection &&
                                                                      "text-muted-foreground"
                                                                  )}
                                                                >
                                                                  {
                                                                    user.full_name
                                                                  }
                                                                </span>
                                                                {isAlreadyAdded &&
                                                                  !isCurrentSelection && (
                                                                    <Badge
                                                                      variant="secondary"
                                                                      className="text-xs ml-2"
                                                                    >
                                                                      Already
                                                                      Added
                                                                    </Badge>
                                                                  )}
                                                              </div>
                                                              <span className="text-sm text-muted-foreground">
                                                                {user.username}{" "}
                                                                • {user.email}
                                                              </span>
                                                            </div>
                                                          </CommandItem>
                                                        );
                                                      })}
                                                    </CommandGroup>
                                                  </CommandList>
                                                </Command>
                                              </PopoverContent>
                                            </Popover>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={editForm.control}
                                      name={`user_details.${index}.fee_charge`}
                                      render={({ field: feeField }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input
                                              type="number"
                                              placeholder="Enter fee"
                                              disabled={updating}
                                              {...feeField}
                                              onChange={(e) =>
                                                feeField.onChange(
                                                  Number(e.target.value)
                                                )
                                              }
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => remove(index)}
                                      disabled={updating}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              {fields.length === 0 && (
                                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-md">
                                  No user details added. Click &quot;Add
                                  User&quot; to add responsibility assignments.
                                </div>
                              )}

                              {/* Display form-level errors for duplicate users */}
                              {editForm.formState.errors.user_details?.root && (
                                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                                  {
                                    editForm.formState.errors.user_details.root
                                      .message
                                  }
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
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
            No complain selected or complain not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

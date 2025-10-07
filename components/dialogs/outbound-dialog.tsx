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
import { Package, Truck, Edit, Save, X, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Outbound } from "@/types/outbound";
import { outboundApi } from "@/lib/api/outboundApi";
import { ApiError } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

// Form schema for editing expedition
const editFormSchema = z.object({
  expedition: z.string().min(1, "Expedition is required"),
  expedition_color: z.string().min(1, "Expedition color is required"),
  expedition_slug: z.string().min(1, "Expedition slug is required"),
});

type EditFormData = z.infer<typeof editFormSchema>;

interface OutboundDialogProps {
  outboundId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOutboundUpdate?: () => void;
}

export function OutboundDialog({
  outboundId,
  open,
  onOpenChange,
  onOutboundUpdate,
}: OutboundDialogProps) {
  const [outbound, setOutbound] = useState<Outbound | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Expedition options for TKP0 tracking
  const expeditionOptions = [
    {
      expedition: "ID Express",
      expedition_color: "#b10000",
      expedition_slug: "id-express",
    },
    {
      expedition: "JNE",
      expedition_color: "#296bff",
      expedition_slug: "jne",
    },
  ];

  const form = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      expedition: "",
      expedition_color: "",
      expedition_slug: "",
    },
  });

  // Check if tracking can be edited (starts with TKP0)
  const canEdit = outbound?.tracking?.startsWith("TKP0") || false;

  // Fetch outbound details
  const fetchOutboundDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await outboundApi.getOutboundById(id);

        if (response.success) {
          setOutbound(response.data);
          // Set form values
          form.setValue("expedition", response.data.expedition);
          form.setValue("expedition_color", response.data.expedition_color);
          form.setValue("expedition_slug", response.data.expedition_slug);
        } else {
          toast.error("Failed to fetch outbound details");
        }
      } catch (error) {
        console.error("Error fetching outbound details:", error);
        let errorMessage = "Failed to fetch outbound details";

        if (error instanceof ApiError) {
          if (error.status === 404) {
            errorMessage = "Outbound not found";
          } else if (error.status === 401) {
            errorMessage = "Session expired. Please login again";
          } else if (error.status >= 500) {
            errorMessage = "Server error. Please try again later";
          }
        }

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  // Update outbound
  const updateOutbound = async (data: EditFormData) => {
    if (!outboundId || !outbound) return;

    try {
      setUpdating(true);
      const response = await outboundApi.updateOutbound(outboundId, data);

      if (response.success) {
        toast.success("Outbound updated successfully!");
        setOutbound(response.data);
        setIsEditing(false);
        onOutboundUpdate?.();
      } else {
        throw new Error(response.message || "Failed to update outbound");
      }
    } catch (error) {
      console.error("Error updating outbound:", error);
      let errorMessage = "Failed to update outbound";

      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Handle expedition selection
  const handleExpeditionSelect = (option: (typeof expeditionOptions)[0]) => {
    form.setValue("expedition", option.expedition);
    form.setValue("expedition_color", option.expedition_color);
    form.setValue("expedition_slug", option.expedition_slug);
  };

  // Effects
  useEffect(() => {
    if (open && outboundId) {
      fetchOutboundDetail(outboundId);
      setIsEditing(false);
    } else {
      setOutbound(null);
      setIsEditing(false);
      form.reset();
    }
  }, [open, outboundId, fetchOutboundDetail, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Outbound Details
            {canEdit && (
              <Badge variant="outline" className="ml-2">
                Editable
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {outbound?.tracking
              ? `Tracking: ${outbound.tracking}`
              : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-4 rounded border border-border"></div>
            <div className="h-4 rounded border border-border"></div>
            <div className="h-4 rounded w-3/4 border border-border"></div>
          </div>
        ) : outbound ? (
          <Card>
            <CardContent>
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">
                        Expedition Information
                      </h3>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Expedition
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                form.reset({
                                  expedition: outbound.expedition,
                                  expedition_color: outbound.expedition_color,
                                  expedition_slug: outbound.expedition_slug,
                                });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={form.handleSubmit(updateOutbound)}
                              disabled={updating}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Expedition Information */}
                <div className="space-y-4">
                  {isEditing && canEdit ? (
                    <Form {...form}>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="expedition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Expedition</FormLabel>
                              <FormControl>
                                <div className="grid gap-3">
                                  {expeditionOptions.map((option) => (
                                    <Button
                                      key={option.expedition_slug}
                                      type="button"
                                      variant={
                                        field.value === option.expedition
                                          ? "default"
                                          : "outline"
                                      }
                                      className="justify-start h-auto p-4"
                                      onClick={() =>
                                        handleExpeditionSelect(option)
                                      }
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-4 h-4 rounded-full"
                                          style={{
                                            backgroundColor:
                                              option.expedition_color,
                                          }}
                                        />
                                        <div className="text-left">
                                          <div className="font-medium">
                                            {option.expedition}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {option.expedition_slug}
                                          </div>
                                        </div>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="rounded border border-border">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="w-1/4">ID</TableCell>
                              <TableCell>{outbound.id}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Tracking</TableCell>
                              <TableCell>{outbound.tracking}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">
                                Expedition
                              </TableCell>
                              <TableCell>
                                <Badge
                                  style={{
                                    backgroundColor: outbound.expedition_color,
                                    color: "white",
                                  }}
                                >
                                  {outbound.expedition}
                                </Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">User</TableCell>
                              <TableCell>
                                <span>{outbound.user?.full_name}</span>{" "}
                                <span className="text-muted-foreground">
                                  (@{outbound.user?.username})
                                </span>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Created</TableCell>
                              <TableCell>
                                {format(
                                  new Date(outbound.created_at),
                                  "dd MMM yyyy HH:mm:ss"
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {!canEdit && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Only outbound records with tracking numbers starting
                        with &quot;TKP0&quot; can be edited.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No outbound data found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

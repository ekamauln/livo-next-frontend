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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { expeditionApi } from "@/lib/api/expeditionApi";
import { Expedition } from "@/types/expedition";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerFormat,
  ColorPickerOutput,
} from "@/components/ui/shadcn-io/color-picker";

// Form schemas
const expeditionSchema = z.object({
  code: z.string().min(1, "Expedition code is required"),
  name: z.string().min(1, "Expedition name is required"),
  slug: z.string().min(1, "Expedition slug is required"),
  color: z.string().min(1, "Expedition color is required"),
});

type ExpeditionFormData = z.infer<typeof expeditionSchema>;

interface ExpeditionDialogProps {
  expeditionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "profile";
  onExpeditionUpdate?: () => void;
}

export function ExpeditionDialog({
  expeditionId,
  open,
  onOpenChange,
  initialTab = "detail",
  onExpeditionUpdate,
}: ExpeditionDialogProps) {
  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);

  // Expedition form
  const expeditionForm = useForm<ExpeditionFormData>({
    resolver: zodResolver(expeditionSchema),
    defaultValues: {
      code: "",
      name: "",
      slug: "",
      color: "",
    },
  });

  // Fetch expedition details
  const fetchExpeditionDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await expeditionApi.getExpeditionById(id);
        const expeditionData = response.data;
        setExpedition(expeditionData);
        // Update expedition form with data
        expeditionForm.reset({
          code: expeditionData.code,
          name: expeditionData.name,
          slug: expeditionData.slug,
          color: expeditionData.color,
        });
      } catch (error) {
        console.error("Error fetching expedition details:", error);
        toast.error("Failed to fetch expedition details.", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [expeditionForm]
  );

  // Update expedition
  const updateExpedition = async (data: ExpeditionFormData) => {
    if (!expeditionId) return;

    try {
      setUpdating(true);
      const response = await expeditionApi.updateExpedition(expeditionId, {
        code: data.code,
        name: data.name,
        slug: data.slug,
        color: data.color,
      });

      toast.success("Expedition updated successfully");
      // Update local expedition state with the returned data
      setExpedition(response.data);
      // Also update the form with the new data
      expeditionForm.reset({
        code: response.data.code,
        name: response.data.name,
        slug: response.data.slug,
        color: response.data.color,
      });
      onExpeditionUpdate?.();
    } catch (error) {
      console.error("Error updating expedition:", error);
      toast.error("Failed to update expedition", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && expeditionId) {
      fetchExpeditionDetail(expeditionId);
      setActiveTab(initialTab);
    } else {
      setExpedition(null);
      expeditionForm.reset({
        code: "",
        name: "",
        slug: "",
        color: "",
      });
    }
  }, [open, expeditionId, initialTab, fetchExpeditionDetail, expeditionForm]);

  // Update form when expedition data changes
  useEffect(() => {
    if (expedition) {
      expeditionForm.reset({
        code: expedition.code,
        name: expedition.name,
        slug: expedition.slug,
        color: expedition.color,
      });
    }
  }, [expedition, expeditionForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : expedition
              ? `${expedition.name}`
              : "Expedition Details"}
          </DialogTitle>
          <DialogDescription>
            {expedition
              ? `Manage expedition details for ${expedition.code}`
              : "View and manage expedition information"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading expedition details...
          </div>
        ) : expedition ? (
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
                Edit Expedition
              </TabsTrigger>
            </TabsList>

            <div>
              <TabsContents className="flex-1 overflow-y-auto">
                {/* Expedition Details Tab */}
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
                              <TableCell className="w-1/4">
                                Expedition ID
                              </TableCell>
                              <TableCell className="font-mono">
                                {expedition.id}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Code</TableCell>
                              <TableCell className="font-mono">
                                {expedition.code}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Name</TableCell>
                              <TableCell className="text-wrap">
                                {expedition.name}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Slug</TableCell>
                              <TableCell className="text-wrap">
                                {expedition.slug}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Color</TableCell>
                              <TableCell className="text-wrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-6 h-6 rounded-full border-2 border-muted-foreground shadow-sm"
                                    style={{
                                      backgroundColor: expedition.color,
                                    }}
                                    title={expedition.color}
                                  />
                                  <span className="ml-2">
                                    {expedition.color}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Expedition Tab */}
                <TabsContent value="profile">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <PackageOpen className="h-5 w-5" />
                        Edit Expedition Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...expeditionForm}>
                        <form
                          onSubmit={expeditionForm.handleSubmit(
                            updateExpedition
                          )}
                          className="space-y-6"
                        >
                          <FormField
                            control={expeditionForm.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expedition Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter expedition code"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={expeditionForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expedition Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter expedition name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={expeditionForm.control}
                            name="slug"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expedition Slug</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter expedition slug"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={expeditionForm.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expedition Color</FormLabel>
                                <FormControl>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Enter hex color (e.g., #FF0000)"
                                        value={field.value || ""}
                                        onChange={(e) =>
                                          field.onChange(e.target.value)
                                        }
                                        className="font-mono"
                                      />
                                    </div>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className="shrink-0"
                                        >
                                          <div
                                            className="w-4 h-4 rounded border"
                                            style={{
                                              backgroundColor:
                                                field.value || "#000000",
                                            }}
                                          />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto p-4"
                                        align="end"
                                      >
                                        <ColorPicker
                                          value={field.value || "#000000"}
                                          onChange={(color) => {
                                            if (
                                              Array.isArray(color) &&
                                              color.length >= 3
                                            ) {
                                              const hex = `#${Math.round(
                                                color[0]
                                              )
                                                .toString(16)
                                                .padStart(2, "0")}${Math.round(
                                                color[1]
                                              )
                                                .toString(16)
                                                .padStart(2, "0")}${Math.round(
                                                color[2]
                                              )
                                                .toString(16)
                                                .padStart(2, "0")}`;
                                              field.onChange(hex);
                                            } else if (
                                              typeof color === "string"
                                            ) {
                                              field.onChange(color);
                                            }
                                          }}
                                          className="w-80"
                                        >
                                          <div className="flex gap-4">
                                            <div className="flex-1">
                                              <ColorPickerSelection className="h-32 w-full" />
                                            </div>
                                            <div className="flex flex-col gap-2 w-20">
                                              <div
                                                className="w-full h-8 rounded border border-input"
                                                style={{
                                                  backgroundColor:
                                                    field.value || "#000000",
                                                }}
                                              />
                                              <ColorPickerOutput />
                                            </div>
                                          </div>
                                          <div className="space-y-2 mt-3">
                                            <ColorPickerHue />
                                            <ColorPickerFormat />
                                          </div>
                                        </ColorPicker>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => setActiveTab("detail")}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={updating}
                              className="cursor-pointer"
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Update Product
                            </Button>
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
            No expedition selected or expedition not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

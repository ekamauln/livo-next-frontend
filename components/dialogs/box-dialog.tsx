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
import { boxApi } from "@/lib/api/boxApi";
import { Box } from "@/types/box";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Form schemas
const boxSchema = z.object({
  code: z.string().min(1, "Box code is required"),
  name: z.string().min(1, "Box name is required"),
});

type BoxFormData = z.infer<typeof boxSchema>;

interface BoxDialogProps {
  boxId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "profile";
  onBoxUpdate?: () => void;
}

export function BoxDialog({
  boxId,
  open,
  onOpenChange,
  initialTab = "detail",
  onBoxUpdate,
}: BoxDialogProps) {
  const [box, setBox] = useState<Box | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);

  // Box form
  const boxForm = useForm<BoxFormData>({
    resolver: zodResolver(boxSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  // Fetch box details
  const fetchBoxDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await boxApi.getBoxById(id);
        const boxData = response.data;
        setBox(boxData);
        // Update box form with data
        boxForm.reset({
          code: boxData.code,
          name: boxData.name,
        });
      } catch (error) {
        console.error("Error fetching box details:", error);
        toast.error("Failed to fetch box details.", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [boxForm]
  );

  // Update box
  const updateBox = async (data: BoxFormData) => {
    if (!boxId) return;

    try {
      setUpdating(true);
      const response = await boxApi.updateBox(boxId, {
        code: data.code,
        name: data.name,
      });

      toast.success("Box updated successfully");
      // Update local box state with the returned data
      setBox(response.data);
      // Also update the form with the new data
      boxForm.reset({
        code: response.data.code,
        name: response.data.name,
      });
      onBoxUpdate?.();
    } catch (error) {
      console.error("Error updating box:", error);
      toast.error("Failed to update box", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && boxId) {
      fetchBoxDetail(boxId);
      setActiveTab(initialTab);
    } else {
      setBox(null);
      boxForm.reset({
        code: "",
        name: "",
      });
    }
  }, [open, boxId, initialTab, fetchBoxDetail, boxForm]);

  // Update form when box data changes
  useEffect(() => {
    if (box) {
      boxForm.reset({
        code: box.code,
        name: box.name,
      });
    }
  }, [box, boxForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <Package className="h-5 w-5" />
            {loading ? "Loading..." : box ? `${box.name}` : "Box Details"}
          </DialogTitle>
          <DialogDescription>
            {box
              ? `Manage box details for ${box.code}`
              : "View and manage box information"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading box details...
          </div>
        ) : box ? (
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
                Edit Box
              </TabsTrigger>
            </TabsList>

            <div>
              <TabsContents className="flex-1 overflow-y-auto">
                {/* Box Details Tab */}
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
                              <TableCell className="w-1/4">Box ID</TableCell>
                              <TableCell className="font-mono">
                                {box.id}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Code</TableCell>
                              <TableCell className="font-mono">
                                {box.code}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Name</TableCell>
                              <TableCell className="text-wrap">
                                {box.name}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Box Tab */}
                <TabsContent value="profile">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <PackageOpen className="h-5 w-5" />
                        Edit Box Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...boxForm}>
                        <form
                          onSubmit={boxForm.handleSubmit(updateBox)}
                          className="space-y-6"
                        >
                          <FormField
                            control={boxForm.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Box Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter box code"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={boxForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Box Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter box name"
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
                              Update Product
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
            No box selected or box not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

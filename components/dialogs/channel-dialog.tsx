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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { channelApi } from "@/lib/api/channelApi";
import { Channel } from "@/types/channel";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Form schemas
const channelSchema = z.object({
  code: z.string().min(1, "Channel code is required"),
  name: z.string().min(1, "Channel name is required"),
});

type ChannelFormData = z.infer<typeof channelSchema>;

interface ChannelDialogProps {
  channelId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "profile";
  onChannelUpdate?: () => void;
}

export function ChannelDialog({
  channelId,
  open,
  onOpenChange,
  initialTab = "detail",
  onChannelUpdate,
}: ChannelDialogProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);

  // Channel form
  const channelForm = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  // Fetch channel details
  const fetchChannelDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await channelApi.getChannelById(id);
        const channelData = response.data;
        setChannel(channelData);
        // Update channel form with data
        channelForm.reset({
          code: channelData.code,
          name: channelData.name,
        });
      } catch (error) {
        console.error("Error fetching channel details:", error);
        toast.error("Failed to fetch channel details.", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [channelForm]
  );

  // Update channel
  const updateChannel = async (data: ChannelFormData) => {
    if (!channelId) return;

    try {
      setUpdating(true);
      const response = await channelApi.updateChannel(channelId, {
        code: data.code,
        name: data.name,
      });

      toast.success("Channel updated successfully");
      // Update local channel state with the returned data
      setChannel(response.data);
      // Also update the form with the new data
      channelForm.reset({
        code: response.data.code,
        name: response.data.name,
      });
      onChannelUpdate?.();
    } catch (error) {
      console.error("Error updating channel:", error);
      toast.error("Failed to update channel", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && channelId) {
      fetchChannelDetail(channelId);
      setActiveTab(initialTab);
    } else {
      setChannel(null);
      channelForm.reset({
        code: "",
        name: "",
      });
    }
  }, [open, channelId, initialTab, fetchChannelDetail, channelForm]);

  // Update form when channel data changes
  useEffect(() => {
    if (channel) {
      channelForm.reset({
        code: channel.code,
        name: channel.name,
      });
    }
  }, [channel, channelForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <Package className="h-5 w-5" />
            {loading
              ? "Loading..."
              : channel
              ? `${channel.name}`
              : "Channel Details"}
          </DialogTitle>
          <DialogDescription>
            {channel
              ? `Manage channel details for ${channel.code}`
              : "View and manage channel information"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading channel details...
          </div>
        ) : channel ? (
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
                Edit Channel
              </TabsTrigger>
            </TabsList>

            <div>
              <TabsContents className="flex-1 overflow-y-auto">
                {/* Channel Details Tab */}
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
                                Channel ID
                              </TableCell>
                              <TableCell className="font-mono">
                                {channel.id}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Code</TableCell>
                              <TableCell className="font-mono">
                                {channel.code}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Name</TableCell>
                              <TableCell className="text-wrap">
                                {channel.name}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Channel Tab */}
                <TabsContent value="profile">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 truncate">
                        <Settings className="h-5 w-5" />
                        Edit Channel Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...channelForm}>
                        <form
                          onSubmit={channelForm.handleSubmit(updateChannel)}
                          className="space-y-6"
                        >
                          <FormField
                            control={channelForm.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Channel Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter channel code"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={channelForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Channel Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter channel name"
                                    {...field}
                                  />
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
            No channel selected or channel not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

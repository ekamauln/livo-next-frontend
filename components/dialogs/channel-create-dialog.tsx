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
import { Loader2, Tv } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Channel } from "@/types/channel";
import { channelApi } from "@/lib/api/channelApi";
import { Separator } from "@/components/ui/separator";

// Zod form schema
const channelCreateSchema = z.object({
  code: z.string().min(1, "Channel code is required"),
  name: z.string().min(1, "Channel name is required"),
});

type ChannelCreateFormData = z.infer<typeof channelCreateSchema>;

interface ChannelCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated: (channel: Channel) => void;
}

export function ChannelCreateDialog({
  isOpen,
  onOpenChange,
  onChannelCreated,
}: ChannelCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create channel form
  const channelCreateForm = useForm<ChannelCreateFormData>({
    resolver: zodResolver(channelCreateSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ChannelCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await channelApi.createChannel(data);
      const channel = response.data as Channel;
      onChannelCreated(channel);
      toast.success("Channel created successfully");
      channelCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create channel. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" /> Create New Channel
          </DialogTitle>
          <DialogDescription>
            Create a new channel by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...channelCreateForm}>
            <form
              onSubmit={channelCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={channelCreateForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter channel code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={channelCreateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter channel name" {...field} />
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
                    <Tv className="mr-2 h-4 w-4" />
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

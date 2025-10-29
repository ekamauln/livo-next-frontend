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
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Loader2, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Return as ReturnData } from "@/types/return";
import { Channel } from "@/types/channel";
import { Store } from "@/types/store";
import { channelApi } from "@/lib/api/channelApi";
import { storeApi } from "@/lib/api/storeApi";
import { returnApi } from "@/lib/api/returnApi";
import { Separator } from "@/components/ui/separator";

// Zod form schema
const returnCreateSchema = z.object({
  new_tracking: z.string().min(1, "New tracking is required"),
  channel_id: z.number().min(1, "Channel is required"),
  store_id: z.number().min(1, "Store is required"),
});

type ReturnCreateFormData = z.infer<typeof returnCreateSchema>;

interface ReturnCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReturnCreated: (returnData: ReturnData) => void;
}

export function ReturnCreateDialog({
  isOpen,
  onOpenChange,
  onReturnCreated,
}: ReturnCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [channelSearchOpen, setChannelSearchOpen] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [storeSearchOpen, setStoreSearchOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  // Create return base form
  const returnBaseCreateForm = useForm<ReturnCreateFormData>({
    resolver: zodResolver(returnCreateSchema),
    defaultValues: {
      new_tracking: "",
      channel_id: 0,
      store_id: 0,
    },
  });

  // Fetch available channels and stores
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [responseChannels, responseStores] = await Promise.all([
        channelApi.getChannels(1, 100),
        storeApi.getStores(1, 100),
      ]);
      const channelsData = responseChannels.data.channels as Channel[];
      const storesData = responseStores.data.stores as Store[];
      setChannels(channelsData);
      setStores(storesData);
    } catch {
      toast.error("Failed to load channels and stores");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Get selected channel display text
  const getSelectedChannelText = (channel_id: number) => {
    if (!channel_id || channel_id === 0) return "Select channel...";
    const channel = channels.find((ch) => ch.id === channel_id);
    return channel ? `${channel.name}` : "Select channel...";
  };

  // Get selected store display text
  const getSelectedStoreText = (store_id: number) => {
    if (!store_id || store_id === 0) return "Select store...";
    const store = stores.find((st) => st.id === store_id);
    return store ? `${store.name}` : "Select store...";
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setChannels([]);
      setStores([]);
      returnBaseCreateForm.reset({
        new_tracking: "",
        channel_id: 0,
        store_id: 0,
      });
    }
  }, [isOpen, fetchData, returnBaseCreateForm]);

  // Handle form submission
  const onSubmit = async (data: ReturnCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await returnApi.createBaseReturn(data);
      if (response.success && response.data) {
        toast.success("Return created successfully");
        onReturnCreated(response.data);
        returnBaseCreateForm.reset();
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to create return. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Create New Base Return
          </DialogTitle>
          <DialogDescription>
            Create a new base return by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...returnBaseCreateForm}>
            <form
              onSubmit={returnBaseCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={returnBaseCreateForm.control}
                name="new_tracking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tracking number (e.g., JNE1234567890)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={returnBaseCreateForm.control}
                name="channel_id"
                render={({ field: channelField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Channel</FormLabel>
                    <FormControl>
                      <Popover
                        open={channelSearchOpen}
                        onOpenChange={setChannelSearchOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={channelSearchOpen}
                            className="w-full justify-between"
                            disabled={
                              returnBaseCreateForm.formState.isSubmitting ||
                              isLoadingData
                            }
                          >
                            {getSelectedChannelText(channelField.value)}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by channel name..."
                              value={channelSearch}
                              onValueChange={setChannelSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {isLoadingData
                                  ? "Loading channels..."
                                  : channelSearch
                                  ? `No channels found for "${channelSearch}"`
                                  : "No channels found."}
                              </CommandEmpty>
                              <CommandGroup>
                                {channels
                                  .filter((channel) => {
                                    const searchTerm =
                                      channelSearch.toLowerCase();
                                    if (!searchTerm) return true;
                                    return channel.name
                                      .toLowerCase()
                                      .includes(searchTerm);
                                  })
                                  .slice(0, 50)
                                  .map((channel) => (
                                    <CommandItem
                                      key={channel.id}
                                      value={channel.id.toString()}
                                      onSelect={() => {
                                        channelField.onChange(channel.id);
                                        setChannelSearchOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          channelField.value === channel.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {channel.name}
                                    </CommandItem>
                                  ))}
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
                control={returnBaseCreateForm.control}
                name="store_id"
                render={({ field: storeField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Store</FormLabel>
                    <FormControl>
                      <Popover
                        open={storeSearchOpen}
                        onOpenChange={setStoreSearchOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={storeSearchOpen}
                            className="w-full justify-between"
                            disabled={
                              returnBaseCreateForm.formState.isSubmitting ||
                              isLoadingData
                            }
                          >
                            {getSelectedStoreText(storeField.value)}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by store name..."
                              value={storeSearch}
                              onValueChange={setStoreSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {isLoadingData
                                  ? "Loading stores..."
                                  : storeSearch
                                  ? `No stores found for "${storeSearch}"`
                                  : "No stores found."}
                              </CommandEmpty>
                              <CommandGroup>
                                {stores
                                  .filter((store) => {
                                    const searchTerm =
                                      storeSearch.toLowerCase();
                                    if (!searchTerm) return true;
                                    return store.name
                                      .toLowerCase()
                                      .includes(searchTerm);
                                  })
                                  .slice(0, 50)
                                  .map((store) => (
                                    <CommandItem
                                      key={store.id}
                                      value={store.id.toString()}
                                      onSelect={() => {
                                        storeField.onChange(store.id);
                                        setStoreSearchOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          storeField.value === store.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {store.name}
                                    </CommandItem>
                                  ))}
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
                    <Package className="mr-2 h-4 w-4" />
                  )}
                  Create Return
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

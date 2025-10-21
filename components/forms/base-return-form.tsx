"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { returnApi } from "@/lib/api/returnApi";
import { channelApi } from "@/lib/api/channelApi";
import { storeApi } from "@/lib/api/storeApi";
import { ApiError } from "@/lib/api/types";
import { Channel } from "@/types/channel";
import { Store } from "@/types/store";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  new_tracking: z
    .string()
    .min(1, { message: "Tracking number is required" })
    .trim(),
  channelID: z.string().min(1, { message: "Channel is required" }).trim(),
  storeID: z.string().min(1, { message: "Store is required" }).trim(),
});

type FormData = z.infer<typeof formSchema>;

interface BaseReturnFormProps {
  onBaseReturnCreated?: () => void;
}

export function BaseReturnForm({ onBaseReturnCreated }: BaseReturnFormProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [channelSearchOpen, setChannelSearchOpen] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [storeSearchOpen, setStoreSearchOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const newTrackingInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      new_tracking: "",
      channelID: "",
      storeID: "",
    },
  });

  // Fetch channels data on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoadingChannels(true);
        const response = await channelApi.getChannels(1, 100); // Get more channels for better search coverage
        if (response.success && response.data.channels) {
          const channelData = response.data.channels as Channel[];
          setChannels(channelData);
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
        toast.error("Failed to load channels");
      } finally {
        setIsLoadingChannels(false);
      }
    };

    fetchChannels();
  }, []);

  // Get selected channel display text
  const getSelectedChannelText = (channelID: string) => {
    if (!channelID) return "Select channel";
    const channel = channels.find((ch) => ch.id.toString() === channelID);
    return channel ? `${channel.name}` : "Select channel...";
  };

  // Fetch stores data on component mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoadingStores(true);
        const response = await storeApi.getStores(1, 100); // Get more stores for better search coverage
        if (response.success && response.data.stores) {
          const storeData = response.data.stores as Store[];
          setStores(storeData);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to load stores");
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  // Get selected store display text
  const getSelectedStoreText = (storeID: string) => {
    if (!storeID) return "Select store...";
    const store = stores.find((st) => st.id.toString() === storeID);
    return store ? `${store.name}` : "Select store...";
  };

  // Helper function to focus the new tracking input
  const focusNewTrackingInput = useCallback(() => {
    if (newTrackingInputRef.current) {
      newTrackingInputRef.current.focus();
    }
  }, []);

  // Focus on input when component mounts (page load)
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      focusNewTrackingInput();
    }, 100);

    return () => clearTimeout(timer);
  }, [focusNewTrackingInput]);

  const onSubmit = async (data: FormData) => {
    try {
      // Prepare the request data
      const requestData = {
        new_tracking: data.new_tracking,
        channel_id: Number(data.channelID),
        store_id: Number(data.storeID),
      };

      const response = await returnApi.createBaseReturn(requestData);

      // Check if response is exists and has expected structure
      if (response && response.success) {
        toast.success("Base return created successfully");
        form.reset();
        setChannelSearchOpen(false); // Reset search states
        setChannelSearch("");
        setStoreSearchOpen(false); // Reset search states
        setStoreSearch("");
        onBaseReturnCreated?.();
        // Focus back to input for next entry
        setTimeout(() => {
          focusNewTrackingInput();
        }, 100);
      } else {
        // Handle cases where success is false or response is malformed
        const errorMsg = response?.message || "Failed to create base return";
        throw new Error(errorMsg);
      }
    } catch (error) {
      // Only log unexpected errors to console to reduce noise
      if (error instanceof ApiError) {
        // For expected API errors, log at debug level
        if (
          error.status === 404 &&
          error.message.toLowerCase().includes("order not found")
        ) {
          console.debug(
            "Order not found for tracking number:",
            data.new_tracking
          );
        } else if (error.status >= 400 && error.status < 500) {
          console.debug(
            "Client error:",
            error.message,
            "Status:",
            error.status
          );
        } else {
          console.error("Unexpected API error:", error);
        }
      } else {
        console.error("Error creating base return:", error);
      }

      let errorMessage = "Unknown error occurred";
      let toastDescription = "Please try again.";

      if (error instanceof ApiError) {
        errorMessage = error.message;
        // Provide more specific descriptions based on status code and message
        if (error.status === 400) {
          toastDescription = "Please check your input and try again.";
        } else if (error.status === 401) {
          toastDescription = "Your session has expired. Please login again";
        } else if (error.status === 404) {
          if (error.message.toLowerCase().includes("order not found")) {
            errorMessage =
              "This tracking number is not associated with any order";
            toastDescription = "Please check the tracking number and try again";
          } else {
            toastDescription = "Resource not found. Please try again";
          }
        } else if (error.status === 422) {
          toastDescription = "The tracking number format is invalid";
        } else if (error.status >= 500) {
          toastDescription = "Server error. Please try again later";
        } else if (error.status === 0) {
          toastDescription = "Network error. Please check your connection";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Set form error using React Hook Form
      form.setError("new_tracking", { message: errorMessage });
      // clear input and focus back after API error
      form.reset();
      setChannelSearchOpen(false); // Reset search states
      setChannelSearch("");
      setStoreSearchOpen(false); // Reset search states
      setStoreSearch("");
      toast.error("Failed to create base return", {
        description: toastDescription,
      });
      setTimeout(() => {
        focusNewTrackingInput();
      }, 100);
    }
  };

  return (
    <Form {...form}>
      <FocusScope trapped={true}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="new_tracking"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking Number</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter tracking number (e.g., JNE1234567890)"
                    disabled={form.formState.isSubmitting}
                    {...field}
                    ref={(e) => {
                      field.ref(e);
                      newTrackingInputRef.current = e;
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="channelID"
            render={({ field: channelField }) => (
              <FormItem>
                <FormLabel className="text-xs">Channel</FormLabel>
                <FormControl>
                  <Popover
                    open={channelSearchOpen}
                    onOpenChange={setChannelSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <RippleButton
                        size="sm"
                        variant="outline"
                        role="combobox"
                        aria-expanded={channelSearchOpen}
                        className="w-full justify-between"
                        disabled={
                          form.formState.isSubmitting || isLoadingChannels
                        }
                      >
                        {getSelectedChannelText(channelField.value)}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </RippleButton>
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
                            {isLoadingChannels
                              ? "Loading channels..."
                              : channelSearch
                              ? `No channels found for "${channelSearch}"`
                              : "No channels found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {channels
                              .filter((channel) => {
                                const searchTerm = channelSearch.toLowerCase();
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
                                    channelField.onChange(
                                      channel.id.toString()
                                    );
                                    setChannelSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      channelField.value ===
                                        channel.id.toString()
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
            control={form.control}
            name="storeID"
            render={({ field: storeField }) => (
              <FormItem>
                <FormLabel className="text-xs">Store</FormLabel>
                <FormControl>
                  <Popover
                    open={storeSearchOpen}
                    onOpenChange={setStoreSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <RippleButton
                        size="sm"
                        variant="outline"
                        role="combobox"
                        aria-expanded={storeSearchOpen}
                        className="w-full justify-between"
                        disabled={
                          form.formState.isSubmitting || isLoadingStores
                        }
                      >
                        {getSelectedStoreText(storeField.value)}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </RippleButton>
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
                            {isLoadingStores
                              ? "Loading stores..."
                              : storeSearch
                              ? `No stores found for "${storeSearch}"`
                              : "No stores found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {stores
                              .filter((store) => {
                                const searchTerm = storeSearch.toLowerCase();
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
                                    storeField.onChange(store.id.toString());
                                    setStoreSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      storeField.value === store.id.toString()
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

          <RippleButton
            size="sm"
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              !form.watch("new_tracking").trim() ||
              !form.watch("channelID") ||
              !form.watch("storeID")
            }
            className="w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Base Return
          </RippleButton>
        </form>
      </FocusScope>
    </Form>
  );
}

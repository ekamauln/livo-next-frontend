"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { playSoundQcOnline } from "@/lib/sounds/qc-online-sound";
import { qcOnlineApi } from "@/lib/api/qcOnlineApi";
import { boxApi } from "@/lib/api/boxApi";
import { ApiError } from "@/lib/api/types";
import { Box } from "@/types/box";
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
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  tracking: z
    .string()
    .min(1, { message: "Tracking number is required" })
    .trim(),
  boxDetails: z
    .array(
      z.object({
        box_id: z.string().min(1, { message: "Box selection is required" }),
        quantity: z.string().min(1, { message: "Quantity is required" }),
      })
    )
    .min(1, { message: "At least one box is required" }),
});

type FormData = z.infer<typeof formSchema>;

interface QcOnlineFormProps {
  onQcOnlineCreated?: () => void;
}

export function QcOnlineForm({ onQcOnlineCreated }: QcOnlineFormProps) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [boxSearchOpen, setBoxSearchOpen] = useState<boolean[]>([]);
  const [boxSearch, setBoxSearch] = useState<string[]>([]);
  const trackingInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tracking: "",
      boxDetails: [{ box_id: "", quantity: "1" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "boxDetails",
  });

  // Box details management functions using useFieldArray
  const addBoxDetail = () => {
    append({ box_id: "", quantity: "1" });
    setBoxSearchOpen([...boxSearchOpen, false]);
    setBoxSearch([...boxSearch, ""]);
  };

  const removeBoxDetail = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      setBoxSearchOpen(boxSearchOpen.filter((_, i) => i !== index));
      setBoxSearch(boxSearch.filter((_, i) => i !== index));
    }
  };

  // Box search helper functions
  const setBoxSearchOpenAtIndex = (index: number, open: boolean) => {
    const updated = [...boxSearchOpen];
    updated[index] = open;
    setBoxSearchOpen(updated);
  };

  const setBoxSearchAtIndex = (index: number, search: string) => {
    const updated = [...boxSearch];
    updated[index] = search;
    setBoxSearch(updated);
  };

  // Fetch boxes data on component mount
  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        setIsLoadingBoxes(true);
        const response = await boxApi.getBoxes(1, 50); // Get more boxes for better search coverage
        if (response.success && response.data.boxes) {
          const boxesData = response.data.boxes as Box[];
          setBoxes(boxesData);
        }
      } catch (error) {
        console.error("Error fetching boxes:", error);
        toast.error("Failed to load boxes");
      } finally {
        setIsLoadingBoxes(false);
      }
    };

    fetchBoxes();
  }, []);

  // Get selected box display text
  const getSelectedBoxText = (boxId: string) => {
    if (!boxId) return "Select box...";
    const box = boxes.find((b) => b.id.toString() === boxId);
    return box ? `${box.code} (${box.name})` : "Select box...";
  };

  // Check if selected box is PC (Packing) type
  const isPackingBox = useCallback(
    (boxId: string) => {
      if (!boxId) return false;
      const box = boxes.find((b) => b.id.toString() === boxId);
      return box
        ? box.code === "PC" || box.name.toLowerCase().includes("packing")
        : false;
    },
    [boxes]
  );

  // Check if any box in current form is a packing box
  const hasPackingBox = useCallback(() => {
    const currentBoxDetails = form.watch("boxDetails");
    return currentBoxDetails.some((detail) => isPackingBox(detail.box_id));
  }, [form, isPackingBox]);

  // Helper function to focus the tracking input
  const focusTrackingInput = useCallback(() => {
    if (trackingInputRef.current) {
      trackingInputRef.current.focus();
    }
  }, []);

  // Focus on input when component mounts (page load)
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      focusTrackingInput();
    }, 100);

    return () => clearTimeout(timer);
  }, [focusTrackingInput]);

  // Initialize search state arrays when box details change
  useEffect(() => {
    if (boxSearchOpen.length !== fields.length) {
      setBoxSearchOpen(Array(fields.length).fill(false));
    }
    if (boxSearch.length !== fields.length) {
      setBoxSearch(Array(fields.length).fill(""));
    }
  }, [fields.length, boxSearchOpen.length, boxSearch.length]);

  // Auto-set quantity to 1 for packing boxes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && name.includes("box_id")) {
        const match = name.match(/boxDetails\.(\d+)\.box_id/);
        if (match) {
          const index = parseInt(match[1]);
          const boxId = value.boxDetails?.[index]?.box_id;
          if (boxId && isPackingBox(boxId)) {
            form.setValue(`boxDetails.${index}.quantity`, "1");
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isPackingBox]);

  const onSubmit = async (data: FormData) => {
    try {
      // Validate box details
      const validBoxDetails = data.boxDetails.filter(
        (detail) =>
          detail.box_id && detail.quantity && parseInt(detail.quantity) > 0
      );

      if (validBoxDetails.length === 0) {
        form.setError("boxDetails", {
          message: "At least one box with valid quantity is required",
        });
        return;
      }

      // Prepare the request data
      const requestData = {
        tracking: data.tracking,
        details: validBoxDetails.map((detail) => ({
          box_id: parseInt(detail.box_id),
          quantity: parseInt(detail.quantity),
        })),
      };

      const response = await qcOnlineApi.createQcOnline(requestData);

      // Check if response exists and has expected structure
      if (response && response.success) {
        playSoundQcOnline("success");
        toast.success("QC-Online created successfully!");
        form.reset();
        setBoxSearchOpen([false]); // Reset search states
        setBoxSearch([""]);
        onQcOnlineCreated?.();
        // Focus back to input for next entry
        setTimeout(() => {
          focusTrackingInput();
        }, 100);
      } else {
        playSoundQcOnline("error");
        // Handle cases where success is false or response is malformed
        const errorMsg = response?.message || "Failed to create QC-Online";
        throw new Error(errorMsg);
      }
    } catch (error) {
      playSoundQcOnline("error");
      // Only log unexpected errors to console to reduce noise
      if (error instanceof ApiError) {
        // For expected API errors, log at debug level
        if (
          error.status === 404 &&
          error.message.toLowerCase().includes("order not found")
        ) {
          console.debug("Order not found for tracking number:", data.tracking);
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
        console.error("Error creating QC-Online:", error);
      }

      let errorMessage = "Unknown error occurred";
      let toastDescription = "Please try again";

      if (error instanceof ApiError) {
        errorMessage = error.message;
        // Provide more specific descriptions based on status code and message
        if (error.status === 400) {
          toastDescription = "Please check your input and try again";
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
      form.setError("tracking", { message: errorMessage });
      // Clear input and focus back after API error
      form.reset();
      setBoxSearchOpen([false]); // Reset search states
      setBoxSearch([""]);
      toast.error("Failed to create QC-Online", {
        description: toastDescription,
      });
      setTimeout(() => {
        focusTrackingInput();
      }, 100);
    }
  };

  return (
    <Form {...form}>
      <FocusScope trapped={true}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="tracking"
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
                      trackingInputRef.current = e;
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <div className="w-full">
              <FormLabel className="flex items-center gap-2">
                <Separator className="mt-1" />
              </FormLabel>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name={`boxDetails.${index}.box_id`}
                    render={({ field: boxField }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Box</FormLabel>
                        <FormControl>
                          <Popover
                            open={boxSearchOpen[index] || false}
                            onOpenChange={(open) =>
                              setBoxSearchOpenAtIndex(index, open)
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={boxSearchOpen[index] || false}
                                className="w-full justify-between"
                                disabled={
                                  form.formState.isSubmitting || isLoadingBoxes
                                }
                              >
                                {getSelectedBoxText(boxField.value)}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Search by box code or name..."
                                  value={boxSearch[index] || ""}
                                  onValueChange={(search) =>
                                    setBoxSearchAtIndex(index, search)
                                  }
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {isLoadingBoxes
                                      ? "Loading boxes..."
                                      : boxSearch[index]
                                      ? `No boxes found for "${boxSearch[index]}"`
                                      : "No boxes found."}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {/* Frontend filtering for both code and name since backend search only supports box code */}
                                    {(() => {
                                      const filteredBoxes = boxes.filter(
                                        (box) => {
                                          const searchTerm = (
                                            boxSearch[index] || ""
                                          ).toLowerCase();
                                          if (!searchTerm) return true; // Show all when no search

                                          const codeMatch = String(box.code)
                                            .toLowerCase()
                                            .includes(searchTerm);
                                          const shouldShow = codeMatch;

                                          return shouldShow;
                                        }
                                      );

                                      return filteredBoxes
                                        .slice(0, 50) // Limit to 50 results for performance
                                        .map((box) => {
                                          return (
                                            <CommandItem
                                              key={box.id}
                                              value={box.id.toString()}
                                              onSelect={() => {
                                                boxField.onChange(
                                                  box.id.toString()
                                                );
                                                setBoxSearchOpenAtIndex(
                                                  index,
                                                  false
                                                );
                                                setBoxSearchAtIndex(index, "");
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  boxField.value ===
                                                    box.id.toString()
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {box.code} ({box.name})
                                            </CommandItem>
                                          );
                                        });
                                    })()}
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
                </div>
                <div className="w-24">
                  <FormField
                    control={form.control}
                    name={`boxDetails.${index}.quantity`}
                    render={({ field: quantityField }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Qty</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            disabled={
                              form.formState.isSubmitting ||
                              isPackingBox(
                                form.watch(`boxDetails.${index}.box_id`)
                              )
                            }
                            {...quantityField}
                            value={
                              isPackingBox(
                                form.watch(`boxDetails.${index}.box_id`)
                              )
                                ? "1"
                                : quantityField.value
                            }
                            onChange={(e) => {
                              // Prevent changing quantity for packing boxes
                              if (
                                !isPackingBox(
                                  form.watch(`boxDetails.${index}.box_id`)
                                )
                              ) {
                                quantityField.onChange(e);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-1">
                  {index === fields.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addBoxDetail}
                      disabled={form.formState.isSubmitting || hasPackingBox()}
                      className="px-2"
                      title={
                        hasPackingBox()
                          ? "Cannot add more boxes when a packing box is selected"
                          : "Add another box"
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeBoxDetail(index)}
                      disabled={form.formState.isSubmitting}
                      className="px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              !form.watch("tracking").trim() ||
              form.watch("boxDetails").every((d) => !d.box_id || !d.quantity)
            }
            className="w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create QC-Online
          </Button>
        </form>
      </FocusScope>
    </Form>
  );
}

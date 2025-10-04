"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { qcRibbonApi } from "@/lib/api/qcRibbonApi";
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

interface QcRibbonFormProps {
  onQcRibbonCreated?: () => void;
}

export function QcRibbonForm({ onQcRibbonCreated }: QcRibbonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState("");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [boxDetails, setBoxDetails] = useState<
    Array<{ box_id: string; quantity: string }>
  >([{ box_id: "", quantity: "1" }]);
  const [boxSearchOpen, setBoxSearchOpen] = useState<boolean[]>([]);
  const [boxSearch, setBoxSearch] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const trackingInputRef = useRef<HTMLInputElement>(null);

  // Box details management functions
  const addBoxDetail = () => {
    const newBoxDetails = [...boxDetails, { box_id: "", quantity: "1" }];
    const newBoxSearchOpen = [...boxSearchOpen, false];
    const newBoxSearch = [...boxSearch, ""];
    setBoxDetails(newBoxDetails);
    setBoxSearchOpen(newBoxSearchOpen);
    setBoxSearch(newBoxSearch);
  };

  const removeBoxDetail = (index: number) => {
    if (boxDetails.length > 1) {
      setBoxDetails(boxDetails.filter((_, i) => i !== index));
      setBoxSearchOpen(boxSearchOpen.filter((_, i) => i !== index));
      setBoxSearch(boxSearch.filter((_, i) => i !== index));
    }
  };

  const updateBoxDetail = (
    index: number,
    field: "box_id" | "quantity",
    value: string
  ) => {
    const updated = [...boxDetails];
    updated[index] = { ...updated[index], [field]: value };
    setBoxDetails(updated);
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

  // Get selected box display text
  const getSelectedBoxText = (boxId: string) => {
    if (!boxId) return "Select box...";
    const box = boxes.find((b) => b.id.toString() === boxId);
    return box ? `${box.code} (${box.name})` : "Select box...";
  };

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

  // Fetch boxes data on component mount
  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        setIsLoadingBoxes(true);
        const response = await boxApi.getBoxes(1, 500); // Get more boxes for better search coverage
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

  // Initialize search state arrays when box details change
  useEffect(() => {
    if (boxSearchOpen.length !== boxDetails.length) {
      setBoxSearchOpen(Array(boxDetails.length).fill(false));
    }
    if (boxSearch.length !== boxDetails.length) {
      setBoxSearch(Array(boxDetails.length).fill(""));
    }
  }, [boxDetails.length, boxSearchOpen.length, boxSearch.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!tracking.trim()) {
      setError("Tracking number is required");
      // Clear input and focus back after validation error
      setTracking("");
      setTimeout(() => {
        focusTrackingInput();
      }, 100);
      return;
    }

    // Validate box details
    const validBoxDetails = boxDetails.filter(
      (detail) =>
        detail.box_id && detail.quantity && parseInt(detail.quantity) > 0
    );

    if (validBoxDetails.length === 0) {
      setError("At least one box with valid quantity is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Prepare the request data
      const requestData = {
        tracking: tracking.trim(),
        details: validBoxDetails.map((detail) => ({
          box_id: parseInt(detail.box_id),
          quantity: parseInt(detail.quantity),
        })),
      };

      const response = await qcRibbonApi.createQcRibbon(requestData);

      // Check if response exists and has expected structure
      if (response && response.success) {
        toast.success("QC-Ribbon created successfully!");
        setTracking("");
        setBoxDetails([{ box_id: "", quantity: "1" }]); // Reset box details
        setBoxSearchOpen([false]); // Reset search states
        setBoxSearch([""]);
        onQcRibbonCreated?.();
        // Focus back to input for next entry
        setTimeout(() => {
          focusTrackingInput();
        }, 100);
      } else {
        // Handle cases where success is false or response is malformed
        const errorMsg = response?.message || "Failed to create QC-Ribbon";
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
            tracking.trim()
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
        console.error("Error creating QC-Ribbon:", error);
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

      setError(errorMessage);
      // Clear input and box details, then focus back after API error
      setTracking("");
      setBoxDetails([{ box_id: "", quantity: "1" }]);
      setBoxSearchOpen([false]); // Reset search states
      setBoxSearch([""]);
      toast.error("Failed to create QC-Ribbon", {
        description: toastDescription,
      });
      setTimeout(() => {
        focusTrackingInput();
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tracking">Tracking Number</Label>
        <Input
          ref={trackingInputRef}
          id="tracking"
          type="text"
          placeholder="Enter tracking number (e.g., JNE1234567890)"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-3">
        <Label>Box Details</Label>
        {boxDetails.map((detail, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor={`box-${index}`} className="text-xs">
                Box
              </Label>
              <Popover
                open={boxSearchOpen[index] || false}
                onOpenChange={(open) => setBoxSearchOpenAtIndex(index, open)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={boxSearchOpen[index] || false}
                    className="w-full justify-between"
                    disabled={isSubmitting || isLoadingBoxes}
                  >
                    {getSelectedBoxText(detail.box_id)}
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
                          const filteredBoxes = boxes.filter((box) => {
                            const searchTerm = (
                              boxSearch[index] || ""
                            ).toLowerCase();
                            if (!searchTerm) return true; // Show all when no search

                            const codeMatch = String(box.code)
                              .toLowerCase()
                              .includes(searchTerm);
                            // const nameMatch = String(box.name)
                            //   .toLowerCase()
                            //   .includes(searchTerm);
                            const shouldShow = codeMatch;
                            // || nameMatch;

                            return shouldShow;
                          });

                          return filteredBoxes
                            .slice(0, 50) // Limit to 50 results for performance
                            .map((box) => {
                              return (
                                <CommandItem
                                  key={box.id}
                                  value={box.id.toString()}
                                  onSelect={() => {
                                    updateBoxDetail(
                                      index,
                                      "box_id",
                                      box.id.toString()
                                    );
                                    setBoxSearchOpenAtIndex(index, false);
                                    setBoxSearchAtIndex(index, "");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      detail.box_id === box.id.toString()
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
            </div>
            <div className="w-24">
              <Label htmlFor={`quantity-${index}`} className="text-xs">
                Qty
              </Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                min="1"
                placeholder="1"
                value={detail.quantity}
                onChange={(e) =>
                  updateBoxDetail(index, "quantity", e.target.value)
                }
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-1">
              {index === boxDetails.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBoxDetail}
                  disabled={isSubmitting}
                  className="px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {boxDetails.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBoxDetail(index)}
                  disabled={isSubmitting}
                  className="px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={
          isSubmitting ||
          !tracking.trim() ||
          boxDetails.every((d) => !d.box_id || !d.quantity)
        }
        className="w-full"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create QC-Ribbon
      </Button>
    </form>
  );
}

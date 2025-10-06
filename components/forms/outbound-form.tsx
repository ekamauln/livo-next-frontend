"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Loader2 } from "lucide-react";
import { outboundApi } from "@/lib/api/outboundApi";
import { ApiError } from "@/lib/api/types";
import { CreateOutboundRequest } from "@/types/outbound";
import { OutboundCreateDialog } from "@/components/dialogs/outbound-create-dialog";

const formSchema = z.object({
  tracking: z
    .string()
    .min(1, { message: "Tracking number is required" })
    .trim(),
});

type FormData = z.infer<typeof formSchema>;

interface OutboundFormProps {
  onOutboundCreated?: () => void;
}

export function OutboundForm({ onOutboundCreated }: OutboundFormProps) {
  const trackingInputRef = useRef<HTMLInputElement>(null);
  const [showExpeditionDialog, setShowExpeditionDialog] = useState(false);
  const [pendingTracking, setPendingTracking] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tracking: "",
    },
  });

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

  const onSubmit = async (data: FormData) => {
    // Check if tracking starts with TKP0
    if (data.tracking.startsWith("TKP0")) {
      // Show expedition selection dialog
      setPendingTracking(data.tracking);
      setShowExpeditionDialog(true);
      return;
    }

    // For non-TKP0 tracking, create with just tracking (backend handles expedition)
    await createOutbound({
      tracking: data.tracking,
      expedition: "", // Backend will set this
      expedition_color: "", // Backend will set this
      expedition_slug: "", // Backend will set this
    });
  };

  const handleExpeditionSelect = async (expeditionData: Omit<CreateOutboundRequest, 'tracking'>) => {
    setShowExpeditionDialog(false);
    await createOutbound({
      tracking: pendingTracking,
      ...expeditionData,
    });
    setPendingTracking("");
  };

  const createOutbound = async (outboundData: CreateOutboundRequest) => {
    try {
      const response = await outboundApi.createOutbound(outboundData);

      // Check if response exists and has expected structure
      if (response && response.success) {
        toast.success("Outbound created successfully!");
        form.reset(); // Reset form using React Hook Form
        onOutboundCreated?.();
        // Focus back to input for next entry
        setTimeout(() => {
          focusTrackingInput();
        }, 100);
      } else {
        // Handle cases where success is false or response is malformed
        const errorMsg = response?.message || "Failed to create Outbound";
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
          console.debug("Order not found for tracking number:", outboundData.tracking);
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
        console.error("Error creating Outbound:", error);
      }

      let errorMessage = "Unknown error occurred";
      let toastDescription = "Please try again";

      if (error instanceof ApiError) {
        // Use the backend error message directly
        errorMessage = error.message;
        
        // Provide more specific descriptions based on status code and message
        if (error.status === 400) {
          // For 400 errors, show the specific backend message
          if (error.message.includes("QC process required")) {
            toastDescription = "This tracking number must go through Quality Control first";
          } else if (error.message.includes("already exists")) {
            toastDescription = "This tracking number already has an outbound record";
          } else {
            toastDescription = "Please check your input and try again";
          }
        } else if (error.status === 401) {
          toastDescription = "Your session has expired. Please login again";
        } else if (error.status === 404) {
          if (error.message.toLowerCase().includes("order not found")) {
            errorMessage = "This tracking number is not associated with any order";
            toastDescription = "Please check the tracking number and try again";
          } else {
            toastDescription = "Resource not found. Please try again";
          }
        } else if (error.status === 422) {
          toastDescription = "The input data format is invalid";
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
      
      // Clear the tracking input on error
      form.setValue("tracking", "");
      
      // Show toast with backend error message and description
      toast.error(errorMessage, {
        description: toastDescription,
      });
      
      // Focus back to input after API error
      setTimeout(() => {
        focusTrackingInput();
      }, 100);
    }
  };

  return (
    <>
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

            <RippleButton
              size="sm"
              type="submit"
              disabled={
                form.formState.isSubmitting || !form.watch("tracking").trim()
              }
              className="w-full"
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Outbound
            </RippleButton>
          </form>
        </FocusScope>
      </Form>

      {/* Expedition Selection Dialog for TKP0 tracking */}
      <OutboundCreateDialog
        open={showExpeditionDialog}
        onOpenChange={setShowExpeditionDialog}
        trackingNumber={pendingTracking}
        onExpeditionSelect={handleExpeditionSelect}
      />
    </>
  );
}

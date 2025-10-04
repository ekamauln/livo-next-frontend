"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import FocusTrap from "focus-trap-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { mbRibbonApi } from "@/lib/api/mbRibbonApi";
import { ApiError } from "@/lib/api/types";

interface MbRibbonFormProps {
  onMbRibbonCreated?: () => void;
  focusTrapActive?: boolean;
  onFocusTrapActivate?: () => void;
  onFocusTrapDeactivate?: () => void;
}

export function MbRibbonForm({
  onMbRibbonCreated,
  focusTrapActive = false,
  onFocusTrapActivate,
  onFocusTrapDeactivate,
}: MbRibbonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState("");
  const [isFocusTrapped, setIsFocusTrapped] = useState(focusTrapActive);
  const formRef = useRef<HTMLFormElement>(null);
  const trackingInputRef = useRef<HTMLInputElement>(null);

  const handleFocusTrapActivate = useCallback(() => {
    setIsFocusTrapped(true);
    onFocusTrapActivate?.();
  }, [onFocusTrapActivate]);

  const handleFocusTrapDeactivate = useCallback(() => {
    setIsFocusTrapped(false);
    onFocusTrapDeactivate?.();
  }, [onFocusTrapDeactivate]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + I to activate focus trap on the form
      if ((e.ctrlKey || e.metaKey) && e.key === "i" && !isFocusTrapped) {
        e.preventDefault();
        handleFocusTrapActivate();
        // Focus the input field
        focusTrackingInput();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFocusTrapped, handleFocusTrapActivate, focusTrackingInput]);

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

    try {
      setIsSubmitting(true);
      setError("");

      const response = await mbRibbonApi.createMbRibbon({
        tracking: tracking.trim(),
      });

      // Check if response exists and has expected structure
      if (response && response.success) {
        toast.success("MB-Ribbon created successfully!");
        setTracking("");
        onMbRibbonCreated?.();
        // Deactivate focus trap after successful submission
        handleFocusTrapDeactivate();
        // Focus back to input for next entry
        setTimeout(() => {
          focusTrackingInput();
        }, 100);
      } else {
        // Handle cases where success is false or response is malformed
        const errorMsg = response?.message || "Failed to create MB-Ribbon";
        throw new Error(errorMsg);
      }
    } catch (error) {
      // Only log unexpected errors to console to reduce noise
      if (error instanceof ApiError) {
        // For expected API errors, log at debug level
        if (error.status === 404 && error.message.toLowerCase().includes("order not found")) {
          console.debug("Order not found for tracking number:", tracking.trim());
        } else if (error.status >= 400 && error.status < 500) {
          console.debug("Client error:", error.message, "Status:", error.status);
        } else {
          console.error("Unexpected API error:", error);
        }
      } else {
        console.error("Error creating MB-Ribbon:", error);
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
            errorMessage = "This tracking number is not associated with any order";
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
      // Clear input and focus back after API error
      setTracking("");
      toast.error("Failed to create MB-Ribbon", {
        description: toastDescription,
      });
      setTimeout(() => {
        focusTrackingInput();
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputFocus = () => {
    if (!isFocusTrapped) {
      handleFocusTrapActivate();
    }
  };

  const handleFormBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is outside the form
    const form = formRef.current;
    if (form && !form.contains(e.relatedTarget as Node)) {
      handleFocusTrapDeactivate();
    }
  };

  return (
    <FocusTrap
      active={isFocusTrapped}
      focusTrapOptions={{
        initialFocus: "#tracking",
        allowOutsideClick: true,
        clickOutsideDeactivates: true,
        returnFocusOnDeactivate: false,
        escapeDeactivates: true,
        onDeactivate: handleFocusTrapDeactivate,
      }}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onBlur={handleFormBlur}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="tracking">Tracking Number</Label>
          <Input
            ref={trackingInputRef}
            id="tracking"
            type="text"
            placeholder="Enter tracking number (e.g., JNE1234567890)"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            onFocus={handleInputFocus}
            disabled={isSubmitting}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !tracking.trim()}
          className="w-full"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create MB-Ribbon
        </Button>
      </form>
    </FocusTrap>
  );
}

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { CreateOutboundRequest } from "@/types/outbound";

interface OutboundCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackingNumber: string;
  onExpeditionSelect: (
    expeditionData: Omit<CreateOutboundRequest, "tracking">
  ) => void;
}

export function OutboundCreateDialog({
  open,
  onOpenChange,
  trackingNumber,
  onExpeditionSelect,
}: OutboundCreateDialogProps) {
  // Expedition options for TKP0 tracking
  const expeditionOptions = [
    {
      expedition: "ID Express",
      expedition_color: "#b10000",
      expedition_slug: "id-express",
    },
    {
      expedition: "JNE",
      expedition_color: "#296bff",
      expedition_slug: "jne",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Select Expedition
          </DialogTitle>
          <DialogDescription>
            Choose the expedition service for tracking number: {trackingNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {expeditionOptions.map((option) => (
            <Button
              key={option.expedition_slug}
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => onExpeditionSelect(option)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: option.expedition_color }}
                />
                <div className="text-left">
                  <div className="font-medium">{option.expedition}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.expedition_slug}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

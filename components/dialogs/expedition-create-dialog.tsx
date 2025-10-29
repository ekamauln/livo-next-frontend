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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BusFront, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Expedition } from "@/types/expedition";
import { expeditionApi } from "@/lib/api/expeditionApi";
import { Separator } from "@/components/ui/separator";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerFormat,
  ColorPickerOutput,
} from "@/components/ui/shadcn-io/color-picker";

// Zod form schema
const expeditionCreateSchema = z.object({
  code: z.string().min(1, "Expedition code is required"),
  name: z.string().min(1, "Expedition name is required"),
  slug: z.string().min(1, "Slug is required"),
  color: z.string().min(1, "Color is required"),
});

type ExpeditionCreateFormData = z.infer<typeof expeditionCreateSchema>;

interface ExpeditionCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExpeditionCreated: (expedition: Expedition) => void;
}

export function ExpeditionCreateDialog({
  isOpen,
  onOpenChange,
  onExpeditionCreated,
}: ExpeditionCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create expedition form
  const expeditionCreateForm = useForm<ExpeditionCreateFormData>({
    resolver: zodResolver(expeditionCreateSchema),
    defaultValues: {
      code: "",
      name: "",
      slug: "",
      color: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ExpeditionCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await expeditionApi.createExpedition(data);
      const expedition = response.data as Expedition;
      onExpeditionCreated(expedition);
      toast.success("Expedition created successfully");
      expeditionCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create expedition. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BusFront className="h-5 w-5" /> Create New Expedition
          </DialogTitle>
          <DialogDescription>
            Create a new expedition by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...expeditionCreateForm}>
            <form
              onSubmit={expeditionCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={expeditionCreateForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expedition Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter expedition code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={expeditionCreateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expedition Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter expedition name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={expeditionCreateForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expedition Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter expedition slug" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={expeditionCreateForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expedition Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter hex color (e.g., #FF0000)"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="font-mono"
                          />
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                            >
                              <div
                                className="w-4 h-4 rounded border"
                                style={{
                                  backgroundColor: field.value || "#000000",
                                }}
                              />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4" align="end">
                            <ColorPicker
                              value={field.value || "#000000"}
                              onChange={(color) => {
                                if (Array.isArray(color) && color.length >= 3) {
                                  const hex = `#${Math.round(color[0])
                                    .toString(16)
                                    .padStart(2, "0")}${Math.round(color[1])
                                    .toString(16)
                                    .padStart(2, "0")}${Math.round(color[2])
                                    .toString(16)
                                    .padStart(2, "0")}`;
                                  field.onChange(hex);
                                } else if (typeof color === "string") {
                                  field.onChange(color);
                                }
                              }}
                              className="w-80"
                            >
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <ColorPickerSelection className="h-32 w-full" />
                                </div>
                                <div className="flex flex-col gap-2 w-20">
                                  <div
                                    className="w-full h-8 rounded border border-input"
                                    style={{
                                      backgroundColor: field.value || "#000000",
                                    }}
                                  />
                                  <ColorPickerOutput />
                                </div>
                              </div>
                              <div className="space-y-2 mt-3">
                                <ColorPickerHue />
                                <ColorPickerFormat />
                              </div>
                            </ColorPicker>
                          </PopoverContent>
                        </Popover>
                      </div>
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
                    <BusFront className="mr-2 h-4 w-4" />
                  )}
                  Create New Expedition
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

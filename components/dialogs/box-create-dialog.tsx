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
import { Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Box } from "@/types/box";
import { boxApi } from "@/lib/api/boxApi";
import { Separator } from "@/components/ui/separator";

// Zod form schema
const boxCreateSchema = z.object({
  code: z.string().min(1, "Box code is required"),
  name: z.string().min(1, "Box name is required"),
});

type BoxCreateFormData = z.infer<typeof boxCreateSchema>;

interface BoxCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBoxCreated: (box: Box) => void;
}

export function BoxCreateDialog({
  isOpen,
  onOpenChange,
  onBoxCreated,
}: BoxCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create box form
  const boxCreateForm = useForm<BoxCreateFormData>({
    resolver: zodResolver(boxCreateSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: BoxCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await boxApi.createBox(data);
      const box = response.data as Box;
      onBoxCreated(box);
      toast.success("Box created successfully");
      boxCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create box. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Create New Box
          </DialogTitle>
          <DialogDescription>
            Create a new box by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...boxCreateForm}>
            <form
              onSubmit={boxCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={boxCreateForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Box Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter box code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={boxCreateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Box Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter box name" {...field} />
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
                    <UserPlus className="mr-2 h-4 w-4" />
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

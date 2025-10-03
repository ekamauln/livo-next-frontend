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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { User, Role } from "@/types/auth";
import { adminApi } from "@/lib/api/adminApi";
import { Separator } from "@/components/ui/separator";

// Zod form schema
const userCreateSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    full_name: z.string().min(1, "Full name is required"),
    initial_role: z.string().min(1, "Role is required"),
    is_active: z.boolean(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type UserCreateFormData = z.infer<typeof userCreateSchema>;

interface UserCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: User) => void;
}

export function UserCreateDialog({
  isOpen,
  onOpenChange,
  onUserCreated,
}: UserCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Roles management state
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Create user form
  const userCreateForm = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      username: "",
      email: "",
      full_name: "",
      initial_role: "",
      password: "",
      confirm_password: "",
      is_active: true,
    },
  });

  // Fetch available roles
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const response = await adminApi.getRoles(1, 20);
      const roles = response.data.roles as Role[];
      setAvailableRoles(roles);
    } catch {
      toast.error("Failed to fetch roles. Please try again.");
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    } else {
      setAvailableRoles([]);
      userCreateForm.reset({
        username: "",
        email: "",
        full_name: "",
        initial_role: "",
        password: "",
        confirm_password: "",
        is_active: true,
      });
    }
  }, [isOpen, fetchRoles, userCreateForm]);

  // Handle form submission
  const onSubmit = async (data: UserCreateFormData) => {
    setIsLoading(true);
    try {
      const response = await adminApi.createUser(data);
      const user = response.data as User;
      onUserCreated(user);
      toast.success("User created successfully!");
      userCreateForm.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Create New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account by filling out the form below.
          </DialogDescription>
          <Separator
            orientation="horizontal"
            className="mt-2 data-[orientation=horizontal]"
          />
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Form {...userCreateForm}>
            <form
              onSubmit={userCreateForm.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={userCreateForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userCreateForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userCreateForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userCreateForm.control}
                name="initial_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={rolesLoading || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1 w-full">
                          <SelectValue
                            placeholder={
                              rolesLoading
                                ? "Loading roles..."
                                : "Select a role"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userCreateForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          className={
                            userCreateForm.formState.errors.password
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                          {...field}
                        />
                        <RippleButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </RippleButton>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userCreateForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          className={
                            userCreateForm.formState.errors.confirm_password
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                          {...field}
                        />
                        <RippleButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </RippleButton>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <RippleButton
                  type="button"
                  size="sm"
                  variant="destructive"
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
                  Create New User
                </RippleButton>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

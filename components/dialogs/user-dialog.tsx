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
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn-io/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  User as UserIcon,
  Settings,
  Lock,
  Shield,
  Armchair,
  UserSearch,
  UserRoundPen,
  KeyRound,
  EyeOff,
  Eye,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { adminApi } from "@/lib/api/adminApi";
import { ApiError } from "@/lib/api/types";
import { User, Role } from "@/types/auth";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "../ui/separator";

// Role-specific badge styling
const getRoleBadgeStyle = (roleName: string) => {
  const roleStyles: Record<string, string> = {
    superadmin:
      "bg-purple-600 text-white hover:bg-purple-700 border-purple-600",
    coordinator: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
    admin: "bg-red-600 text-white hover:bg-red-700 border-red-600",
    finance: "bg-green-600 text-white hover:bg-green-700 border-green-600",
    picker: "bg-orange-500 text-white hover:bg-orange-600 border-orange-500",
    outbound: "bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-500",
    "qc-ribbon":
      "bg-indigo-500 text-white hover:bg-indigo-600 border-indigo-500",
    "qc-online":
      "bg-violet-500 text-white hover:bg-violet-600 border-violet-500",
    "mb-ribbon": "bg-pink-500 text-white hover:bg-pink-600 border-pink-500",
    "mb-online": "bg-rose-500 text-white hover:bg-rose-600 border-rose-500",
    packing: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500",
    guest: "bg-gray-500 text-white hover:bg-gray-600 border-gray-500",
  };

  return (
    roleStyles[roleName.toLowerCase()] ||
    "bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
  );
};

// Form schemas
const profileSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required"),
});

const passwordSchema = z
  .object({
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserDialogProps {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "profile" | "password" | "status" | "role";
  onUserUpdate?: () => void;
}

export function UserDialog({
  userId,
  open,
  onOpenChange,
  initialTab = "detail",
  onUserUpdate,
}: UserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);

  // Roles management state
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [rolesLoading, setRolesLoading] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      full_name: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  // Fetch user details
  const fetchUserDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const result = await adminApi.getUserById(id);

        console.log("API Response:", result); // Debug log

        if (result.success) {
          const userData = result.data;
          console.log("User Data:", userData); // Debug log

          if (userData) {
            setUser(userData);
            // Update profile form with user data
            profileForm.reset({
              email: userData.email || "",
              full_name: userData.full_name || "",
            });
          } else {
            throw new Error("User data not found in response");
          }
        } else {
          throw new Error(result.message || "Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (error instanceof ApiError) {
          toast.error("Failed to fetch user details", {
            description: error.message,
          });
        } else {
          toast.error("Failed to fetch user details", {
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [profileForm]
  );

  // Update user profile
  const updateProfile = async (data: ProfileFormData) => {
    if (!userId) return;

    try {
      setUpdating(true);
      const result = await adminApi.updateUserProfile(userId, {
        email: data.email,
        full_name: data.full_name,
      });

      console.log("Profile Update Response:", result); // Debug log

      if (result.success) {
        const updatedUser = result.data;
        console.log("Updated User Data:", updatedUser); // Debug log

        if (updatedUser) {
          toast.success("Profile updated successfully");
          // Update local user state with the returned user data
          setUser(updatedUser);
          // Also update the profile form with the new data
          profileForm.reset({
            email: updatedUser.email || "",
            full_name: updatedUser.full_name || "",
          });
          onUserUpdate?.();
        } else {
          throw new Error("Updated user data not found in response");
        }
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to update profile", {
          description: error.message,
        });
      } else {
        toast.error("Failed to update profile", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Change password
  const changePassword = async (data: PasswordFormData) => {
    if (!userId) return;

    try {
      setUpdating(true);
      const result = await adminApi.updateUserPassword(userId, {
        new_password: data.new_password,
      });

      if (result.success) {
        toast.success("Password changed successfully");
        passwordForm.reset();
      } else {
        throw new Error(result.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to change password", {
          description: error.message,
        });
      } else {
        toast.error("Failed to change password", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Change user status
  const changeStatus = async (isActive: boolean) => {
    if (!userId || !user) return;

    try {
      setUpdating(true);
      const result = await adminApi.updateUserStatus(userId, {
        is_active: isActive,
      });

      if (result.success) {
        toast.success(
          `User ${isActive ? "activated" : "deactivated"} successfully`
        );
        // Update local user state
        setUser((prev) => (prev ? { ...prev, is_active: isActive } : null));
        onUserUpdate?.();
      } else {
        throw new Error(result.message || "Failed to change user status");
      }
    } catch (error) {
      console.error("Error changing user status:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to change user status", {
          description: error.message,
        });
      } else {
        toast.error("Failed to change user status", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Fetch all available roles
  const fetchAllRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      // Get all roles by setting a high limit
      const result = await adminApi.getRoles(1, 1000);

      if (result.success) {
        const roles = result.data.roles as Role[];
        setAvailableRoles(roles);
      } else {
        throw new Error(result.message || "Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to fetch roles", {
          description: error.message,
        });
      } else {
        toast.error("Failed to fetch roles", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
      setAvailableRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Assign role to user
  const assignRole = async () => {
    if (!userId || !selectedRole) return;

    try {
      setUpdating(true);
      const result = await adminApi.assignUserRole(userId, {
        role_name: selectedRole,
      });

      if (result.success) {
        toast.success(`Role "${selectedRole}" assigned successfully`);
        // Refresh user data to get updated roles
        await fetchUserDetail(userId);
        setSelectedRole("");
        onUserUpdate?.();
      } else {
        throw new Error(result.message || "Failed to assign role");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to assign role", {
          description: error.message,
        });
      } else {
        toast.error("Failed to assign role", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Remove role from user
  const removeRole = async (roleName: string) => {
    if (!userId) return;

    try {
      setUpdating(true);
      const result = await adminApi.removeUserRole(userId, {
        role_name: roleName,
      });

      if (result.success) {
        toast.success(`Role "${roleName}" removed successfully`);
        // Refresh user data to get updated roles
        await fetchUserDetail(userId);
        onUserUpdate?.();
      } else {
        throw new Error(result.message || "Failed to remove role");
      }
    } catch (error) {
      console.error("Error removing role:", error);
      if (error instanceof ApiError) {
        toast.error("Failed to remove role", {
          description: error.message,
        });
      } else {
        toast.error("Failed to remove role", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (open && userId) {
      fetchUserDetail(userId);
      fetchAllRoles(); // Fetch available roles when dialog opens
      setActiveTab(initialTab);
    } else {
      setUser(null);
      setAvailableRoles([]);
      setSelectedRole("");
      profileForm.reset({
        email: "",
        full_name: "",
      });
      passwordForm.reset({
        new_password: "",
        confirm_password: "",
      });
    }
  }, [
    open,
    userId,
    initialTab,
    fetchUserDetail,
    fetchAllRoles,
    profileForm,
    passwordForm,
  ]);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        email: user.email,
        full_name: user.full_name,
      });
    }
  }, [user, profileForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {loading
              ? "Loading..."
              : user
              ? `${user.full_name} (${user.username})`
              : "User Details"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? `Manage user account and settings for ${user.email}.`
              : "View and manage user details"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading user details...
          </div>
        ) : user ? (
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(value: string) =>
                setActiveTab(
                  value as "detail" | "profile" | "password" | "status" | "role"
                )
              }
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
                <TabsTrigger value="detail" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="status" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Status
                </TabsTrigger>
                <TabsTrigger value="role" className="flex items-center gap-2">
                  <Armchair className="h-4 w-4" />
                  Role Manager
                </TabsTrigger>
              </TabsList>

              <TabsContents className="flex-1 overflow-y-auto">
                {/* User Details Tab */}
                <TabsContent value="detail" className="space-y-6 h-full">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserSearch className="h-5 w-5" />
                        {user.full_name} - Detail Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="w-1/4">User ID</TableCell>
                              <TableCell>{user.id}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Username</TableCell>
                              <TableCell>{user.username}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Status</TableCell>
                              <TableCell>
                                {user.is_active ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="destructive">Inactive</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Full Name</TableCell>
                              <TableCell>{user.full_name}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Email</TableCell>
                              <TableCell>{user.email}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Created</TableCell>
                              <TableCell>
                                {format(
                                  user.created_at,
                                  "dd MMMM yyyy - HH:mm"
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Roles</TableCell>
                              <TableCell className="max-w-md">
                                <div className="flex flex-wrap gap-2 text-wrap items-center">
                                  {user.roles.map((role) => (
                                    <Badge
                                      key={role.id}
                                      variant="default"
                                      className={`font-bold ${getRoleBadgeStyle(
                                        role.name
                                      )}`}
                                    >
                                      {role.name}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Profile Tab */}
                <TabsContent value="profile" className="space-y-6 h-full">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserRoundPen className="h-5 w-5" />
                        {user.full_name} - Edit Information
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form
                          onSubmit={profileForm.handleSubmit(updateProfile)}
                          className="space-y-6"
                        >
                          <FormField
                            control={profileForm.control}
                            name="full_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter full name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="Enter email address"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setActiveTab("detail")}
                              className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="default"
                              disabled={updating}
                              className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Update Profile
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Change Password Tab */}
                <TabsContent value="password" className="space-y-6 h-full">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        {user.full_name} - Change Password
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit(changePassword)}
                          className="space-y-6"
                        >
                          <FormField
                            control={passwordForm.control}
                            name="new_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Enter new password"
                                      className={
                                        passwordForm.formState.errors
                                          .new_password
                                          ? "border-destructive focus-visible:ring-destructive"
                                          : ""
                                      }
                                      {...field}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() =>
                                        setShowPassword(!showPassword)
                                      }
                                      disabled={updating}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Password must be at least 6 characters long.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="confirm_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Confirm new password"
                                      className={
                                        passwordForm.formState.errors
                                          .confirm_password
                                          ? "border-destructive focus-visible:ring-destructive"
                                          : ""
                                      }
                                      {...field}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() =>
                                        setShowPassword(!showPassword)
                                      }
                                      disabled={updating}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
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
                              onClick={() => setActiveTab("detail")}
                              className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="default"
                              disabled={updating}
                              className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Change Password
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Status Management Tab */}
                <TabsContent value="status" className="space-y-6 h-full">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {user.full_name} - Status Management
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">User Status</h4>
                            <p className="text-sm text-muted-foreground">
                              Control whether this user can access the system
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={changeStatus}
                              disabled={updating}
                              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted cursor-pointer"
                            />
                            <Badge
                              variant={
                                user.is_active ? "default" : "destructive"
                              }
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {user.is_active
                            ? "* This user can currently log in and access the system. Toggle off to deactivate."
                            : "* This user cannot log in or access the system. Toggle on to reactivate."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Role Manager Tab */}
                <TabsContent value="role" className="space-y-6 h-full">
                  <Card className="grid gap-6 rounded-md border mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Armchair className="h-5 w-5" />
                        {user.full_name} - Role Management
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Current User Roles */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Current Roles</h4>
                          <div className="flex flex-wrap gap-2 text-wrap">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <div
                                  key={role.id}
                                  className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md"
                                >
                                  <Badge
                                    variant="default"
                                    className={`font-bold ${getRoleBadgeStyle(
                                      role.name
                                    )}`}
                                  >
                                    {role.name}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground "
                                    onClick={() => removeRole(role.name)}
                                    disabled={updating}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No roles assigned to this user.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Assign New Role */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Assign New Role</h4>
                          <div className="flex gap-3">
                            <Select
                              value={selectedRole}
                              onValueChange={setSelectedRole}
                              disabled={rolesLoading || updating}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue
                                  placeholder={
                                    rolesLoading
                                      ? "Loading roles..."
                                      : "Select a role"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles
                                  .filter(
                                    (role) =>
                                      !user.roles.some(
                                        (userRole) =>
                                          userRole.name === role.name
                                      )
                                  )
                                  .map((role) => (
                                    <SelectItem key={role.id} value={role.name}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="default"
                              onClick={assignRole}
                              disabled={
                                !selectedRole || updating || rolesLoading
                              }
                              className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Assign Role
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Only roles not currently assigned to this user are
                            shown in the dropdown.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </TabsContents>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No user selected or user not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

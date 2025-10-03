import { ApiResponse, User, PaginatedResponse, Role } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const adminApi = {
  getRoles: async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Role>> => {
    return apiRequest<PaginatedResponse<Role>>(
      `/admin/roles?page=${page}&limit=${limit}`
    );
  },

  getUsers: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<User>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<User>>(
      `/admin/users?page=${page}&limit=${limit}${searchParam}`
    );
  },

  createUser: async (userData: {
    username: string;
    email: string;
    initial_role: string;
    full_name: string;
    password: string;
    is_active: boolean;
  }): Promise<ApiResponse<User>> => {
    return apiRequest<ApiResponse<User>>("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    return apiRequest<ApiResponse<User>>(`/admin/users/${id}`);
  },

  updateUserProfile: async (
    id: number,
    userData: { email: string; full_name: string }
  ): Promise<ApiResponse<User>> => {
    return apiRequest<ApiResponse<User>>(`/admin/users/${id}/profile`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  updateUserPassword: async (
    id: number,
    passwordData: { new_password: string }
  ): Promise<ApiResponse<void>> => {
    return apiRequest<ApiResponse<void>>(`/admin/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  },

  updateUserStatus: async (
    id: number,
    statusData: { is_active: boolean }
  ): Promise<ApiResponse<User>> => {
    return apiRequest<ApiResponse<User>>(`/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    });
  },

  assignUserRole: async (
    id: number,
    roleData: { role_name: string }
  ): Promise<ApiResponse<void>> => {
    return apiRequest<ApiResponse<void>>(`/admin/users/${id}/roles`, {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  },

  removeUserRole: async (
    id: number,
    roleData: { role_name: string }
  ): Promise<ApiResponse<void>> => {
    return apiRequest<ApiResponse<void>>(`/admin/users/${id}/roles`, {
      method: "DELETE",
      body: JSON.stringify(roleData),
    });
  },
};

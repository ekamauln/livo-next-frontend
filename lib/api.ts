import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiResponse,
  User,
  PaginatedResponse,
  Role,
} from "@/types/auth";
import { Product } from "@/types/product";

const API_BASE_URL = "http://192.168.31.136:8000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new ApiError(
        response.status,
        errorData.message || "Request failed"
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, "Network error");
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest<void>("/auth/logout", {
      method: "POST",
    });
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiRequest<ApiResponse<User>>("/user/profile");
  },
};

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

export const productApi = {
  getProducts: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Product>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Product>>(
      `/products?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getProductById: async (id: number): Promise<ApiResponse<Product>> => {
    return apiRequest<ApiResponse<Product>>(`/products/${id}`);
  },

  createProduct: async (productData: {
    sku: string;
    name: string;
    image?: string;
    variant: string;
    location: string;
    barcode: string;
  }): Promise<ApiResponse<Product>> => {
    return apiRequest<ApiResponse<Product>>("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (
    id: number,
    productData: {
      name: string;
      variant: string;
      image: string;
    }
  ): Promise<ApiResponse<Product>> => {
    return apiRequest<ApiResponse<Product>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  },
};

export { ApiError };

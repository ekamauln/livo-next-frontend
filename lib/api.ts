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
import { Order, OrderDetail } from "@/types/order";

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

export const orderApi = {
  getOrders: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append("search", search);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    return apiRequest<PaginatedResponse<Order>>(`/orders?${params.toString()}`);
  },

  getOrderById: async (id: number): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>(`/orders/${id}`);
  },

  getOrderDetails: async (id: number): Promise<ApiResponse<{ order_details: OrderDetail[] }>> => {
    return apiRequest<ApiResponse<{ order_details: OrderDetail[] }>>(`/orders/${id}/details`);
  },

  createOrderDetail: async (
    orderId: number,
    detailData: {
      product_name: string;
      quantity: number;
      sku: string;
      variant?: string;
    }
  ): Promise<ApiResponse<OrderDetail>> => {
    return apiRequest<ApiResponse<OrderDetail>>(`/orders/${orderId}/details`, {
      method: "POST",
      body: JSON.stringify(detailData),
    });
  },

  updateOrderDetail: async (
    orderId: number,
    detailId: number,
    detailData: {
      product_name: string;
      quantity: number;
      sku: string;
      variant?: string;
    }
  ): Promise<ApiResponse<OrderDetail>> => {
    return apiRequest<ApiResponse<OrderDetail>>(`/orders/${orderId}/details/${detailId}`, {
      method: "PUT",
      body: JSON.stringify(detailData),
    });
  },

  deleteOrderDetail: async (orderId: number, detailId: number): Promise<ApiResponse<void>> => {
    return apiRequest<ApiResponse<void>>(`/orders/${orderId}/details/${detailId}`, {
      method: "DELETE",
    });
  },

  createOrder: async (orderData: {
    order_id: string;
    status: string;
    channel?: string;
    store?: string;
    buyer?: string;
    tracking?: string;
    courier?: string;
    order_details: Array<{
      sku?: string;
      product_name: string;
      variant?: string;
      quantity?: number;
    }>;
  }): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  updateOrder: async (
    id: number,
    orderData: {
      status?: string;
      channel?: string;
      store?: string;
      buyer?: string;
      tracking?: string;
      courier?: string;
      picked_by?: string;
      picked_at?: string;
    }
  ): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    });
  },

  bulkImportOrders: async (ordersData: {
    orders: Array<{
      order_id: string;
      status: string;
      channel?: string;
      store?: string;
      buyer?: string;
      tracking?: string;
      courier?: string;
      order_details: Array<{
        sku?: string;
        product_name: string;
        variant?: string;
        quantity?: number;
      }>;
    }>;
  }): Promise<ApiResponse<{
    summary: {
      total: number;
      created: number;
      failed: number;
      skipped: number;
    };
    details?: Array<{
      order_id: string;
      status: string;
      message?: string;
    }>;
  }>> => {
    return apiRequest<ApiResponse<{
      summary: {
        total: number;
        created: number;
        failed: number;
        skipped: number;
      };
      details?: Array<{
        order_id: string;
        status: string;
        message?: string;
      }>;
    }>>("/orders/bulk", {
      method: "POST",
      body: JSON.stringify(ordersData),
    });
  },
};

export { ApiError };

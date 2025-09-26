import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiResponse,
  User,
  PaginatedResponse,
  Role,
} from "@/types/auth";

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
    limit: number = 10
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
};

export { ApiError };

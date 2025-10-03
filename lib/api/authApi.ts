import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiResponse,
  User,
} from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

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

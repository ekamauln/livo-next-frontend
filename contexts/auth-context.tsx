"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  AuthContextType,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth";
import { authApi, ApiError } from "@/lib/api";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      const userData = localStorage.getItem("user_data");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          // Optionally verify token by fetching profile
          const profileResponse = await authApi.getProfile();
          setUser(profileResponse.data);
          localStorage.setItem(
            "user_data",
            JSON.stringify(profileResponse.data)
          );
        } catch (error) {
          console.error("Error verifying token:", error);
          // Token might be expired, clear storage
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_data");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);

      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user_data", JSON.stringify(userData));

      setUser(userData);
      toast.success("Login successful! Welcome back.");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Login failed");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(credentials);

      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user_data", JSON.stringify(userData));

      setUser(userData);
      toast.success("Registration successful");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Error during logout:", error);
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      setUser(null);
      toast.success("Logged out successfully");
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refresh_token");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await authApi.refreshToken(storedRefreshToken);
      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user_data", JSON.stringify(userData));

      setUser(userData);
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      setUser(null);
      throw error;
    }
  };

  const hasRole = (roleName: string): boolean => {
    return user?.roles.some((role) => role.name === roleName) || false;
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return user?.roles.some((role) => roleNames.includes(role.name)) || false;
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    refreshToken,
    isLoading,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

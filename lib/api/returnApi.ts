import {
  CreateBaseReturn,
  Return,
  UpdateReturnAdmin,
  UpdateReturnData,
} from "@/types/return";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const returnApi = {
  getReturns: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Return>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Return>>(
      `/returns?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getReturnById: async (id: number): Promise<ApiResponse<Return>> => {
    return apiRequest<ApiResponse<Return>>(`/returns/${id}`);
  },

  createBaseReturn: async (
    returnData: CreateBaseReturn
  ): Promise<ApiResponse<Return>> => {
    return apiRequest<ApiResponse<Return>>("/returns", {
      method: "POST",
      body: JSON.stringify(returnData),
    });
  },

  updateReturnData: async (
    id: number,
    updateData: UpdateReturnData
  ): Promise<ApiResponse<Return>> => {
    return apiRequest<ApiResponse<Return>>(`/returns/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  updateReturnAdmin: async (
    id: number,
    updateData: UpdateReturnAdmin
  ): Promise<ApiResponse<Return>> => {
    return apiRequest<ApiResponse<Return>>(`/returns/${id}/admin`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },
};

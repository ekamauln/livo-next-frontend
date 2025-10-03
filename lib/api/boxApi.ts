import { Box } from "@/types/box";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const boxApi = {
  getBoxes: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Box>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Box>>(
      `/boxes?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getBoxById: async (id: number): Promise<ApiResponse<Box>> => {
    return apiRequest<ApiResponse<Box>>(`/boxes/${id}`);
  },

  createBox: async (boxData: {
    code: string;
    name: string;
  }): Promise<ApiResponse<Box>> => {
    return apiRequest<ApiResponse<Box>>("/boxes", {
      method: "POST",
      body: JSON.stringify(boxData),
    });
  },

  updateBox: async (
    id: number,
    boxData: {
      code: string;
      name: string;
    }
  ): Promise<ApiResponse<Box>> => {
    return apiRequest<ApiResponse<Box>>(`/boxes/${id}`, {
      method: "PUT",
      body: JSON.stringify(boxData),
    });
  },

  deleteBox: async (id: number): Promise<ApiResponse<Box>> => {
    return apiRequest<ApiResponse<Box>>(`/boxes/${id}`, {
      method: "DELETE",
    });
  },
};

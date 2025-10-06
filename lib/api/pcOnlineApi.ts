import { PcOnline, CreatePcOnlineRequest } from "@/types/pc-online";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const pcOnlineApi = {
  getPcOnlines: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<PcOnline>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<PcOnline>>(
      `/pc-onlines?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getPcOnlineById: async (id: number): Promise<ApiResponse<PcOnline>> => {
    return apiRequest<ApiResponse<PcOnline>>(`/pc-onlines/${id}`);
  },

  createPcOnline: async (
    pcOnlineData: CreatePcOnlineRequest
  ): Promise<ApiResponse<PcOnline>> => {
    return apiRequest<ApiResponse<PcOnline>>("/pc-onlines", {
      method: "POST",
      body: JSON.stringify(pcOnlineData),
    });
  },
};

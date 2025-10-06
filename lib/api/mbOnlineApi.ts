import { MbOnline } from "@/types/mb-online";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const mbOnlineApi = {
  getMbOnlines: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<MbOnline>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<MbOnline>>(
      `/mb-onlines?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getMbOnlineById: async (id: number): Promise<ApiResponse<MbOnline>> => {
    return apiRequest<ApiResponse<MbOnline>>(`/mb-onlines/${id}`);
  },

  createMbOnline: async (mbOnlineData: {
    tracking: string;
  }): Promise<ApiResponse<MbOnline>> => {
    return apiRequest<ApiResponse<MbOnline>>("/mb-onlines", {
      method: "POST",
      body: JSON.stringify(mbOnlineData),
    });
  },
};

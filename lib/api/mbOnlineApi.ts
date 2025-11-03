import { MbOnline } from "@/types/mb-online";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

interface MbOnlineChartData {
  month: string;
  year: number;
  daily_counts: Array<{
    date: string;
    count: number;
  }> | null;
  total_count: number;
}

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

  getMbOnlineChart: async (): Promise<ApiResponse<MbOnlineChartData>> => {
    return apiRequest<ApiResponse<MbOnlineChartData>>("/mb-onlines/chart");
  },
};

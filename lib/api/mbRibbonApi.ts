import { MbRibbon } from "@/types/mb-ribbon";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

interface MbRibbonChartData {
  month: string;
  year: number;
  daily_counts: Array<{ date: string; count: number }> | null;
  total_count: number;
}

export const mbRibbonApi = {
  getMbRibbons: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<MbRibbon>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<MbRibbon>>(
      `/mb-ribbons?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getMbRibbonById: async (id: number): Promise<ApiResponse<MbRibbon>> => {
    return apiRequest<ApiResponse<MbRibbon>>(`/mb-ribbons/${id}`);
  },

  createMbRibbon: async (mbRibbonData: {
    tracking: string;
  }): Promise<ApiResponse<MbRibbon>> => {
    return apiRequest<ApiResponse<MbRibbon>>("/mb-ribbons", {
      method: "POST",
      body: JSON.stringify(mbRibbonData),
    });
  },

  getMbRibbonChart: async (): Promise<ApiResponse<MbRibbonChartData>> => {
    return apiRequest<ApiResponse<MbRibbonChartData>>("/mb-ribbons/chart");
  },
};

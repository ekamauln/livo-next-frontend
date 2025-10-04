import { MbRibbon } from "@/types/mb-ribbon";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

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
};

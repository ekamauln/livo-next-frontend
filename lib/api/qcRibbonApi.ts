import { QcRibbon, CreateQcRibbonRequest } from "@/types/qc-ribbon";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const qcRibbonApi = {
  getQcRibbons: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<QcRibbon>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<QcRibbon>>(
      `/qc-ribbons?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getQcRibbonById: async (id: number): Promise<ApiResponse<QcRibbon>> => {
    return apiRequest<ApiResponse<QcRibbon>>(`/qc-ribbons/${id}`);
  },

  createQcRibbon: async (
    qcRibbonData: CreateQcRibbonRequest
  ): Promise<ApiResponse<QcRibbon>> => {
    return apiRequest<ApiResponse<QcRibbon>>("/qc-ribbons", {
      method: "POST",
      body: JSON.stringify(qcRibbonData),
    });
  },
};

import { QcOnline, CreateQcOnlineRequest } from "@/types/qc-online";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const qcOnlineApi = {
  getQcOnlines: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<QcOnline>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<QcOnline>>(
      `/qc-onlines?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getQcOnlineById: async (id: number): Promise<ApiResponse<QcOnline>> => {
    return apiRequest<ApiResponse<QcOnline>>(`/qc-onlines/${id}`);
  },

  createQcOnline: async (
    qcOnlineData: CreateQcOnlineRequest
  ): Promise<ApiResponse<QcOnline>> => {
    return apiRequest<ApiResponse<QcOnline>>("/qc-onlines", {
      method: "POST",
      body: JSON.stringify(qcOnlineData),
    });
  },
};

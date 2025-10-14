import { Expedition } from "@/types/expedition";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const expeditionApi = {
  getExpeditions: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Expedition>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Expedition>>(
      `/expeditions?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getExpeditionById: async (id: number): Promise<ApiResponse<Expedition>> => {
    return apiRequest<ApiResponse<Expedition>>(`/expeditions/${id}`);
  },

  createExpedition: async (expeditionData: {
    code: string;
    name: string;
    slug: string;
    color: string;
  }): Promise<ApiResponse<Expedition>> => {
    return apiRequest<ApiResponse<Expedition>>("/expeditions", {
      method: "POST",
      body: JSON.stringify(expeditionData),
    });
  },

  updateExpedition: async (
    id: number,
    expeditionData: {
      code: string;
      name: string;
      slug: string;
      color: string;
    }
  ): Promise<ApiResponse<Expedition>> => {
    return apiRequest<ApiResponse<Expedition>>(`/expeditions/${id}`, {
      method: "PUT",
      body: JSON.stringify(expeditionData),
    });
  },

  deleteExpedition: async (id: number): Promise<ApiResponse<Expedition>> => {
    return apiRequest<ApiResponse<Expedition>>(`/expeditions/${id}`, {
      method: "DELETE",
    });
  },
};

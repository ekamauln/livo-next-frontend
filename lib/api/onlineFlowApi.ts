import { OnlineFlow } from "@/types/online-flow";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const onlineFlowApi = {
  getOnlineFlows: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<OnlineFlow>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<OnlineFlow>>(
      `/online-flow?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getOnlineFlowById: async (id: number): Promise<ApiResponse<OnlineFlow>> => {
    return apiRequest<ApiResponse<OnlineFlow>>(`/online-flows/${id}`);
  },
};

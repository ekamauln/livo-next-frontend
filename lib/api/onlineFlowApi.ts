import { OnlineFlow } from "@/types/online-flow";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const onlineFlowApi = {
  getOnlineFlows: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<OnlineFlow>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    const url = `/online-flow?${params.toString()}`;
    console.log('Online Flow API URL:', url); // Debug log
    
    return apiRequest<PaginatedResponse<OnlineFlow>>(url);
  },

  getOnlineFlowById: async (id: number): Promise<ApiResponse<OnlineFlow>> => {
    return apiRequest<ApiResponse<OnlineFlow>>(`/online-flows/${id}`);
  },
};

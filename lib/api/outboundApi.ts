import {
  Outbound,
  CreateOutboundRequest,
  UpdateOutboundRequest,
} from "@/types/outbound";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

interface OutboundChartData {
  month: string;
  year: number;
  daily_counts: Array<{
    date: string;
    count: number;
  }> | null;
  total_count: number;
}

export const outboundApi = {
  getOutbounds: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Outbound>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Outbound>>(
      `/outbounds?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getOutboundById: async (id: number): Promise<ApiResponse<Outbound>> => {
    return apiRequest<ApiResponse<Outbound>>(`/outbounds/${id}`);
  },

  createOutbound: async (
    outboundData: CreateOutboundRequest
  ): Promise<ApiResponse<Outbound>> => {
    return apiRequest<ApiResponse<Outbound>>("/outbounds", {
      method: "POST",
      body: JSON.stringify(outboundData),
    });
  },

  updateOutbound: async (
    id: number,
    outboundData: UpdateOutboundRequest
  ): Promise<ApiResponse<Outbound>> => {
    return apiRequest<ApiResponse<Outbound>>(`/outbounds/${id}`, {
      method: "PUT",
      body: JSON.stringify(outboundData),
    });
  },

  deleteOutbound: async (id: number): Promise<ApiResponse<Outbound>> => {
    return apiRequest<ApiResponse<Outbound>>(`/outbounds/${id}`, {
      method: "DELETE",
    });
  },

  getOutboundChart: async (): Promise<ApiResponse<OutboundChartData>> => {
    return apiRequest<ApiResponse<OutboundChartData>>("/outbounds/chart");
  },
};

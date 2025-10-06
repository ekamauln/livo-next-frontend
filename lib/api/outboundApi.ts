import {
  Outbound,
  CreateOutboundRequest,
  UpdateOutboundRequest,
  OutboundResponse,
} from "@/types/outbound";
import { ApiResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const outboundApi = {
  getOutbounds: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<OutboundResponse> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<OutboundResponse>(
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
};

import { Channel } from "@/types/channel";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const channelApi = {
  getChannels: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Channel>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Channel>>(
      `/channels?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getChannelById: async (id: number): Promise<ApiResponse<Channel>> => {
    return apiRequest<ApiResponse<Channel>>(`/channels/${id}`);
  },

  createChannel: async (channelData: {
    code: string;
    name: string;
  }): Promise<ApiResponse<Channel>> => {
    return apiRequest<ApiResponse<Channel>>("/channels", {
      method: "POST",
      body: JSON.stringify(channelData),
    });
  },

  updateChannel: async (
    id: number,
    channelData: {
      code: string;
      name: string;
    }
  ): Promise<ApiResponse<Channel>> => {
    return apiRequest<ApiResponse<Channel>>(`/channels/${id}`, {
      method: "PUT",
      body: JSON.stringify(channelData),
    });
  },

  deleteChannel: async (id: number): Promise<ApiResponse<Channel>> => {
    return apiRequest<ApiResponse<Channel>>(`/channels/${id}`, {
      method: "DELETE",
    });
  },
};

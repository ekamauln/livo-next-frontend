import { CreateComplain, Complain, UpdateComplain } from "@/types/complain";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const complainApi = {
  getComplains: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    start_date?: string,
    end_date?: string
  ): Promise<PaginatedResponse<Complain>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    const startDateParam = start_date ? `&start_date=${start_date}` : "";
    const endDateParam = end_date ? `&end_date=${end_date}` : "";
    return apiRequest<PaginatedResponse<Complain>>(
      `/complains?page=${page}&limit=${limit}${searchParam}${startDateParam}${endDateParam}`
    );
  },

  getComplainById: async (id: number): Promise<ApiResponse<Complain>> => {
    return apiRequest<ApiResponse<Complain>>(`/complains/${id}`);
  },

  createComplain: async (
    complain: CreateComplain
  ): Promise<ApiResponse<Complain>> => {
    return apiRequest<ApiResponse<Complain>>("/complains", {
      method: "POST",
      body: JSON.stringify(complain),
    });
  },

  updateComplain: async (
    id: number,
    updateData: UpdateComplain
  ): Promise<ApiResponse<Complain>> => {
    return apiRequest<ApiResponse<Complain>>(`/complains/${id}/solution`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  checkComplain: async (
    id: number,
    checked: boolean
  ): Promise<ApiResponse<Complain>> => {
    const requestBody = { checked };
    
    return apiRequest<ApiResponse<Complain>>(`/complains/${id}/check`, {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};

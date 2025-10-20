import { Return, ReturnDetails } from "@/types/return";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const returnApi = {
  getReturns: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Return>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Return>>(
      `/returns?page=${page}&limit=${limit}${searchParam}`
    );
  },
};

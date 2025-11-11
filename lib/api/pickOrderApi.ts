import { PickOrder, PickOrderResponse } from "@/types/pick-order";
import { ApiResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const pickOrderApi = {
  getPickOrders: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    start_date?: string,
    end_date?: string
  ): Promise<PickOrderResponse> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    const startDateParam = start_date ? `&start_date=${start_date}` : "";
    const endDateParam = end_date ? `&end_date=${end_date}` : "";
    return apiRequest<PickOrderResponse>(
      `/pick-orders?page=${page}&limit=${limit}${searchParam}${startDateParam}${endDateParam}`
    );
  },

  getPickOrderById: async (id: number): Promise<ApiResponse<PickOrder>> => {
    return apiRequest<ApiResponse<PickOrder>>(`/pick-orders/${id}`);
  },
};

import { Store } from "@/types/store";
import { ApiResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

interface StoresPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    stores: Store[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export const storeApi = {
  getStores: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<StoresPaginatedResponse> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<StoresPaginatedResponse>(
      `/stores?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getStoreById: async (id: number): Promise<ApiResponse<Store>> => {
    return apiRequest<ApiResponse<Store>>(`/stores/${id}`);
  },

  createStore: async (storeData: {
    code: string;
    name: string;
  }): Promise<ApiResponse<Store>> => {
    return apiRequest<ApiResponse<Store>>("/stores", {
      method: "POST",
      body: JSON.stringify(storeData),
    });
  },

  updateStore: async (
    id: number,
    storeData: {
      code: string;
      name: string;
    }
  ): Promise<ApiResponse<Store>> => {
    return apiRequest<ApiResponse<Store>>(`/stores/${id}`, {
      method: "PUT",
      body: JSON.stringify(storeData),
    });
  },

  deleteStore: async (id: number): Promise<ApiResponse<Store>> => {
    return apiRequest<ApiResponse<Store>>(`/stores/${id}`, {
      method: "DELETE",
    });
  },
};

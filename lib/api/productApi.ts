import { Product } from "@/types/product";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "@/lib/api/types";

export const productApi = {
  getProducts: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Product>> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiRequest<PaginatedResponse<Product>>(
      `/products?page=${page}&limit=${limit}${searchParam}`
    );
  },

  getProductById: async (id: number): Promise<ApiResponse<Product>> => {
    return apiRequest<ApiResponse<Product>>(`/products/${id}`);
  },

  createProduct: async (productData: {
    sku: string;
    name: string;
    image?: string;
    variant: string;
    location: string;
    barcode: string;
  }): Promise<ApiResponse<Product>> => {
    return apiRequest<ApiResponse<Product>>("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (
    id: number,
    productData: {
      name: string;
      variant: string;
      image: string;
    }
  ): Promise<ApiResponse<Product>> => {
    return apiRequest<ApiResponse<Product>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  },
};

import { Order, OrderDetail } from "@/types/order";
import { ApiResponse, PaginatedResponse } from "@/types/auth";
import { apiRequest } from "./types";

export const orderApi = {
  getOrders: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append("search", search);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    return apiRequest<PaginatedResponse<Order>>(`/orders?${params.toString()}`);
  },

  getOrderById: async (id: number): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>(`/orders/${id}`);
  },

  getOrderDetails: async (id: number): Promise<ApiResponse<{ order_details: OrderDetail[] }>> => {
    return apiRequest<ApiResponse<{ order_details: OrderDetail[] }>>(`/orders/${id}/details`);
  },

  createOrderDetail: async (
    orderId: number,
    detailData: {
      product_name: string;
      quantity: number;
      sku: string;
      variant?: string;
    }
  ): Promise<ApiResponse<OrderDetail>> => {
    return apiRequest<ApiResponse<OrderDetail>>(`/orders/${orderId}/details`, {
      method: "POST",
      body: JSON.stringify(detailData),
    });
  },

  updateOrderDetail: async (
    orderId: number,
    detailId: number,
    detailData: {
      product_name: string;
      quantity: number;
      sku: string;
      variant?: string;
    }
  ): Promise<ApiResponse<OrderDetail>> => {
    return apiRequest<ApiResponse<OrderDetail>>(`/orders/${orderId}/details/${detailId}`, {
      method: "PUT",
      body: JSON.stringify(detailData),
    });
  },

  deleteOrderDetail: async (orderId: number, detailId: number): Promise<ApiResponse<void>> => {
    return apiRequest<ApiResponse<void>>(`/orders/${orderId}/details/${detailId}`, {
      method: "DELETE",
    });
  },

  createOrder: async (orderData: {
    order_id: string;
    status: string;
    channel?: string;
    store?: string;
    buyer?: string;
    tracking?: string;
    courier?: string;
    order_details: Array<{
      sku?: string;
      product_name: string;
      variant?: string;
      quantity?: number;
    }>;
  }): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  updateOrder: async (
    id: number,
    orderData: {
      status?: string;
      channel?: string;
      store?: string;
      buyer?: string;
      tracking?: string;
      courier?: string;
      picked_by?: string;
      picked_at?: string;
    }
  ): Promise<ApiResponse<Order>> => {
    return apiRequest<ApiResponse<Order>>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    });
  },

  bulkImportOrders: async (ordersData: {
    orders: Array<{
      order_id: string;
      status: string;
      channel?: string;
      store?: string;
      buyer?: string;
      tracking?: string;
      courier?: string;
      order_details: Array<{
        sku?: string;
        product_name: string;
        variant?: string;
        quantity?: number;
      }>;
    }>;
  }): Promise<ApiResponse<{
    summary: {
      total: number;
      created: number;
      failed: number;
      skipped: number;
    };
    details?: Array<{
      order_id: string;
      status: string;
      message?: string;
    }>;
  }>> => {
    return apiRequest<ApiResponse<{
      summary: {
        total: number;
        created: number;
        failed: number;
        skipped: number;
      };
      details?: Array<{
        order_id: string;
        status: string;
        message?: string;
      }>;
    }>>("/orders/bulk", {
      method: "POST",
      body: JSON.stringify(ordersData),
    });
  },
};
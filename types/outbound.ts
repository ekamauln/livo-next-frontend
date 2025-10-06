export interface Outbound {
  id: number;
  tracking: string;
  user_id: number;
  expedition: string;
  expedition_color: string;
  expedition_slug: string;
  complained: boolean;
  created_at: string;
  updated_at: string;
  order?: {
    id: number;
    order_id: string;
    status: string;
    channel: string;
    store: string;
    buyer: string;
    courier: string;
    tracking: string;
    complained: boolean;
    picked_by: string;
    picked_at: string;
    created_at: string;
    updated_at: string;
    order_details: Array<{
      id: number;
      sku: string;
      product_name: string;
      variant: string;
      quantity: number;
    }>;
  };
  user?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    roles: Array<{
      id: number;
      name: string;
      description: string;
      assigned_by: string;
      assigned_at: string;
    }>;
  };
}

export interface CreateOutboundRequest {
  expedition: string;
  expedition_color: string;
  expedition_slug: string;
  tracking: string;
}

export interface UpdateOutboundRequest {
  expedition: string;
  expedition_color: string;
  expedition_slug: string;
}

export interface OutboundQueryParams {
  page?: string;
  limit?: string;
  search?: string;
}

export interface OutboundResponse {
  success: boolean;
  message: string;
  data: {
    outbounds: Outbound[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

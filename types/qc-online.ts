export interface QcOnlineDetail {
  id: number;
  qc_online_id: number;
  box_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  box: {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
}

export interface QcOnline {
  id: number;
  tracking: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  complained: boolean;
  details: QcOnlineDetail[];
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

export interface CreateQcOnlineRequest {
  tracking: string;
  details: Array<{
    box_id: number;
    quantity: number;
  }>;
}

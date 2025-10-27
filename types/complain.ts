export interface Complain {
  id: number;
  code: string;
  tracking: string;
  order_id: string;
  channel_id: number;
  store_id: number;
  user_id: number;
  description: string;
  solution: string;
  total_fee: number;
  checked: boolean;
  created_at: string;
  updated_at: string;
  product_details?: ComplainProductDetails[];
  user_details?: ComplainUserDetails[];
  channel?: {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  store?: {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
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
  creator?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    roles?: Array<{
      id: number;
      name: string;
      description: string;
      assigned_by: string;
      assigned_at: string;
    }>;
  };
}

export interface ComplainProductDetails {
  id: number;
  complain_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    sku: string;
    name: string;
    image: string;
    variant: string;
    location: string;
    barcode: string;
    created_at: string;
    updated_at: string;
  };
}

export interface ComplainUserDetails {
  id: number;
  complain_id: number;
  user_id: number;
  fee_charge: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    roles?: Array<{
      id: number;
      name: string;
      description: string;
      assigned_by: string;
      assigned_at: string;
    }>;
  };
}

export interface CreateComplain {
  tracking: string;
  channel_id: number;
  store_id: number;
  description: string;
}

export interface UpdateComplain {
  solution?: string;
  description?: string;
  total_fee?: number;
  user_details?: Array<{
    user_id: number;
    fee_charge: number;
  }>;
}

export interface checkedComplain {
  checked: boolean;
}

export interface Return {
  id: number;
  new_tracking: string;
  old_tracking: string;
  channel_id: number;
  store_id: number;
  return_type: string;
  return_reason: string;
  return_number: string;
  scrap_number: string;
  created_at: string;
  updated_at: string;
  details?: ReturnDetails[];
  return_details?: ReturnDetails[];
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
}

export interface ReturnDetails {
  id: number;
  return_id: number;
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

export interface CreateBaseReturn {
  new_tracking: string;
  channel_id: number;
  store_id: number;
}

export interface UpdateReturnData {
  old_tracking?: string;
  return_type?: string;
  return_reason?: string;
}

export interface UpdateReturnAdmin {
  old_tracking?: string;
  return_type?: string;
  return_reason?: string;
  return_number?: string;
  scrap_number?: string;
}

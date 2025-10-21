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
  details: ReturnDetails[];
}

export interface ReturnDetails {
  id: number;
  return_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
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

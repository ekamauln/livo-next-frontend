export interface OutboundReport {
  id: number;
  tracking: string;
  user_id: number;
  expedition: string;
  expedition_color: string;
  expedition_slug: string;
  complained: boolean;
  created_at: string;
  updated_at: string;
  user: OutboundReportUser;
}

export interface OutboundReportUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: OutboundReportUserRole[];
}

export interface OutboundReportUserRole {
  id: number;
  name: string;
  description: string;
  assigned_by: string;
  assigned_at: string;
}

export interface OutboundReportResponse {
  success: boolean;
  message: string;
  data: {
    outbounds: OutboundReport[];
    total: number;
  };
}

export interface ReturnReport {
  id: number;
  new_tracking: string;
  old_tracking: string;
  order_id: string;
  channel_id: number;
  store_id: number;
  return_type: string;
  return_reason: string;
  return_number: string;
  scrap_number: string;
  created_at: string;
  updated_at: string;
  return_details: ReturnReportDetail[];
  order: ReturnReportOrder;
  channel: ReturnReportChannel;
  store: ReturnReportStore;
}

export interface ReturnReportOrder {
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
  order_details: ReturnReportOrderDetail[];
}

export interface ReturnReportOrderDetail {
  id: number;
  sku: string;
  product_name: string;
  variant: string;
  quantity: number;
}

export interface ReturnReportDetail {
  id: number;
  return_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: ReturnReportProduct;
}

export interface ReturnReportProduct {
  id: number;
  sku: string;
  name: string;
  image: string;
  variant: string;
  location: string;
  barcode: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnReportChannel {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnReportStore {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnReportResponse {
  success: boolean;
  message: string;
  data: {
    returns: ReturnReport[];
    total: number;
  };
}

export interface ComplainReport {
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
  product_details: ComplainReportProductDetail[];
  user_details: ComplainReportUserDetail[];
  channel: ComplainReportChannel;
  store: ComplainReportStore;
}

export interface ComplainReportProductDetail {
  id: number;
  complain_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: ComplainReportProduct;
}

export interface ComplainReportProduct {
  id: number;
  sku: string;
  name: string;
  image: string;
  variant: string;
  location: string;
  barcode: string;
  created_at: string;
  updated_at: string;
}

export interface ComplainReportUserDetail {
  id: number;
  complain_id: number;
  user_id: number;
  fee_charge: number;
  created_at: string;
  updated_at: string;
  user: ComplainReportUser;
}

export interface ComplainReportUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: ComplainReportUserRole[];
}

export interface ComplainReportUserRole {
  id: number;
  name: string;
  description: string;
  assigned_by: string;
  assigned_at: string;
}

export interface ComplainReportChannel {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ComplainReportStore {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ComplainReportResponse {
  success: boolean;
  message: string;
  data: {
    complains: ComplainReport[];
    total: number;
  };
}

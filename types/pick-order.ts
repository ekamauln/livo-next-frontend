// Product interface
export interface Product {
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

// Order Detail interface
export interface OrderDetail {
  id: number;
  sku: string;
  product_name: string;
  variant: string;
  quantity: number;
}

// Role interface
export interface Role {
  id: number;
  name: string;
  description: string;
  assigned_by: string;
  assigned_at: string;
}

// Picker (User) interface
export interface Picker {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: Role[];
}

// Order interface
export interface Order {
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
  order_details: OrderDetail[];
}

// Pick Order Detail interface
export interface PickOrderDetail {
  id: number;
  pick_order_id: number;
  sku: string;
  product_name: string;
  variant: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: Product;
}

// Pick Order interface
export interface PickOrder {
  id: number;
  order_id: number;
  picker_id: number;
  created_at: string;
  updated_at: string;
  order: Order;
  picker: Picker;
  pick_order_details: PickOrderDetail[];
}

// Pagination interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// Pick Order Response interface
export interface PickOrderResponse {
  success: boolean;
  message: string;
  data: {
    pick_orders: PickOrder[];
    pagination: Pagination;
  };
}

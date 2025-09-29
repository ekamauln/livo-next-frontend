export interface OrderDetail {
  id: number;
  sku?: string;
  product_name: string;
  variant?: string;
  quantity?: number;
}

export interface Order {
  id: number;
  order_id: string;
  status: string;
  channel?: string;
  store?: string;
  buyer?: string;
  tracking?: string;
  courier?: string;
  created_at?: string;
  updated_at?: string;
  picked_by?: string;
  picked_at?: string;
  order_details: OrderDetail[];
  "No."?: string | number; // Keep for Excel import compatibility
}

// Types for Excel import
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export type CellValue = string | number | boolean | null | undefined;
export type ExcelRow = { [key: string]: JsonValue };
export type WorksheetData = (string | number | boolean | null | undefined)[][];

export interface OrdersData {
  orders: Order[];
}

// Additional types for order table and pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

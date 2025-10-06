// Re-export all API modules and utilities
export { authApi } from "@/lib/api/authApi";
export { adminApi } from "@/lib/api/adminApi";
export { productApi } from "@/lib/api/productApi";
export { boxApi } from "@/lib/api/boxApi";
export { orderApi } from "@/lib/api/orderApi";
export { mbRibbonApi } from "@/lib/api/mbRibbonApi";
export { qcRibbonApi } from "@/lib/api/qcRibbonApi";
export { mbOnlineApi } from "@/lib/api/mbOnlineApi";
export { qcOnlineApi } from "@/lib/api/qcOnlineApi";
export { ApiError, apiRequest, API_BASE_URL } from "@/lib/api/types";

// Export types for backward compatibility
export type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiResponse,
  User,
  PaginatedResponse,
  Role,
} from "@/types/auth";

export type { Product } from "@/types/product";
export type { Box } from "@/types/box";
export type { Order, OrderDetail } from "@/types/order";
export type { MbRibbon } from "@/types/mb-ribbon";
export type {
  QcRibbon,
  QcRibbonDetail,
  CreateQcRibbonRequest,
} from "@/types/qc-ribbon";
export type { MbOnline } from "@/types/mb-online";
export type {
  QcOnline,
  QcOnlineDetail,
  CreateQcOnlineRequest,
} from "@/types/qc-online";

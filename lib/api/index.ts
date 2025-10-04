// Re-export all API modules and utilities
export { authApi } from "./authApi";
export { adminApi } from "./adminApi";
export { productApi } from "./productApi";
export { orderApi } from "./orderApi";
export { mbRibbonApi } from "./mbRibbonApi";
export { qcRibbonApi } from "./qcRibbonApi";
export { boxApi } from "./boxApi";
export { ApiError, apiRequest, API_BASE_URL } from "./types";

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
export type { Order, OrderDetail } from "@/types/order";
export type { MbRibbon } from "@/types/mb-ribbon";
export type {
  QcRibbon,
  QcRibbonDetail,
  CreateQcRibbonRequest,
} from "@/types/qc-ribbon";
export type { Box } from "@/types/box";

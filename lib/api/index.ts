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
export { pcOnlineApi } from "@/lib/api/pcOnlineApi";
export { onlineFlowApi } from "@/lib/api/onlineFlowApi";
export { outboundApi } from "@/lib/api/outboundApi";
export { expeditionApi } from "@/lib/api/expeditionApi";
export { returnApi } from "@/lib/api/returnApi";
export { channelApi } from "@/lib/api/channelApi";
export { storeApi } from "@/lib/api/storeApi";
export { complainApi } from "@/lib/api/complainApi";
export { reportApi } from "@/lib/api/reportApi";
export { ribbonFlowApi } from "@/lib/api/ribbonFlowApi";
export { pickOrderApi } from "@/lib/api/pickOrderApi";
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
export type { Expedition } from "@/types/expedition";
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
export type {
  PcOnline,
  PcOnlineDetail,
  CreatePcOnlineRequest,
} from "@/types/pc-online";
export type {
  Outbound,
  CreateOutboundRequest,
  UpdateOutboundRequest,
} from "@/types/outbound";
export type {
  OnlineFlow,
  OnlineFlowUser,
  OnlineFlowProcessStep,
  OnlineFlowOutbound,
  OnlineFlowOrder,
  OnlineFlowQueryParams,
} from "@/types/online-flow";
export type {
  Complain,
  ComplainProductDetails,
  ComplainUserDetails,
  CreateComplain,
  UpdateComplain,
} from "@/types/complain";
export type { PickOrder, PickOrderDetail } from "@/types/pick-order";

export interface OnlineFlowUser {
  id: number;
  username: string;
  full_name: string;
}

export interface OnlineFlowProcessStep {
  user: OnlineFlowUser;
  created_at: string;
}

export interface OnlineFlowOutbound {
  user: OnlineFlowUser;
  expedition: string;
  expedition_color: string;
  created_at: string;
}

export interface OnlineFlowOrder {
  tracking: string;
  order_ginee_id: string;
  complained: boolean;
  created_at: string;
}

export interface OnlineFlow {
  tracking: string;
  mb_online?: OnlineFlowProcessStep;
  qc_online?: OnlineFlowProcessStep;
  pc_online?: OnlineFlowProcessStep;
  outbound?: OnlineFlowOutbound;
  order: OnlineFlowOrder;
}

export interface OnlineFlowQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

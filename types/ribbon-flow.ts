export interface RibbonFlowUser {
  id: number;
  username: string;
  full_name: string;
}

export interface RibbonFlowProcessStep {
  user: RibbonFlowUser;
  created_at: string;
}

export interface RibbonFlowOutbound {
  user: RibbonFlowUser;
  expedition: string;
  expedition_color: string;
  created_at: string;
}

export interface RibbonFlowOrder {
  tracking: string;
  order_ginee_id: string;
  complained: boolean;
  created_at: string;
}

export interface RibbonFlow {
  tracking: string;
  mb_ribbon?: RibbonFlowProcessStep;
  qc_ribbon?: RibbonFlowProcessStep;
  outbound?: RibbonFlowOutbound;
  order: RibbonFlowOrder;
}

export interface RibbonFlowQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

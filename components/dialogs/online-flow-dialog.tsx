"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Package,
  User,
  Truck,
  CircleArrowRight,
  Clock,
  Workflow,
} from "lucide-react";
import { format } from "date-fns";
import { OnlineFlow } from "@/types/online-flow";
import { onlineFlowApi } from "@/lib/api/onlineFlowApi";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface OnlineFlowDialogProps {
  tracking: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnlineFlowDialog({
  tracking,
  open,
  onOpenChange,
}: OnlineFlowDialogProps) {
  const [onlineFlow, setOnlineFlow] = useState<OnlineFlow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOnlineFlowDetails = useCallback(async () => {
    if (!tracking) return;

    try {
      setIsLoading(true);
      // Since we don't have a getByTracking endpoint, we'll search for it
      const response = await onlineFlowApi.getOnlineFlows(1, 100, tracking);
      const onlineFlows = response.data.online_flows as OnlineFlow[];
      const foundFlow = onlineFlows.find(
        (flow: OnlineFlow) => flow.tracking === tracking
      );

      if (foundFlow) {
        setOnlineFlow(foundFlow);
      } else {
        toast.error("Online flow not found");
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to fetch online flow details");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [tracking, onOpenChange]);

  useEffect(() => {
    if (open && tracking) {
      fetchOnlineFlowDetails();
    }
  }, [open, tracking, fetchOnlineFlowDetails]);

  const ProcessStepCard = ({
    title,
    step,
    icon: Icon,
    color = "blue",
  }: {
    title: string;
    step?: { user: { full_name: string }; created_at: string };
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
  }) => (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 text-${color}-600`} />
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      {step ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {step.user.full_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {format(new Date(step.created_at), "dd MMM yyyy - HH:mm:ss")}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Not processed</div>
      )}
    </div>
  );

  if (!open || !tracking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Online Flow Details - {tracking}
          </DialogTitle>
          <Separator className="mt-2" />
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : onlineFlow ? (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Tracking Information
                </h3>
                <div className="space-y-1 rounded-md border border-border">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="max-w-1/4">Tracking</TableCell>
                        <TableCell>{onlineFlow.tracking}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="max-w-1/4">Order ID</TableCell>
                        <TableCell>{onlineFlow.order.order_ginee_id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="max-w-1/4">
                          Order Created
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(onlineFlow.order.created_at),
                            "dd MMM yyyy - HH:mm:ss"
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="max-w-1/4">Complained</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              onlineFlow.order.complained
                                ? "destructive"
                                : "default"
                            }
                            className={
                              onlineFlow.order.complained
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : "bg-green-100 text-green-800 hover:bg-green-100"
                            }
                          >
                            {onlineFlow.order.complained ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <Separator />

            {/* Process Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Process Flow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProcessStepCard
                  title="MB Online"
                  step={onlineFlow.mb_online}
                  icon={Package}
                  color="blue"
                />
                <ProcessStepCard
                  title="QC Online"
                  step={onlineFlow.qc_online}
                  icon={Package}
                  color="green"
                />
                <ProcessStepCard
                  title="PC Online"
                  step={onlineFlow.pc_online}
                  icon={Package}
                  color="purple"
                />
              </div>
            </div>

            <Separator />

            {/* Outbound Information */}
            {onlineFlow.outbound && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Outbound Information
                  </h3>
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        className="text-white font-medium"
                        style={{
                          backgroundColor: onlineFlow.outbound.expedition_color,
                        }}
                      >
                        {onlineFlow.outbound.expedition}
                      </Badge>
                    </div>
                    <div className="border border-border rounded-md">
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="max-w-1/4">
                              Processed by
                            </TableCell>
                            <TableCell>
                              {onlineFlow.outbound.user.full_name}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="max-w-1/4">
                              Processed at
                            </TableCell>
                            <TableCell>
                              {onlineFlow.outbound.created_at
                                ? format(
                                    new Date(onlineFlow.outbound.created_at),
                                    "dd MMM yyyy - HH:mm:ss"
                                  )
                                : "-"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Timeline Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Process Timeline
              </h3>
              <div className="space-y-2 border border-border rounded-md p-4">
                <div className="text-sm text-muted-foreground flex items-center">
                  <CircleArrowRight className="h-3 w-3 mr-2" />
                  Order created on{" "}
                  {format(
                    new Date(onlineFlow.order.created_at),
                    "dd MMM yyyy - HH:mm:ss"
                  )}
                </div>
                {onlineFlow.mb_online && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CircleArrowRight className="h-3 w-3 mr-2" /> MB Online
                    processed by {onlineFlow.mb_online.user.full_name} on{" "}
                    {format(
                      new Date(onlineFlow.mb_online.created_at),
                      "dd MMM yyyy - HH:mm:ss"
                    )}
                  </div>
                )}
                {onlineFlow.qc_online && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CircleArrowRight className="h-3 w-3 mr-2" /> QC Online
                    processed by {onlineFlow.qc_online.user.full_name} on{" "}
                    {format(
                      new Date(onlineFlow.qc_online.created_at),
                      "dd MMM yyyy - HH:mm:ss"
                    )}
                  </div>
                )}
                {onlineFlow.pc_online && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CircleArrowRight className="h-3 w-3 mr-2" /> PC Online
                    processed by {onlineFlow.pc_online.user.full_name} on{" "}
                    {format(
                      new Date(onlineFlow.pc_online.created_at),
                      "dd MMM yyyy - HH:mm:ss"
                    )}
                  </div>
                )}
                {onlineFlow.outbound && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CircleArrowRight className="h-3 w-3 mr-2" /> Outbound
                    processed by {onlineFlow.outbound.user.full_name} via{" "}
                    {onlineFlow.outbound.expedition} on{" "}
                    {format(
                      new Date(onlineFlow.outbound.created_at),
                      "dd MMM yyyy - HH:mm:ss"
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

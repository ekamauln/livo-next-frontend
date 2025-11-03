"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { reportApi } from "@/lib/api/reportApi";
import { UserChargeFeeReport } from "@/types/report";
import { ApiError } from "@/lib/api/types";
import { format } from "date-fns";

interface UserChargeFeeWidgetProps {
  userId: number;
}

export function UserChargeFeeWidget({ userId }: UserChargeFeeWidgetProps) {
  const [data, setData] = useState<UserChargeFeeReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleRowExpansion = (userId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Get first and last day of current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const response = await reportApi.getUserChargeFeeReports(
        1, // page
        100, // limit - get all records for current user
        format(firstDay, "yyyy-MM-dd"),
        format(lastDay, "yyyy-MM-dd"),
        userId.toString() // search by user ID
      );

      if (response.success && response.data.reports) {
        setData(response.data.reports);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching user charge fee data:", error);

      // If it's a "no records" error, just set empty data without showing error toast
      if (error instanceof ApiError) {
        // Check for "count" errors or 404 - these typically mean no data available
        const isNoDataError =
          error.message?.toLowerCase().includes("count") ||
          error.message?.toLowerCase().includes("not found") ||
          error.message?.toLowerCase().includes("no data") ||
          error.status === 404;

        if (isNoDataError) {
          console.log("No charge fee data found for user, showing empty state");
          setData([]);
          return; // Don't show error toast for no records
        }

        // For other errors, show appropriate message
        let errorMessage = "Failed to load charge fee data. Please try again.";
        if (error.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.status === 0) {
          errorMessage = "Network error. Please check your connection.";
        }

        toast.error(errorMessage);
      } else {
        // For unknown errors, set empty data
        setData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Charge Fees - Current Month</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Charge Fees - Current Month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No charge fees recorded for this month.
          </p>
        </CardContent>
      </Card>
    );
  }

  const userReport = data[0]; // Should only be one record for the logged-in user
  const complainDetails = userReport?.complain_details || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Charge Fees - Current Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/50">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Complaints
            </p>
            <p className="text-2xl font-bold">{userReport.total_complaints}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Fee Charge
            </p>
            <p className="text-2xl font-bold">
              Rp. {formatCurrency(userReport.total_fee_charge)}
            </p>
          </div>
        </div>

        {/* Expandable Details */}
        {complainDetails.length > 0 && (
          <div>
            <Button
              onClick={() => toggleRowExpansion(userReport.user_id)}
              variant="outline"
              className="w-full mb-4"
            >
              {expandedRows.has(userReport.user_id) ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Details ({complainDetails.length} complaints)
                </>
              )}
            </Button>

            {expandedRows.has(userReport.user_id) && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">No</TableHead>
                      <TableHead className="text-center">
                        Complain Code
                      </TableHead>
                      <TableHead className="text-center">Order ID</TableHead>
                      <TableHead className="text-center">Tracking</TableHead>
                      <TableHead className="text-center">Fee Charge</TableHead>
                      <TableHead className="text-center">Updated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complainDetails.map((detail, index) => (
                      <TableRow key={detail.complain_id}>
                        <TableCell className="text-center font-mono text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-center">
                          {detail.complain_code}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-center">
                          {detail.order_ginee_id}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-center">
                          {detail.tracking}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          Rp. {formatCurrency(detail.fee_charge)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground text-center">
                          {format(
                            new Date(detail.complain_updated_at),
                            "dd MMMM yyyy - HH:mm"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

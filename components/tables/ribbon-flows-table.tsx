"use client";

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { RibbonFlow } from "@/types/ribbon-flow";
import { ribbonFlowApi } from "@/lib/api/ribbonFlowApi";
import { Badge } from "@/components/ui/badge";
import { RibbonFlowDialog } from "@/components/dialogs/ribbon-flow-dialog";
import React from "react";

// Helper function to format date safely (like in orders table)
const formatDateSafely = (dateString?: string): string => {
  if (!dateString || dateString === "") {
    return "Not processed";
  }

  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Not processed";
    }
    return format(date, "dd MMM yyyy - HH:mm:ss");
  } catch {
    return "Not processed";
  }
};

export default function RibbonFlowsTable() {
  const [data, setData] = useState<RibbonFlow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    order_complained: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date(), // Today
  });

  // Dialog state
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [ribbonFlowDialogOpen, setRibbonFlowDialogOpen] = useState(false);

  // Define query params interface like orders table
  interface RibbonFlowQueryParams {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }

  // Fetch ribbon flows data (updated to match orders table structure)
  const fetchRibbonFlows = useCallback(
    async (params: RibbonFlowQueryParams = {}, search: string = "") => {
      try {
        setIsLoading(true);

        const response = await ribbonFlowApi.getRibbonFlows(
          params.page || 1,
          params.limit || 10,
          search.trim() || undefined,
          params.start_date,
          params.end_date
        );

        // Extract ribbon flows array from the response data
        const ribbonFlows = response.data.ribbon_flows as RibbonFlow[];
        setData(ribbonFlows || []); // Ensure we always set an array
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Error fetching ribbon flows:", error);
        toast.error("Failed to fetch ribbon flows", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        setData([]); // Ensure data is always an array even on error
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle search form submission (like orders table)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to page 1 when searching
    setPagination((prev) => ({ ...prev, page: 1 }));

    const params: RibbonFlowQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchRibbonFlows(params, searchQuery);
  };

  // Initial load and date range changes (like orders table)
  useEffect(() => {
    const params: RibbonFlowQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchQuery(""); // Reset search query on date/limit changes
    fetchRibbonFlows(params, ""); // Reset search on date/limit changes
  }, [dateRange, pagination.limit, fetchRibbonFlows]);

  // Pagination handlers (like orders table)
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));

    const params: RibbonFlowQueryParams = {
      page: newPage,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchRibbonFlows(params, searchQuery);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitValue = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, limit: newLimitValue, page: 1 }));

    const params: RibbonFlowQueryParams = {
      page: 1,
      limit: newLimitValue,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchRibbonFlows(params, searchQuery);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Note: The useEffect will handle the actual data fetching when dateRange changes
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const columns: ColumnDef<RibbonFlow>[] = [
    {
      accessorKey: "tracking",
      header: () => (
        <div className="text-sm text-center font-semibold">Tracking</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("tracking")}</div>
      ),
    },
    {
      accessorKey: "order.order_ginee_id",
      header: () => (
        <div className="text-sm text-center font-semibold">Order ID</div>
      ),
      cell: ({ row }) => {
        const ribbonFlow = row.original;
        return (
          <div className="font-mono text-sm">
            {ribbonFlow.order.order_ginee_id}
          </div>
        );
      },
    },
    {
      accessorKey: "order.complained",
      header: () => (
        <div className="text-sm text-center font-semibold">Complained</div>
      ),
      cell: ({ row }) => {
        const ribbonFlow = row.original;
        return (
          <div className="text-center">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                ribbonFlow.order.complained
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {ribbonFlow.order.complained ? "Yes" : "No"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "mb_ribbon",
      header: () => (
        <div className="text-sm text-center font-semibold">MB Ribbon</div>
      ),
      cell: ({ row }) => {
        const ribbonFlow = row.original;
        return (
          <div className="text-sm text-center">
            {ribbonFlow.mb_ribbon ? (
              <div>
                <div className="font-medium text-xs">
                  {ribbonFlow.mb_ribbon.user.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateSafely(ribbonFlow.mb_ribbon.created_at)}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                Not processed
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "qc_ribbon",
      header: () => (
        <div className="text-sm text-center font-semibold">QC Ribbon</div>
      ),
      cell: ({ row }) => {
        const ribbonFlow = row.original;
        return (
          <div className="text-sm text-center">
            {ribbonFlow.qc_ribbon ? (
              <div>
                <div className="font-medium text-xs">
                  {ribbonFlow.qc_ribbon.user.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateSafely(ribbonFlow.qc_ribbon.created_at)}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                Not processed
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "outbound",
      header: () => (
        <div className="text-sm text-center font-semibold">Outbound</div>
      ),
      cell: ({ row }) => {
        const ribbonFlow = row.original;
        return (
          <div className="text-sm text-center">
            {ribbonFlow.outbound ? (
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Badge
                    className="text-xs font-medium text-white"
                    style={{
                      backgroundColor: ribbonFlow.outbound.expedition_color,
                    }}
                  >
                    {ribbonFlow.outbound.expedition}
                  </Badge>
                </div>
                <div className="font-medium text-xs">
                  {ribbonFlow.outbound.user.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateSafely(ribbonFlow.outbound.created_at)}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                Not processed
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ribbonFlow = row.original;
        return (
          <div className="flex justify-end text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <RippleButton variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </RippleButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTracking(ribbonFlow.tracking);
                    setRibbonFlowDialogOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
    manualPagination: true,
    manualFiltering: true,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-end">
        {/* Column visibility */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RippleButton variant="outline" size="sm" className="ml-auto">
                Show / Hide
              </RippleButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filters */}
        <div className="flex flex-1 gap-2 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 items-center">
            <Input
              placeholder="Search ribbon flows..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-sm"
            />
          </form>
          <DateRangePicker
            date={dateRange}
            onDateChange={handleDateRangeChange}
            className="max-w-sm"
          />
        </div>
        {/* Pagination limit */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading ribbon flows...
                  </div>
                </TableCell>
              </TableRow>
            ) : (() => {
                const rows = table.getRowModel()?.rows;
                return rows && Array.isArray(rows) && rows.length > 0;
              })() ? (
              table.getRowModel().rows!.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No ribbon flows found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} ribbon flows
        </div>
        <div className="flex items-center gap-2">
          <RippleButton
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </RippleButton>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;

              if (totalPages <= 5) {
                // If total pages is 5 or less, show all pages
                pageNumber = i + 1;
              } else if (pagination.page <= 3) {
                // If current page is in first 3 pages, show 1,2,3,4,5
                pageNumber = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                // If current page is in last 3 pages, show last 5 pages
                pageNumber = totalPages - 4 + i;
              } else {
                // Otherwise, center the current page
                pageNumber = pagination.page - 2 + i;
              }

              if (pageNumber < 1 || pageNumber > totalPages) return null;

              return (
                <RippleButton
                  key={pageNumber}
                  variant={
                    pageNumber === pagination.page ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isLoading}
                  className="w-10 cursor-pointer"
                >
                  {pageNumber}
                </RippleButton>
              );
            })}
          </div>
          <RippleButton
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages || isLoading}
            className="cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </RippleButton>
        </div>
      </div>

      {/* Ribbon Flow Dialog */}
      <RibbonFlowDialog
        tracking={selectedTracking}
        open={ribbonFlowDialogOpen}
        onOpenChange={setRibbonFlowDialogOpen}
      />
    </div>
  );
}

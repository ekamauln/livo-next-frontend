"use client";

import React from "react";
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
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  User,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Order,
  OrderDetail,
  OrdersQueryParams,
  Pagination,
} from "@/types/order";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { orderApi } from "@/lib/api";
import { OrderDialog } from "@/components/dialogs/order-dialog";

// Status badge color mapping
const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "ready to pick":
      return "bg-green-500 text-white hover:bg-green-600";
    case "picking process":
      return "bg-blue-500 text-white hover:bg-blue-600";
    case "picking complete":
      return "bg-red-500 text-white hover:bg-red-600";
    default:
      return "bg-gray-500 text-white hover:bg-gray-600";
  }
};

// Order Details Component (shown when row is expanded)
interface OrderDetailsProps {
  orderDetails: OrderDetail[];
  pickedBy?: string;
  pickedAt?: string;
}

// Helper function to format picked date safely
const formatPickedDate = (pickedAt?: string): string => {
  if (!pickedAt || pickedAt === "" || pickedAt === "Not picked yet") {
    return "Not picked yet";
  }

  try {
    const date = new Date(pickedAt);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Not picked yet";
    }
    return format(date, "dd MMM yyyy, HH:mm");
  } catch {
    return "Not picked yet";
  }
};

function OrderDetailsRow({
  orderDetails,
  pickedBy,
  pickedAt,
}: OrderDetailsProps) {
  return (
    <div className="p-4 bg-muted/30 border-t">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Order Details ({orderDetails.length} items)
        </h4>
        <div className="grid gap-2">
          {orderDetails.map((detail, index) => (
            <Card key={detail.id || index} className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">
                    SKU:
                  </span>
                  <p className="font-mono text-xs">{detail.sku || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-muted-foreground">
                    Product:
                  </span>
                  <p className="font-medium truncate">{detail.product_name}</p>
                  {detail.variant && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {detail.variant}
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Quantity:
                  </span>
                  <p className="font-bold text-primary">
                    {detail.quantity || 0}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Picked Information */}
        {(pickedBy || pickedAt) && (
          <div className="mt-4 pt-4 border-t border-muted">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {pickedBy && (
                <Card className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Picked by:
                      </span>
                      <p className="font-medium">
                        {pickedBy === "Not picked yet" ||
                        !pickedBy ||
                        pickedBy === ""
                          ? "Not picked yet"
                          : pickedBy}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {pickedAt && (
                // <div className="flex items-center gap-2">
                <Card className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Picked at:
                      </span>
                      <p className="font-medium">
                        {formatPickedDate(pickedAt)}
                      </p>
                    </div>
                  </div>
                </Card>
                // </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersTable() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
    courier: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date(), // Today
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDialogTab, setOrderDialogTab] = useState<
    "details" | "edit" | "add"
  >("details");

  // Order dialog handlers
  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDialogTab("details");
    setOrderDialogOpen(true);
  };

  const handleEditDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDialogTab("edit");
    setOrderDialogOpen(true);
  };

  const handleAddDetail = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDialogTab("add");
    setOrderDialogOpen(true);
  };

  const handleOrderUpdate = () => {
    // Refresh the orders table when order is updated
    const params: OrdersQueryParams = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  // Fetch orders data
  const fetchOrders = useCallback(
    async (params: OrdersQueryParams = {}, search: string = "") => {
      try {
        setLoading(true);

        const response = await orderApi.getOrders(
          params.page || 1,
          params.limit || 10,
          search.trim() || undefined,
          params.start_date,
          params.end_date
        );

        // The response.data contains orders and pagination from PaginatedResponse
        setData(response.data.orders as Order[]);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        setData([]);
        setPagination((prev: Pagination) => ({ ...prev, total: 0 }));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to page 1 when searching
    setPagination((prev: Pagination) => ({ ...prev, page: 1 }));

    const params: OrdersQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  // Initial load and date range changes
  useEffect(() => {
    const params: OrdersQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    setPagination((prev: Pagination) => ({ ...prev, page: 1 }));
    setSearchQuery(""); // Reset search query on date/limit changes
    fetchOrders(params, ""); // Reset search on date/limit changes
  }, [dateRange, pagination.limit, fetchOrders]);

  // Table columns definition
  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        id: "expander",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const orderId = row.original.id.toString();
              setExpandedRows((prev) => ({
                ...prev,
                [orderId]: !prev[orderId],
              }));
            }}
            className="p-1 h-6 w-6"
          >
            {expandedRows[row.original.id.toString()] ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        ),
        size: 40,
      },
      {
        accessorKey: "order_id",
        header: () => (
          <div className="text-sm text-center font-semibold">Order ID</div>
        ),
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue("order_id")}</div>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="text-sm text-center font-semibold">Status</div>
        ),
        cell: ({ row }) => (
          <div className="text-center text-sm">
            <Badge
              variant="default"
              className={getStatusBadgeStyle(row.getValue("status"))}
            >
              {row.getValue("status")}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "store",
        header: () => (
          <div className="text-sm text-center font-semibold">Store</div>
        ),
        cell: ({ row }) => (
          <div className="max-w-32 truncate">
            {row.getValue("store") || "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "courier",
        header: () => (
          <div className="text-sm text-center font-semibold">Courier</div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <div>{row.getValue("courier") || "N/A"}</div>
          </div>
        ),
      },
      {
        accessorKey: "tracking",
        header: () => (
          <div className="text-sm text-center font-semibold">Tracking</div>
        ),
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            {row.getValue("tracking") || "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: () => (
          <div className="text-sm text-center font-semibold">Created</div>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("created_at"));
          return (
            <div className="text-xs text-muted-foreground text-center">
              {format(date, "dd MMM yyyy")}
              <br />
              {format(date, "HH:mm:ss")}
            </div>
          );
        },
      },
      {
        accessorKey: "updated_at",
        header: () => (
          <div className="text-sm text-center font-semibold">Updated</div>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("updated_at"));
          return (
            <div className="text-xs text-muted-foreground text-center">
              {format(date, "dd MMM yyyy")}
              <br />
              {format(date, "HH:mm:ss")}
            </div>
          );
        },
      },
      {
        id: "items_count",
        header: () => (
          <div className="text-sm text-center font-semibold">Items</div>
        ),
        cell: ({ row }) => (
          <div className="text-center text-sm">
            <Badge variant="outline">{row.original.order_details.length}</Badge>
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" forceMount>
                  <DropdownMenuItem
                    onClick={() => handleViewDetails(order.id)}
                    className="cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleEditDetails(order.id)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleAddDetail(order.id)}
                    className="cursor-pointer"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add Detail
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 80,
      },
    ],
    [expandedRows]
  );

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
    manualPagination: true, // Since we're handling pagination server-side
    manualFiltering: true, // Since we're handling search server-side
  });

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination((prev: Pagination) => ({ ...prev, page: newPage }));

    const params: OrdersQueryParams = {
      page: newPage,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitValue = parseInt(newLimit);
    setPagination((prev: Pagination) => ({
      ...prev,
      limit: newLimitValue,
      page: 1,
    }));

    const params: OrdersQueryParams = {
      page: 1,
      limit: newLimitValue,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchOrders(params, searchQuery);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 items-center">
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-sm"
            />
          </form>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            className="w-auto"
          />
        </div>
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading orders...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
                  {expandedRows[row.original.id.toString()] && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-0">
                        <OrderDetailsRow
                          orderDetails={row.original.order_details}
                          pickedBy={row.original.picked_by}
                          pickedAt={row.original.picked_at}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No orders found.
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
          {pagination.total} orders
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
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
                <Button
                  key={pageNumber}
                  variant={
                    pageNumber === pagination.page ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={loading}
                  className="w-10 cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages || loading}
            className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Order Dialog */}
      <OrderDialog
        orderId={selectedOrderId}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        initialTab={orderDialogTab}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
}

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
  ChevronDown,
  MoreHorizontal,
  Eye,
  PackagePlus,
  SquarePen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Return } from "@/types/return";
import { returnApi } from "@/lib/api/returnApi";
import { ApiError } from "@/lib/api/types";
import { ReturnCreateDialog } from "@/components/dialogs/return-create-dialog";
import { ReturnDialog } from "@/components/dialogs/return-dialog";
import React from "react";

export default function ReturnsTable() {
  const [data, setData] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
    old_tracking: false,
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Dialog state
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<
    "detail" | "edit-data" | "edit-admin"
  >("detail");

  // Toggle row expansion
  const toggleRowExpansion = (rowId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Fetch returns data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);

        // Build date parameters
        const start_date = dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined;
        const end_date = dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : undefined;

        const response = await returnApi.getReturns(
          page,
          pagination.limit,
          search,
          start_date,
          end_date
        );
        // Extract return array from the response data
        const returns = response.data.returns as Return[];
        setData(returns);
        setPagination(response.data.pagination);
      } catch (error) {
        // Only log unexpected errors to console to reduce noise
        if (error instanceof ApiError) {
          if (error.status >= 500 || error.status === 0) {
            console.error("Server/Network error fetching returns:", error);
          } else {
            console.debug(
              "Client error fetching returns:",
              error.message,
              "Status:",
              error.status
            );
          }
        } else {
          console.error("Unexpected error fetching returns:", error);
        }

        let errorMessage = "Failed to fetch returns. Please try again.";

        if (error instanceof ApiError) {
          if (error.status === 401) {
            errorMessage = "Session expired. Please login again.";
          } else if (error.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (error.status === 0) {
            errorMessage = "Network error. Please check your connection.";
          }
        }

        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, dateRange]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchData(newPage, searchQuery);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitValue = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, limit: newLimitValue, page: 1 }));
    fetchData(1, searchQuery);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Render expanded row content
  const renderExpandedContent = (returnData: Return) => {
    const details = returnData.return_details || returnData.details || [];

    if (details.length === 0) {
      return null;
    }

    return (
      <div>
        <div className="p-4 bg-muted/30">
          {/* Return Reason */}
          {returnData.return_reason && (
            <div className="border rounded-md">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Return Number</TableCell>
                    <TableCell>{returnData.return_number || "NA"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Scrap Number</TableCell>
                    <TableCell>{returnData.scrap_number || "NA"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Return Reason</TableCell>
                    <TableCell className="break-words whitespace-normal max-w-md">
                      {returnData.return_reason || "NA"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-3 pt-3 border-t">
            <h4 className="text-sm font-semibold mb-3">Return Details</h4>
            <div className="space-y-3">
              {details.map((detail) => (
                <div
                  key={detail.id}
                  className="border rounded-lg p-4 bg-background"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {detail.product?.image && (
                      <div className="flex-shrink-0">
                        <Image
                          src={detail.product.image}
                          alt={detail.product.name || "Product"}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder.png";
                          }}
                        />
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">
                            {detail.product?.name ||
                              `Product ID: ${detail.product_id}`}
                          </div>
                          {detail.product?.sku && (
                            <div className="text-xs text-muted-foreground font-mono">
                              SKU: {detail.product.sku}
                            </div>
                          )}
                          {detail.product?.variant &&
                            detail.product.variant !== "-" && (
                              <div className="text-xs text-muted-foreground">
                                Variant: {detail.product.variant}
                              </div>
                            )}
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          Qty: {detail.quantity}
                        </Badge>
                      </div>

                      {detail.product?.location && (
                        <div className="text-xs text-muted-foreground">
                          Location: {detail.product.location}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Added:{" "}
                        {format(
                          new Date(detail.created_at),
                          "dd MMM yyyy HH:mm"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {details.length > 0 && (
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              Total items:{" "}
              {details.reduce((sum, detail) => sum + detail.quantity, 0)} in{" "}
              {details.length} product{details.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>
    );
  };

  const columns: ColumnDef<Return>[] = [
    {
      id: "expand",
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const returnData = row.original;
        const details = returnData.return_details || returnData.details || [];
        const hasDetails = details.length > 0;
        const isExpanded = expandedRows.has(returnData.id);

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <RippleButton
              onClick={() => toggleRowExpansion(returnData.id)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </RippleButton>
          </div>
        );
      },
    },
    {
      accessorKey: "id",
      header: () => <div className="text-sm text-center font-semibold">ID</div>,
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("id")}
        </div>
      ),
    },
    {
      accessorKey: "new_tracking",
      header: () => (
        <div className="text-sm text-center font-semibold">New Tracking</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("new_tracking")}</div>
      ),
    },
    {
      accessorKey: "old_tracking",
      header: () => (
        <div className="text-sm text-center font-semibold">Old Tracking</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue("old_tracking") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "order_id",
      header: () => (
        <div className="text-sm text-center font-semibold">Order ID</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue("order_id") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "channel_id",
      header: () => (
        <div className="text-sm text-center font-semibold">Channel</div>
      ),
      cell: ({ row }) => {
        const returnData = row.original;
        return (
          <div className="text-sm">
            {returnData.channel ? (
              <div className="text-center">
                <div className="font-medium">{returnData.channel.name}</div>
                <div className="text-xs text-muted-foreground">
                  {returnData.channel.code}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                ID: {row.getValue("channel_id")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "store_id",
      header: () => (
        <div className="text-sm text-center font-semibold">Store</div>
      ),
      cell: ({ row }) => {
        const returnData = row.original;
        return (
          <div className="text-sm">
            {returnData.store ? (
              <div className="text-center">
                <div className="font-medium">{returnData.store.name}</div>
                <div className="text-xs text-muted-foreground">
                  {returnData.store.code}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                ID: {row.getValue("store_id")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "return_type",
      header: () => (
        <div className="text-sm text-center font-semibold">Return Type</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">
          {row.getValue("return_type") || "-"}
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
      header: () => <div className="text-sm font-semibold">Updated</div>,
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
      id: "actions",
      cell: ({ row }) => {
        const returnData = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <RippleButton variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </RippleButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedReturnId(returnData.id);
                    setDialogTab("detail");
                    setReturnDialogOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedReturnId(returnData.id);
                    setDialogTab("edit-data");
                    setReturnDialogOpen(true);
                  }}
                >
                  <SquarePen className="mr-2 h-4 w-4" />
                  Input Data Return
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedReturnId(returnData.id);
                    setDialogTab("edit-admin");
                    setReturnDialogOpen(true);
                  }}
                >
                  <SquarePen className="mr-2 h-4 w-4" />
                  Input Data Admin Return
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
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex justify-start gap-2">
          {/* Filters */}
          <div className="flex flex-1 gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 items-center">
              <Input
                placeholder="Search returns..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>

          {/* Date Range Picker */}
          <div className="flex flex-1 gap-2 items-center">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-auto"
            />
          </div>
        </div>

        <div className="flex justify-start gap-2">
          {/* Create New User Button */}
          <RippleButton
            variant="default"
            size="sm"
            className="cursor-pointer rounded-md"
            onClick={() => setCreateDialogOpen(true)}
          >
            <div className="flex items-center gap-2 justify-center">
              <PackagePlus className="w-4 h-4" /> <span>Create New Return</span>
            </div>
          </RippleButton>

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
                    Loading returns...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const returnData = row.original;
                const isExpanded = expandedRows.has(returnData.id);

                return (
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
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
                          {renderExpandedContent(returnData)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No returns found.
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
          {pagination.total} returns
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            className="cursor-pointer"
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
                  disabled={isLoading}
                  className="w-10 cursor-pointer"
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
            disabled={pagination.page >= totalPages || isLoading}
            className="cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Return Dialog */}
      <ReturnDialog
        returnId={selectedReturnId}
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        initialTab={dialogTab}
        onReturnUpdate={() => {
          // Refresh the data to show any updates
          fetchData(pagination.page, searchQuery);
        }}
      />

      {/* Create Return Dialog */}
      <ReturnCreateDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onReturnCreated={() => {
          // Refresh the data to show the new return
          fetchData(pagination.page, searchQuery);
        }}
      />
    </div>
  );
}

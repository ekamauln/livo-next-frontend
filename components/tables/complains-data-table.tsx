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
import { Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Complain } from "@/types/complain";
import { complainApi } from "@/lib/api/complainApi";
import { ApiError } from "@/lib/api/types";
import React from "react";

export default function ComplainsTable() {
  const [data, setData] = useState<Complain[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [updatingComplains, setUpdatingComplains] = useState<Set<number>>(
    new Set()
  );

  // Format number with thousand dot separator
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
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

  // Fetch complains data
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

        const response = await complainApi.getComplains(
          page,
          pagination.limit,
          search,
          start_date,
          end_date
        );
        // Extract complain array from the response data
        const complains = response.data.complains as Complain[];
        setData(complains);
        setPagination(response.data.pagination);
      } catch (error) {
        // Only log unexpected errors to console to reduce noise
        if (error instanceof ApiError) {
          if (error.status >= 500 || error.status === 0) {
            console.error("Server/Network error fetching complains:", error);
          } else {
            console.debug(
              "Client error fetching complains:",
              error.message,
              "Status:",
              error.status
            );
          }
        } else {
          console.error("Unexpected error fetching complains:", error);
        }

        let errorMessage = "Failed to fetch complains. Please try again.";

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

  // Handle complain check/uncheck
  const handleComplainCheck = async (complainId: number, checked: boolean) => {
    try {
      setUpdatingComplains((prev) => new Set(prev).add(complainId));

      const result = await complainApi.checkComplain(complainId, checked);

      if (result.success) {
        // Update the local data to reflect the change
        setData((prevData) =>
          prevData.map((complain) =>
            complain.id === complainId
              ? { ...complain, checked: checked }
              : complain
          )
        );

        toast.success(
          `Complain ${checked ? "checked" : "unchecked"} successfully`
        );
      } else {
        throw new Error(result.message || "Failed to update complain status");
      }
    } catch (error) {
      console.error("Error updating complain check status:", error);

      let errorMessage = "Failed to update complain status. Please try again.";

      if (error instanceof ApiError) {
        if (error.status === 400) {
          errorMessage = `Validation error: ${
            error.message || "Invalid request data"
          }`;
        } else if (error.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error.status === 422) {
          errorMessage = `Validation failed: ${
            error.message || "Invalid data provided"
          }`;
        } else if (error.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.status === 0) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setUpdatingComplains((prev) => {
        const newSet = new Set(prev);
        newSet.delete(complainId);
        return newSet;
      });
    }
  };

  // Render expanded row content
  const renderExpandedContent = (complain: Complain) => {
    const product_details = complain.product_details || [];
    const user_details = complain.user_details || [];

    if (product_details.length === 0 && user_details.length === 0) {
      return null;
    }

    return (
      <div>
        <div className="p-4 bg-muted/30">
          {/* Complain description */}
          {complain.description && (
            <div className="border rounded-md">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1/4 font-semibold">
                      Description
                    </TableCell>
                    <TableCell className="break-words whitespace-normal max-w-md">
                      {complain.description || "NA"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/4 font-semibold">
                      Solution
                    </TableCell>
                    <TableCell className="break-words whitespace-normal max-w-md">
                      {complain.solution || "NA"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-3 pt-3 border-t">
            <h4 className="text-sm font-semibold mb-3">
              Complain Product Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {product_details.map((detail) => (
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
                          <div
                            className="font-medium text-sm text-wrap w-md"
                            title={
                              detail.product?.name ||
                              `Product ID: ${detail.product_id}`
                            }
                          >
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

          <div className="mt-3 pt-3 border-t">
            <h4 className="text-sm font-semibold mb-3">
              Complain User Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {user_details.map((detail) => (
                <div
                  key={detail.id}
                  className="border rounded-lg p-4 bg-background"
                >
                  <div className="flex gap-4">
                    {/* Product Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">
                            {detail.user?.full_name ||
                              `User ID: ${detail.user_id}`}
                          </div>
                          {detail.user?.username && (
                            <div className="text-xs text-muted-foreground font-mono">
                              Username: {detail.user.username}
                            </div>
                          )}
                          {detail.user?.roles &&
                            detail.user.roles.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Roles:{" "}
                                {detail.user.roles
                                  .map((role) => role.name)
                                  .join(", ")}
                              </div>
                            )}
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          Personal Cut: Rp.{" "}
                          {formatCurrency(detail.fee_charge || 0)}
                        </Badge>
                      </div>

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

          {product_details.length > 0 && (
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              Total items:{" "}
              {product_details.reduce(
                (sum, detail) => sum + detail.quantity,
                0
              )}{" "}
              in {product_details.length} product
              {product_details.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>
    );
  };

  const columns: ColumnDef<Complain>[] = [
    {
      id: "checked",
      cell: ({ row }) => {
        const complain = row.original;
        const isUpdating = updatingComplains.has(complain.id);

        return (
          <div className="flex justify-center">
            <Checkbox
              checked={complain.checked}
              disabled={isUpdating}
              onCheckedChange={(checked) => {
                if (typeof checked === "boolean") {
                  handleComplainCheck(complain.id, checked);
                }
              }}
              className="cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        );
      },
    },
    {
      id: "expand",
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const complain = row.original;
        const product_details = complain.product_details || [];
        const user_details = complain.user_details || [];
        const hasDetails =
          product_details.length > 0 || user_details.length > 0;
        const isExpanded = expandedRows.has(complain.id);

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <Button
              onClick={() => toggleRowExpansion(complain.id)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
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
      accessorKey: "tracking",
      header: () => (
        <div className="text-sm text-center font-semibold">Tracking</div>
      ),
      cell: ({ row }) => {
        const complain = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm">{row.getValue("tracking")}</div>
            {complain.checked && (
              <Badge variant="default" className="text-xs px-1 py-0">
                ✓
              </Badge>
            )}
          </div>
        );
      },
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
      accessorKey: "user_id",
      header: () => (
        <div className="text-sm text-center font-semibold">Creator</div>
      ),
      cell: ({ row }) => {
        const complain = row.original;
        return (
          <div className="text-sm">
            {complain.creator ? (
              <div className="text-center">
                <div className="font-medium">{complain.creator.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {complain.creator.username}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                ID: {row.getValue("user_id")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "channel_id",
      header: () => (
        <div className="text-sm text-center font-semibold">Channel</div>
      ),
      cell: ({ row }) => {
        const complain = row.original;
        return (
          <div className="text-sm">
            {complain.channel ? (
              <div className="text-center">
                <div className="font-medium">{complain.channel.name}</div>
                <div className="text-xs text-muted-foreground">
                  {complain.channel.code}
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
        const complain = row.original;
        return (
          <div className="text-sm">
            {complain.store ? (
              <div className="text-center">
                <div className="font-medium">{complain.store.name}</div>
                <div className="text-xs text-muted-foreground">
                  {complain.store.code}
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
      accessorKey: "total_fee",
      header: () => (
        <div className="text-sm text-center font-semibold">Cutting Total</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          Rp. {formatCurrency(row.getValue("total_fee") || 0)}
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
        <div className="flex justify-start gap-2 items-center">
          {/* Filters */}
          <div className="flex justify-start gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 items-center">
              <Input
                placeholder="Search complains..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>

          {/* Date Range Picker */}
          <div className="flex justify-start gap-2 items-center">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-auto"
            />
          </div>
        </div>

        <div className="flex justify-start gap-2 items-center">
          {/* Pagination limit */}
          <div className="flex justify-start items-center gap-2">
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
          <div className="flex justify-start items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Show / Hide
                </Button>
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
                    Loading complains...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const complain = row.original;
                const isExpanded = expandedRows.has(complain.id);

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
                          {renderExpandedContent(complain)}
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
                  No complains found.
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
          {pagination.total} complains
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
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
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages || isLoading}
            className="cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

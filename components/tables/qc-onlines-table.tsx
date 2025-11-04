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
import { format } from "date-fns";
import { QcOnline } from "@/types/qc-online";
import { qcOnlineApi } from "@/lib/api/qcOnlineApi";
import { ApiError } from "@/lib/api/types";
import React from "react";
import { Separator } from "@/components/ui/separator";
import { QcOnlineForm } from "@/components/forms/qc-online-form";
import { QcOnlineStatus } from "@/components/status/qc-online-status";
import { Badge } from "@/components/ui/badge";

export default function QcOnlinesTable() {
  const [data, setData] = useState<QcOnline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
    complained: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
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

  // Fetch qc-onlines data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);
        const response = await qcOnlineApi.getQcOnlines(
          page,
          pagination.limit,
          search
        );
        // Extract qc-onlines array from the response data
        const qcOnlines = response.data.qc_onlines as QcOnline[];
        setData(qcOnlines);
        setPagination(response.data.pagination);
      } catch (error) {
        // Only log unexpected errors to console to reduce noise
        if (error instanceof ApiError) {
          if (error.status >= 500 || error.status === 0) {
            console.error("Server/Network error fetching qc-onlines:", error);
          } else {
            console.debug(
              "Client error fetching qc-onlines:",
              error.message,
              "Status:",
              error.status
            );
          }
        } else {
          console.error("Unexpected error fetching qc-onlines:", error);
        }

        let errorMessage = "Failed to fetch qc-onlines. Please try again.";

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
    [pagination.limit]
  );

  const handleQcOnlineCreated = () => {
    // Refresh the data after creating a new qc-online
    fetchData(pagination.page, searchQuery);
  };

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
  const renderExpandedContent = (qcOnline: QcOnline) => {
    if (!qcOnline.details || qcOnline.details.length === 0) {
      return null;
    }

    return (
      <div className="p-4 bg-muted/30">
        <h4 className="text-sm font-semibold mb-3">QC Online Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qcOnline.details.map((detail) => (
            <div
              key={detail.id}
              className="border rounded-lg p-3 bg-background"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium">
                  Box: {detail.box.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  #{detail.box.code}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Quantity:{" "}
                <span className="font-mono font-medium">{detail.quantity}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Added:{" "}
                {format(new Date(detail.created_at), "dd MMM yyyy HH:mm")}
              </div>
            </div>
          ))}
        </div>
        {qcOnline.details.length > 0 && (
          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
            Total items:{" "}
            {qcOnline.details.reduce((sum, detail) => sum + detail.quantity, 0)}{" "}
            in {qcOnline.details.length} box
            {qcOnline.details.length === 1 ? "" : "es"}
          </div>
        )}
      </div>
    );
  };

  const columns: ColumnDef<QcOnline>[] = [
    {
      id: "expand",
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const qcOnline = row.original;
        const hasDetails = qcOnline.details && qcOnline.details.length > 0;
        const isExpanded = expandedRows.has(qcOnline.id);

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <Button
              onClick={() => toggleRowExpansion(qcOnline.id)}
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
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("tracking")}
        </div>
      ),
    },
    {
      accessorKey: "order",
      header: () => (
        <div className="text-sm text-center font-semibold">Order Info</div>
      ),
      cell: ({ row }) => {
        const order = row.original.order;
        return (
          <div className="text-sm text-center">
            {order ? (
              <div>
                <div className="font-mono text-xs">{order.order_id}</div>
                <div className="text-xs text-muted-foreground">
                  <Badge>{order.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.store}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">No order</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: () => (
        <div className="text-sm text-center font-semibold">User</div>
      ),
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="text-sm text-center">
            {user ? (
              <div>
                <div className="font-medium">{user.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  @{user.username}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">No user</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "complained",
      header: () => (
        <div className="text-sm text-center font-semibold">Complained</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              row.getValue("complained")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {row.getValue("complained") ? "Yes" : "No"}
          </span>
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
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2 flex flex-col border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Create QC-Online</h3>
          <Separator className="mt-0 mb-6" />
          <QcOnlineForm onQcOnlineCreated={handleQcOnlineCreated} />
        </div>
        <div className="col-span-2 flex flex-col border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">QC-Online Status</h3>
          <Separator className="mt-0 mb-6" />
          <QcOnlineStatus totalRecords={pagination.total} target={3000} />
        </div>
      </div>
      <Separator className="mt-0" />
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex justify-start items-center gap-2">
          {/* Filters */}
          <div className="flex justify-start items-center gap-2">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 gap-2 items-center"
            >
              <Input
                placeholder="Search qc-onlines..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>
        </div>

        <div className="flex justify-start items-center gap-2">
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
                    Loading qc-ribbons...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const qcRibbon = row.original;
                const isExpanded = expandedRows.has(qcRibbon.id);

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
                          {renderExpandedContent(qcRibbon)}
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
                  No qc-ribbons found.
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
          {pagination.total} qc-ribbons
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

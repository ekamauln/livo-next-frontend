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
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { MbRibbon } from "@/types/mb-ribbon";
import { mbRibbonApi } from "@/lib/api/mbRibbonApi";
import { MbRibbonForm } from "@/components/forms/mb-ribbon-form";
import { MbRibbonStatus } from "@/components/status/mb-ribbon-status";
import React from "react";
import { Separator } from "../ui/separator";

export default function MbRibbonsTable() {
  const [data, setData] = useState<MbRibbon[]>([]);
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
  const [isFormFocusTrapped, setIsFormFocusTrapped] = useState(false);

  // Fetch mb-ribbons data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);
        const response = await mbRibbonApi.getMbRibbons(
          page,
          pagination.limit,
          search
        );
        // Extract mb-ribbons array from the response data
        const mbRibbons = response.data.mb_ribbons as MbRibbon[];
        setData(mbRibbons);
        setPagination(response.data.pagination);
      } catch {
        toast.error("Failed to fetch mb-ribbons. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit]
  );

  const handleMbRibbonCreated = () => {
    // Refresh the data after creating a new mb-ribbon
    fetchData(pagination.page, searchQuery);
  };

  const handleFormFocusTrapActivate = () => {
    setIsFormFocusTrapped(true);
  };

  const handleFormFocusTrapDeactivate = () => {
    setIsFormFocusTrapped(false);
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

  const columns: ColumnDef<MbRibbon>[] = [
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
        <div className="font-mono text-sm">{row.getValue("tracking")}</div>
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
          <div className="text-sm">
            {order ? (
              <div>
                <div className="font-mono text-xs">{order.order_id}</div>
                <div className="text-xs text-muted-foreground">
                  {order.status}
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
          <div className="text-sm">
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
        <div
          className={`col-span-2 flex flex-col border p-4 rounded-md transition-all duration-200 ${
            isFormFocusTrapped
              ? "border-accent shadow-lg ring-2 ring-accent"
              : "border-border hover:border-accent"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">
            Create MB-Ribbon
            {isFormFocusTrapped && (
              <span className="ml-2 text-sm text-primary font-normal">
                (Focus Active)
              </span>
            )}
          </h3>
          <Separator className="mt-0 mb-6" />
          <MbRibbonForm
            onMbRibbonCreated={handleMbRibbonCreated}
            focusTrapActive={isFormFocusTrapped}
            onFocusTrapActivate={handleFormFocusTrapActivate}
            onFocusTrapDeactivate={handleFormFocusTrapDeactivate}
          />
        </div>
        <div className="col-span-2 flex flex-col border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">MB-Ribbon Status</h3>
          <Separator className="mt-0 mb-6" />
          <MbRibbonStatus totalRecords={pagination.total} target={3000} />
        </div>
      </div>
      <Separator className="mt-0" />
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filters */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 gap-2 items-center"
        >
          <Input
            placeholder="Search mb-ribbons..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="max-w-sm"
          />
        </form>
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
                    Loading mb-ribbons...
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
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No mb-ribbons found.
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
          {pagination.total} mb-ribbons
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
    </div>
  );
}

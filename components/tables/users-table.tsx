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
  Edit,
  KeyRound,
  BookUser,
  Zap,
  ZapOff,
  UserPlus,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { User, Role } from "@/types/auth";
import { adminApi } from "@/lib/api";
import { UserCreateDialog } from "@/components/dialogs/user-create-dialog";
import { UserDialog } from "@/components/dialogs/user-dialog";
import React from "react";

export default function UsersTable() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Dialog State
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<
    "detail" | "profile" | "password" | "status" | "role"
  >("detail");

  // Fetch users data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);
        const response = await adminApi.getUsers(
          page,
          pagination.limit,
          search
        );
        // Extract users array from the response data
        const users = response.data.users as User[];
        setData(users);
        setPagination(response.data.pagination);
      } catch {
        toast.error("Failed to fetch users. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit]
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

  const columns: ColumnDef<User>[] = [
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
      accessorKey: "username",
      header: () => (
        <div className="text-sm text-center font-semibold">Username</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("username")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: () => (
        <div className="text-sm text-center font-semibold">Email</div>
      ),
      cell: ({ row }) => <div className="text-sm">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "full_name",
      header: () => (
        <div className="text-sm text-center font-semibold">Name</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("full_name")}</div>
      ),
    },
    {
      accessorKey: "is_active",
      header: () => (
        <div className="text-sm text-center font-semibold">Status</div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {row.getValue("is_active") ? (
            <Zap className="w-4 h-4 text-primary" />
          ) : (
            <ZapOff className="w-4 h-4 text-destructive" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "roles",
      header: () => <div className="text-center font-semibold">Roles</div>,
      cell: ({ row }) => {
        const roles = row.getValue("roles") as Role[];
        return (
          <div className="flex gap-1 flex-wrap text-wrap">
            {roles.map((role) => (
              <Badge key={role.id} variant="outline" className="text-xs">
                {role.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: () => <div className="text-center font-semibold">Created</div>,
      cell: ({ row }) => (
        <div className="text-sm text-center">
          {format(new Date(row.getValue("created_at")), "dd MMM yyyy")}
          <br />
          {format(new Date(row.getValue("created_at")), "HH:mm:ss")}
        </div>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.getValue("updated_at")), "dd MMM yyyy")}
          <br />
          {format(new Date(row.getValue("updated_at")), "HH:mm:ss")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
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
                    setSelectedUserId(user.id);
                    setDialogTab("detail");
                    setUserDialogOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("profile");
                    setUserDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("role");
                    setUserDialogOpen(true);
                  }}
                >
                  <BookUser className="mr-2 h-4 w-4" />
                  Manage Roles
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDialogTab("password");
                    setUserDialogOpen(true);
                  }}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
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
        {/* Create New User Button */}
        <RippleButton
          variant="default"
          size="sm"
          className="cursor-pointer rounded-md"
          onClick={() => setCreateDialogOpen(true)}
        >
          <div className="flex items-center gap-2 justify-center">
            <UserPlus className="w-4 h-4" /> <span>Create New User</span>
          </div>
        </RippleButton>
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
        <form
          onSubmit={handleSearch}
          className="flex flex-1 gap-2 items-center"
        >
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="max-w-sm"
          />
        </form>
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
                    Loading users...
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
                  No users found.
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
          {pagination.total} users
        </div>
        <div className="flex items-center gap-2">
          <RippleButton
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
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
            className="cursor-pointer hover:translate-y-[-4px] transition duration-300 ease-in-out"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </RippleButton>
        </div>
      </div>

      {/* User Dialog */}
      <UserDialog
        userId={selectedUserId}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        initialTab={dialogTab}
        onUserUpdate={() => {
          // Refresh the data to show any updates
          fetchData(pagination.page, searchQuery);
        }}
      />

      {/* Create User Dialog */}
      <UserCreateDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={(user) => {
          // Refresh the data to show the new user
          fetchData(pagination.page, searchQuery);
          toast.success(`User ${user.username} created successfully!`);
        }}
      />
    </div>
  );
}

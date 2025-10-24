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
  PackageOpen,
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
import { Product } from "@/types/product";
import { productApi } from "@/lib/api/productApi";
import { ProductCreateDialog } from "@/components/dialogs/product-create-dialog";
import { ProductDialog } from "@/components/dialogs/product-dialog";
import React from "react";
import Image from "next/image";

export default function ProductsTable() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
    barcode: false,
    location: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Dialog State
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<
    "detail" | "profile" | "barcode1d" | "barcode2d"
  >("detail");

  // Fetch products data
  const fetchData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setIsLoading(true);
        const response = await productApi.getProducts(
          page,
          pagination.limit,
          search
        );
        // Extract products array from the response data
        const products = response.data.products as Product[];
        setData(products);
        setPagination(response.data.pagination);
      } catch {
        toast.error("Failed to fetch products. Please try again.");
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

  const columns: ColumnDef<Product>[] = [
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
      accessorKey: "image",
      header: () => (
        <div className="flex justify-center items-center">Image</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center items-center">
          <Image
            width={32}
            height={32}
            src={row.getValue("image")}
            alt={row.getValue("name")}
            className="h-8 w-8 rounded"
          />
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: () => (
        <div className="text-sm text-center font-semibold">SKU</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("sku")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: () => (
        <div className="text-sm text-center font-semibold min-w-[300px] max-w-[500px]">
          Name
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm min-w-[300px] max-w-[500px] text-wrap">
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "variant",
      header: () => (
        <div className="text-sm text-center font-semibold">Variant</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          <Badge variant="secondary">{row.getValue("variant")}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: () => (
        <div className="text-sm text-center font-semibold">Location</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("location")}</div>
      ),
    },
    {
      accessorKey: "barcode",
      header: () => (
        <div className="text-sm text-center font-semibold">Barcode</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("barcode")}</div>
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
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
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
                    setSelectedProductId(product.id);
                    setDialogTab("detail");
                    setProductDialogOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setDialogTab("profile");
                    setProductDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setDialogTab("barcode1d");
                    setProductDialogOpen(true);
                  }}
                >
                  <BookUser className="mr-2 h-4 w-4" />
                  Generate 1D Barcode
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setDialogTab("barcode2d");
                    setProductDialogOpen(true);
                  }}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Generate 2D Barcode
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
        <div className="flex justify-start gap-2 items-center">
          {/* Filters */}
          <div className="flex justify-start gap-2 items-center">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 gap-2 items-center"
            >
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>
        </div>

        <div className="flex justify-start items-center gap-2">
          {/* Create New Product Button */}
          <div className="flex items-center justify-start gap-2">
            <RippleButton
              variant="default"
              size="sm"
              className="cursor-pointer rounded-md"
              onClick={() => setCreateDialogOpen(true)}
            >
              <div className="flex items-center gap-2 justify-center">
                <PackageOpen className="w-4 h-4" />{" "}
                <span>Create New Product</span>
              </div>
            </RippleButton>
          </div>

          {/* Pagination limit */}
          <div className="flex items-center justify-start gap-2">
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
          <div className="flex items-center justify-start gap-2">
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
                    Loading products...
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
                  No products found.
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
          {pagination.total} products
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

      {/* Product Dialog */}
      <ProductDialog
        productId={selectedProductId}
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        initialTab={dialogTab}
        onProductUpdate={() => {
          // Refresh the data to show any updates
          fetchData(pagination.page, searchQuery);
        }}
      />

      {/* Create Product Dialog */}
      <ProductCreateDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProductCreated={(product) => {
          // Refresh the data to show the new product
          fetchData(pagination.page, searchQuery);
          toast.success(`Product ${product.name} created successfully!`);
        }}
      />
    </div>
  );
}

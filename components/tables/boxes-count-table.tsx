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
import { Loader2, ChevronLeft, ChevronRight, Printer } from "lucide-react";
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
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { BoxesCountReport } from "@/types/report";
import { reportApi } from "@/lib/api/reportApi";
import { ApiError } from "@/lib/api/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React from "react";

export default function BoxesCountTable() {
  const [data, setData] = useState<BoxesCountReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
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

  // Define query params interface for boxes count reports
  interface BoxesCountQueryParams {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }

  // Fetch boxes count reports data
  const fetchBoxesCountReports = useCallback(
    async (params: BoxesCountQueryParams = {}, search: string = "") => {
      try {
        setIsLoading(true);

        const response = await reportApi.getBoxesCountReports(
          params.page || 1,
          params.limit || 10,
          params.start_date,
          params.end_date,
          search.trim() || undefined
        );

        // Extract boxes count reports array from the response data
        const boxesCountReports = response.data.reports as BoxesCountReport[];
        setData(boxesCountReports || []); // Ensure we always set an array
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Error fetching boxes count reports:", error);
        toast.error("Failed to fetch boxes count reports", {
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

    const params: BoxesCountQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchBoxesCountReports(params, searchQuery);
  };

  // Initial load and date range changes (like orders table)
  useEffect(() => {
    const params: BoxesCountQueryParams = {
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
    fetchBoxesCountReports(params, ""); // Reset search on date/limit changes
  }, [dateRange, pagination.limit, fetchBoxesCountReports]);

  // Pagination handlers (like orders table)
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));

    const params: BoxesCountQueryParams = {
      page: newPage,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchBoxesCountReports(params, searchQuery);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitValue = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, limit: newLimitValue, page: 1 }));

    const params: BoxesCountQueryParams = {
      page: 1,
      limit: newLimitValue,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchBoxesCountReports(params, searchQuery);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Note: The useEffect will handle the actual data fetching when dateRange changes
  };

  const handleGenerateAndPrintReport = async () => {
    try {
      setIsLoading(true);

      // First, fetch all data (without pagination limits for the PDF)
      const params: BoxesCountQueryParams = {};

      if (dateRange?.from) {
        params.start_date = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange?.to) {
        params.end_date = format(dateRange.to, "yyyy-MM-dd");
      }

      // Fetch all data for PDF (not limited by table pagination)
      let allReportData: BoxesCountReport[] = [];
      let currentPage = 1;
      let hasMoreData = true;
      
      while (hasMoreData) {
        const response = await reportApi.getBoxesCountReports(
          currentPage,
          100, // Use reasonable page size for API calls
          params.start_date,
          params.end_date,
          searchQuery.trim() || undefined
        );

        if (!response.success) {
          throw new Error(
            response.message || "Failed to fetch boxes count reports"
          );
        }

        const pageData = response.data.reports || [];
        allReportData = [...allReportData, ...pageData];
        
        // Check if we have more data to fetch
        const totalPages = Math.ceil(response.data.pagination.total / 100);
        hasMoreData = currentPage < totalPages;
        currentPage++;
      }

      const reportData = allReportData;

      if (reportData.length === 0) {
        let message = "No boxes count reports found";
        const filters = [];

        if (dateRange?.from) {
          filters.push(`from: ${format(dateRange.from, "dd MMM yyyy")}`);
        }
        if (dateRange?.to) {
          filters.push(`to: ${format(dateRange.to, "dd MMM yyyy")}`);
        }
        if (searchQuery) {
          filters.push(`search: ${searchQuery}`);
        }

        if (filters.length > 0) {
          message += ` for ${filters.join(", ")}`;
        }

        message +=
          ". Try adjusting your filters or selecting a different date range.";

        toast.warning(message);
        return;
      }

      // Generate PDF
      const doc = new jsPDF({});

      // Add title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const titleText = "Boxes Count Reports";
      doc.text(titleText, 14, 15);

      // Add filters info
      doc.setFontSize(10);
      const filterData = [];

      if (dateRange?.from && dateRange?.to) {
        filterData.push([
          "Periode",
          `${format(dateRange.from, "dd MMMM yyyy")} - ${format(
            dateRange.to,
            "dd MMMM yyyy"
          )}`,
        ]);
      }

      filterData.push(["Total Records", `${reportData.length}`]);

      filterData.push([
        "Generated",
        format(new Date(), "dd MMMM yyyy - HH:mm"),
      ]);

      filterData.push(["Checker", ""]);

      if (filterData.length > 0) {
        autoTable(doc, {
          body: filterData,
          startY: 20,
          theme: "grid",
          columnStyles: {
            0: {
              cellWidth: 50,
              halign: "left",
              fontStyle: "bold",
              textColor: 0,
            },
            1: { fontStyle: "normal" },
          },
          styles: {
            fontSize: 12,
            cellPadding: 2,
            valign: "middle",
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            fontStyle: "bold",
          },
          headStyles: { fillColor: [255, 255, 255], textColor: 0 },
          didParseCell: function (data) {
            // Add more height to the checker row (last row)
            if (data.row.index === filterData.length - 1) {
              data.cell.styles.minCellHeight = 15;
            }
          },
        });
      }

      // Add main table
      autoTable(doc, {
        head: [
          ["No", "Code", "Name", "Ribbon Count", "Online Count", "Total Count"],
        ],
        body: reportData.map((item, index) => [
          index + 1,
          item.box_code,
          item.box_name,
          item.ribbon_count,
          item.online_count,
          item.total_count,
        ]),
        startY: filterData.length > 0 ? 25 + filterData.length * 8 + 10 : 45,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 2,
          halign: "center",
          valign: "middle",
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: 0,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          halign: "center",
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: 10 }, // No
          1: { cellWidth: 27 }, // Box Code
          2: { cellWidth: 40 }, // Box Name
          3: { cellWidth: 35 }, // Total Count
          4: { cellWidth: 35 }, // Ribbon Count
          5: { cellWidth: 35 }, // Online Count
        },
      });

      // Open in new tab for print preview
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

      // Cleanup URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 100);

      toast.success(`Generated report with ${reportData.length} records`);
    } catch (error) {
      console.error("Error generating report:", error);

      let errorMessage = "Failed to generate report. Please try again.";
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
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const columns: ColumnDef<BoxesCountReport>[] = [
    {
      accessorKey: "box_code",
      header: () => (
        <div className="text-sm text-center font-semibold">Box Code</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("box_code")}
        </div>
      ),
    },
    {
      accessorKey: "box_name",
      header: () => (
        <div className="text-sm text-center font-semibold">Box Name</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">{row.getValue("box_name")}</div>
      ),
    },
    {
      accessorKey: "total_count",
      header: () => (
        <div className="text-sm text-center font-semibold">Total Count</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center font-medium">
          {row.getValue("total_count")}
        </div>
      ),
    },
    {
      accessorKey: "ribbon_count",
      header: () => (
        <div className="text-sm text-center font-semibold">Ribbon Count</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">
          {row.getValue("ribbon_count")}
        </div>
      ),
    },
    {
      accessorKey: "online_count",
      header: () => (
        <div className="text-sm text-center font-semibold">Online Count</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">
          {row.getValue("online_count")}
        </div>
      ),
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
                placeholder="Search boxes..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </form>
          </div>
          <div className="flex justify-start gap-2 items-center">
            <DateRangePicker
              date={dateRange}
              onDateChange={handleDateRangeChange}
              className="max-w-sm"
            />
          </div>
        </div>

        <div className="flex justify-start gap-2 items-center">
          {/* Print Boxes Count Reports */}
          <div className="flex justify-start items-center gap-2">
            <Button
              className="ml-auto"
              onClick={handleGenerateAndPrintReport}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Boxes Count Reports
                </>
              )}
            </Button>
          </div>

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
                    Loading boxes count reports...
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
                  No boxes count reports found.
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
          {pagination.total} boxes count reports
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

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
  Printer,
  ChevronDown,
  FileSpreadsheet,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import ExcelJS from "exceljs";

export default function BoxesCountTable() {
  const [data, setData] = useState<BoxesCountReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
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

  const handleExportToExcel = async () => {
    try {
      setIsLoading(true);

      // First, fetch all data (without pagination limits for the Excel)
      const params: BoxesCountQueryParams = {};

      if (dateRange?.from) {
        params.start_date = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange?.to) {
        params.end_date = format(dateRange.to, "yyyy-MM-dd");
      }

      // Fetch all data for Excel (not limited by table pagination)
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

      // Create a new workbook with ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Livotech System";
      workbook.created = new Date();

      // Define border style
      const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // SHEET 1: Filter Information
      const sheet1 = workbook.addWorksheet("Information");

      // Add title
      sheet1.mergeCells("A1:B1");
      const titleCell = sheet1.getCell("A1");
      titleCell.value = "Boxes Count Reports";
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.border = borderStyle;

      // Add filter information
      let currentRow = 3;
      if (dateRange?.from && dateRange?.to) {
        const periodRow = sheet1.getRow(currentRow);
        periodRow.getCell(1).value = "Periode";
        periodRow.getCell(1).font = { bold: true };
        periodRow.getCell(1).border = borderStyle;
        periodRow.getCell(2).value = `${format(
          dateRange.from,
          "dd MMMM yyyy"
        )} - ${format(dateRange.to, "dd MMMM yyyy")}`;
        periodRow.getCell(2).border = borderStyle;
        currentRow++;
      }

      const totalRow = sheet1.getRow(currentRow);
      totalRow.getCell(1).value = "Total Records";
      totalRow.getCell(1).font = { bold: true };
      totalRow.getCell(1).border = borderStyle;
      totalRow.getCell(2).value = reportData.length;
      totalRow.getCell(2).border = borderStyle;
      currentRow++;

      const generatedRow = sheet1.getRow(currentRow);
      generatedRow.getCell(1).value = "Generated";
      generatedRow.getCell(1).font = { bold: true };
      generatedRow.getCell(1).border = borderStyle;
      generatedRow.getCell(2).value = format(new Date(), "dd MMMM yyyy - HH:mm");
      generatedRow.getCell(2).border = borderStyle;
      currentRow++;

      const checkerRow = sheet1.getRow(currentRow);
      checkerRow.getCell(1).value = "Checker";
      checkerRow.getCell(1).font = { bold: true };
      checkerRow.getCell(1).border = borderStyle;
      checkerRow.getCell(2).value = "";
      checkerRow.getCell(2).border = borderStyle;

      // Set column widths for Sheet 1
      sheet1.getColumn(1).width = 20;
      sheet1.getColumn(2).width = 50;

      // SHEET 2: Box Count Summary
      const sheet2 = workbook.addWorksheet("Boxes Count");

      // Add headers
      const headers = [
        "No",
        "Box Code",
        "Box Name",
        "Ribbon Count",
        "Online Count",
        "Total Count",
      ];
      const headerRow = sheet2.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.eachCell((cell) => {
        cell.border = borderStyle;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
      });

      // Add data rows
      reportData.forEach((item, index) => {
        const dataRow = sheet2.addRow([
          index + 1,
          item.box_code,
          item.box_name,
          item.ribbon_count,
          item.online_count,
          item.total_count,
        ]);
        dataRow.alignment = { horizontal: "center", vertical: "middle" };
        dataRow.eachCell((cell) => {
          cell.border = borderStyle;
        });
      });

      // Set column widths for Sheet 2
      sheet2.getColumn(1).width = 8; // No
      sheet2.getColumn(2).width = 15; // Box Code
      sheet2.getColumn(3).width = 25; // Box Name
      sheet2.getColumn(4).width = 15; // Ribbon Count
      sheet2.getColumn(5).width = 15; // Online Count
      sheet2.getColumn(6).width = 15; // Total Count

      // SHEET 3: Details Box Count
      const allBoxDetails: Array<{
        box_name: string;
        tracking: string;
        order_id: string;
        quantity: number;
        full_name: string;
        source: string;
        created_at: string;
      }> = [];

      reportData.forEach((boxReport) => {
        if (boxReport.details && boxReport.details.length > 0) {
          boxReport.details.forEach((detail) => {
            allBoxDetails.push({
              box_name: boxReport.box_name,
              tracking: detail.tracking,
              order_id: detail.order_id,
              quantity: detail.quantity,
              full_name: detail.full_name,
              source: detail.source,
              created_at: detail.created_at,
            });
          });
        }
      });

      if (allBoxDetails.length > 0) {
        const sheet3 = workbook.addWorksheet("Details Boxes Count");

        // Add headers
        const detailHeaders = [
          "No",
          "Box Name",
          "Tracking",
          "Order ID",
          "Quantity",
          "User",
          "Source",
          "Created",
        ];
        const detailHeaderRow = sheet3.addRow(detailHeaders);
        detailHeaderRow.font = { bold: true };
        detailHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
        detailHeaderRow.eachCell((cell) => {
          cell.border = borderStyle;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
        });

        // Add detail rows
        allBoxDetails.forEach((detail, index) => {
          const detailRow = sheet3.addRow([
            index + 1,
            detail.box_name,
            detail.tracking,
            detail.order_id,
            detail.quantity,
            detail.full_name,
            detail.source,
            format(new Date(detail.created_at), "dd MMM yyyy - HH:mm:ss"),
          ]);
          detailRow.alignment = { horizontal: "center", vertical: "middle" };
          detailRow.eachCell((cell) => {
            cell.border = borderStyle;
          });
        });

        // Set column widths for Sheet 3
        sheet3.getColumn(1).width = 8; // No
        sheet3.getColumn(2).width = 20; // Box Name
        sheet3.getColumn(3).width = 20; // Tracking
        sheet3.getColumn(4).width = 20; // Order ID
        sheet3.getColumn(5).width = 10; // Quantity
        sheet3.getColumn(6).width = 25; // User
        sheet3.getColumn(7).width = 15; // Source
        sheet3.getColumn(8).width = 22; // Created
      }

      // Generate and download Excel file
      const fileName = `Boxes_Count_Report_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        `Excel file exported successfully with ${reportData.length} records`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);

      let errorMessage = "Failed to export to Excel. Please try again.";
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

      // Add "Box Count" title before main table
      const mainTableStartY =
        filterData.length > 0 ? 25 + filterData.length * 8 + 25 : 45;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Boxes Count", 14, mainTableStartY - 5);

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
        startY: mainTableStartY,
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
          3: { cellWidth: 35 }, // Ribbon Count
          4: { cellWidth: 35 }, // Online Count
          5: { cellWidth: 35 }, // Total Count
        },
      });

      // Add detailed box items section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detailYPosition = (doc as any).lastAutoTable.finalY - 5;

      // Create flat array of all box details
      const allBoxDetails: Array<{
        box_name: string;
        tracking: string;
        order_id: string;
        quantity: number;
        full_name: string;
        source: string;
        created_at: string;
      }> = [];

      reportData.forEach((boxReport) => {
        if (boxReport.details && boxReport.details.length > 0) {
          boxReport.details.forEach((detail) => {
            allBoxDetails.push({
              box_name: boxReport.box_name,
              tracking: detail.tracking,
              order_id: detail.order_id,
              quantity: detail.quantity,
              full_name: detail.full_name,
              source: detail.source,
              created_at: detail.created_at,
            });
          });
        }
      });

      console.log(
        `PDF Generation - Box Details: Found ${allBoxDetails.length} detail records`
      );

      // Add box details table if there are any details
      if (allBoxDetails.length > 0) {
        // Add "Details Box Count" title before details table
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Details Boxes Count", 14, detailYPosition + 20);

        autoTable(doc, {
          head: [
            [
              "No",
              "Box Name",
              "Tracking",
              "Order ID",
              "Qty",
              "User",
              "Source",
              "Created",
            ],
          ],
          body: allBoxDetails.map((detail, index) => [
            index + 1,
            detail.box_name,
            detail.tracking,
            detail.order_id,
            detail.quantity,
            detail.full_name,
            detail.source,
            format(new Date(detail.created_at), "dd MMM yyyy - HH:mm:ss"),
          ]),
          startY: detailYPosition + 25,
          theme: "grid",
          styles: {
            fontSize: 9,
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
            1: { cellWidth: 22 }, // Box Name
            2: { cellWidth: 35 }, // Tracking
            3: { cellWidth: 33 }, // Order ID
            4: { cellWidth: 10 }, // Qty
            5: { cellWidth: 25 }, // User
            6: { cellWidth: 20 }, // Source
            7: { cellWidth: 27 }, // Created
          },
        });
      }

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

  const toggleRow = (boxId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boxId)) {
        newSet.delete(boxId);
      } else {
        newSet.add(boxId);
      }
      return newSet;
    });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const columns: ColumnDef<BoxesCountReport>[] = [
    {
      id: "expand",
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const boxId = row.original.box_id;
        const isExpanded = expandedRows.has(boxId);
        const hasDetails =
          row.original.details && row.original.details.length > 0;

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <Button onClick={() => toggleRow(boxId)} className="h-8 w-8 p-0">
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
          {/* Export to Excel */}
          <div className="flex justify-start items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>

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
                    Loading boxes count reports...
                  </div>
                </TableCell>
              </TableRow>
            ) : (() => {
                const rows = table.getRowModel()?.rows;
                return rows && Array.isArray(rows) && rows.length > 0;
              })() ? (
              table.getRowModel().rows!.map((row) => {
                const isExpanded = expandedRows.has(row.original.box_id);
                const details = row.original.details || [];

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

                    {/* Expanded row with details */}
                    {isExpanded && details.length > 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="p-0 bg-muted/50"
                        >
                          <div className="p-4">
                            <h4 className="font-semibold mb-3 text-sm">
                              Box Details ({details.length} items)
                            </h4>
                            <div className="rounded-md border bg-background">
                              <Table>
                                <TableHeader className="border-b">
                                  <TableRow>
                                    <TableHead className="text-center">
                                      Tracking
                                    </TableHead>
                                    <TableHead className="text-center">
                                      Order ID
                                    </TableHead>
                                    <TableHead className="text-center">
                                      Quantity
                                    </TableHead>
                                    <TableHead className="text-center">
                                      User
                                    </TableHead>
                                    <TableHead className="text-center">
                                      Source
                                    </TableHead>
                                    <TableHead className="text-center">
                                      Created
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {details.map((detail, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="text-center font-mono text-sm">
                                        {detail.tracking}
                                      </TableCell>
                                      <TableCell className="text-center text-sm">
                                        {detail.order_id}
                                      </TableCell>
                                      <TableCell className="text-center text-sm">
                                        {detail.quantity}
                                      </TableCell>
                                      <TableCell className="text-center text-sm">
                                        {detail.full_name}
                                      </TableCell>
                                      <TableCell className="text-center text-sm">
                                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                                          {detail.source}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-center text-sm">
                                        {format(
                                          new Date(detail.created_at),
                                          "dd MMM yyyy - HH:mm:ss"
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
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

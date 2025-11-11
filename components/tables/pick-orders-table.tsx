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
  FileSpreadsheet,
  Printer,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { PickOrder } from "@/types/pick-order";
import { pickOrderApi } from "@/lib/api/pickOrderApi";
import { ApiError } from "@/lib/api/types";
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export default function PickOrdersTable() {
  const [data, setData] = useState<PickOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false,
    id: false,
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
  // const [selectedPickOrderId, setSelectedPickOrderId] = useState<number | null>(
  //   null
  // );
  // const [pickOrderDialogOpen, setPickOrderDialogOpen] = useState(false);

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

  // Fetch pick orders data
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

        const response = await pickOrderApi.getPickOrders(
          page,
          pagination.limit,
          search,
          start_date,
          end_date
        );
        // Extract pick order array from the response data
        const pickOrders = response.data.pick_orders as PickOrder[];
        setData(pickOrders);
        setPagination(response.data.pagination);
      } catch (error) {
        // Only log unexpected errors to console to reduce noise
        if (error instanceof ApiError) {
          if (error.status >= 500 || error.status === 0) {
            console.error("Server/Network error fetching pick orders:", error);
          } else {
            console.debug(
              "Client error fetching pick orders:",
              error.message,
              "Status:",
              error.status
            );
          }
        } else {
          console.error("Unexpected error fetching pick orders:", error);
        }

        let errorMessage = "Failed to fetch pick orders. Please try again.";

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

  // Export to Excel function
  const handleExportToExcel = async () => {
    try {
      setIsLoading(true);

      // Build date parameters
      const start_date = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
      const end_date = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : undefined;

      // Fetch all data for Excel (not limited by table pagination)
      let allReportData: PickOrder[] = [];
      let currentPage = 1;
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await pickOrderApi.getPickOrders(
          currentPage,
          100, // Use reasonable page size for API calls
          searchQuery,
          start_date,
          end_date
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to fetch pick orders");
        }

        const pageData = response.data.pick_orders || [];
        allReportData = [...allReportData, ...pageData];

        // Check if we have more data to fetch
        const totalPages = Math.ceil(response.data.pagination.total / 100);
        hasMoreData = currentPage < totalPages;
        currentPage++;
      }

      const reportData = allReportData;

      if (reportData.length === 0) {
        let message = "No pick orders found";

        if (dateRange?.from || dateRange?.to) {
          message += " for the selected date range";
        }
        if (searchQuery) {
          message += ` matching "${searchQuery}"`;
        }

        message += ". Try adjusting your filters.";
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
      titleCell.value = "Pick Orders Report";
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.border = borderStyle;

      // Add filter information
      let currentRow = 3;
      if (dateRange?.from && dateRange?.to) {
        const periodRow = sheet1.getRow(currentRow);
        periodRow.getCell(1).value = "Period";
        periodRow.getCell(1).font = { bold: true };
        periodRow.getCell(1).border = borderStyle;
        periodRow.getCell(2).value = `${format(
          dateRange.from,
          "dd MMMM yyyy"
        )} - ${format(dateRange.to, "dd MMMM yyyy")}`;
        periodRow.getCell(2).border = borderStyle;
        currentRow++;
      }

      if (searchQuery) {
        const searchRow = sheet1.getRow(currentRow);
        searchRow.getCell(1).value = "Search Query";
        searchRow.getCell(1).font = { bold: true };
        searchRow.getCell(1).border = borderStyle;
        searchRow.getCell(2).value = searchQuery;
        searchRow.getCell(2).border = borderStyle;
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
      generatedRow.getCell(2).value = format(
        new Date(),
        "dd MMMM yyyy - HH:mm"
      );
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

      // SHEET 2: Pick Orders Summary
      const sheet2 = workbook.addWorksheet("Pick Orders");

      // Add headers
      const headers = [
        "No",
        "Order ID",
        "Tracking",
        "Channel",
        "Store",
        "Picker",
        "Status",
        "Picked At",
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
          item.order?.order_id || "-",
          item.order?.tracking || "-",
          item.order?.channel || "-",
          item.order?.store || "-",
          item.picker?.full_name || "-",
          item.order?.status || "-",
          format(new Date(item.created_at), "dd MMM yyyy HH:mm"),
        ]);
        dataRow.alignment = { horizontal: "center", vertical: "middle" };
        dataRow.eachCell((cell) => {
          cell.border = borderStyle;
        });
      });

      // Set column widths for Sheet 2
      sheet2.getColumn(1).width = 8; // No
      sheet2.getColumn(2).width = 20; // Order ID
      sheet2.getColumn(3).width = 25; // Tracking
      sheet2.getColumn(4).width = 15; // Channel
      sheet2.getColumn(5).width = 20; // Store
      sheet2.getColumn(6).width = 20; // Picker
      sheet2.getColumn(7).width = 18; // Status
      sheet2.getColumn(8).width = 20; // Picked At

      // SHEET 3: Pick Order Details
      const allPickOrderDetails: Array<{
        pick_order_id: number;
        order_id: string;
        picker_name: string;
        sku: string;
        product_name: string;
        variant: string;
        quantity: number;
      }> = [];

      reportData.forEach((pickOrder) => {
        if (
          pickOrder.pick_order_details &&
          pickOrder.pick_order_details.length > 0
        ) {
          pickOrder.pick_order_details.forEach((detail) => {
            allPickOrderDetails.push({
              pick_order_id: pickOrder.id,
              order_id: pickOrder.order?.order_id || "-",
              picker_name: pickOrder.picker?.full_name || "-",
              sku: detail.sku,
              product_name: detail.product_name,
              variant: detail.variant || "-",
              quantity: detail.quantity,
            });
          });
        }
      });

      if (allPickOrderDetails.length > 0) {
        const sheet3 = workbook.addWorksheet("Pick Order Details");

        // Add headers
        const detailHeaders = [
          "No",
          "Order ID",
          "Picker",
          "SKU",
          "Product Name",
          "Variant",
          "Quantity",
        ];
        const detailHeaderRow = sheet3.addRow(detailHeaders);
        detailHeaderRow.font = { bold: true };
        detailHeaderRow.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        detailHeaderRow.eachCell((cell) => {
          cell.border = borderStyle;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
        });

        // Add detail rows
        allPickOrderDetails.forEach((detail, index) => {
          const detailRow = sheet3.addRow([
            index + 1,
            detail.order_id,
            detail.picker_name,
            detail.sku,
            detail.product_name,
            detail.variant,
            detail.quantity,
          ]);
          detailRow.alignment = { horizontal: "center", vertical: "middle" };
          detailRow.eachCell((cell) => {
            cell.border = borderStyle;
          });
        });

        // Set column widths for Sheet 3
        sheet3.getColumn(1).width = 8; // No
        sheet3.getColumn(2).width = 20; // Order ID
        sheet3.getColumn(3).width = 20; // Picker
        sheet3.getColumn(4).width = 15; // SKU
        sheet3.getColumn(5).width = 40; // Product Name
        sheet3.getColumn(6).width = 15; // Variant
        sheet3.getColumn(7).width = 10; // Quantity
      }

      // Generate and download Excel file
      const fileName = `Pick_Orders_Report_${format(
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

  // Generate and Print PDF Report
  const handleGenerateAndPrintReport = async () => {
    try {
      setIsLoading(true);

      // Build date parameters
      const start_date = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
      const end_date = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : undefined;

      // Fetch all data for PDF (not limited by table pagination)
      let allReportData: PickOrder[] = [];
      let currentPage = 1;
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await pickOrderApi.getPickOrders(
          currentPage,
          100, // Use reasonable page size for API calls
          searchQuery,
          start_date,
          end_date
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to fetch pick orders");
        }

        const pageData = response.data.pick_orders || [];
        allReportData = [...allReportData, ...pageData];

        // Check if we have more data to fetch
        const totalPages = Math.ceil(response.data.pagination.total / 100);
        hasMoreData = currentPage < totalPages;
        currentPage++;
      }

      const reportData = allReportData;

      if (reportData.length === 0) {
        let message = "No pick orders found";

        if (dateRange?.from || dateRange?.to) {
          message += " for the selected date range";
        }
        if (searchQuery) {
          message += ` matching "${searchQuery}"`;
        }

        message += ". Try adjusting your filters.";
        toast.warning(message);
        return;
      }

      // Generate PDF
      const doc = new jsPDF({});

      // Add title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const titleText = "Pick Orders Report";
      doc.text(titleText, 14, 15);

      // Add filters info
      doc.setFontSize(10);
      const filterData = [];

      if (dateRange?.from && dateRange?.to) {
        filterData.push([
          "Period",
          `${format(dateRange.from, "dd MMMM yyyy")} - ${format(
            dateRange.to,
            "dd MMMM yyyy"
          )}`,
        ]);
      }

      if (searchQuery) {
        filterData.push(["Search Query", searchQuery]);
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

      // Add "Pick Orders" title before main table
      const mainTableStartY =
        filterData.length > 0 ? 25 + filterData.length * 8 + 25 : 45;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Pick Orders", 14, mainTableStartY - 5);

      // Add main table
      autoTable(doc, {
        head: [["No", "Picked At", "Order ID", "Tracking", "Picker", "Status"]],
        body: reportData.map((item, index) => [
          index + 1,
          format(new Date(item.created_at), "dd MMM yyyy HH:mm:ss"),
          item.order?.order_id || "-",
          item.order?.tracking || "-",
          item.picker?.full_name || "-",
          item.order?.status || "-",
        ]),
        startY: mainTableStartY,
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
          1: { cellWidth: 40 }, // Picked At
          2: { cellWidth: 35 }, // Order ID
          3: { cellWidth: 38 }, // Tracking
          4: { cellWidth: 30 }, // Picker
          5: { cellWidth: 30 }, // Status
        },
      });

      // Add detailed pick order details section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detailYPosition = (doc as any).lastAutoTable.finalY + 15;

      // Create flat array of all pick order details
      const allPickOrderDetails: Array<{
        pick_order_id: number;
        order_id: string;
        picker_name: string;
        sku: string;
        product_name: string;
        variant: string;
        quantity: number;
      }> = [];

      reportData.forEach((pickOrder) => {
        if (
          pickOrder.pick_order_details &&
          pickOrder.pick_order_details.length > 0
        ) {
          pickOrder.pick_order_details.forEach((detail) => {
            allPickOrderDetails.push({
              pick_order_id: pickOrder.id,
              order_id: pickOrder.order?.order_id || "-",
              picker_name: pickOrder.picker?.full_name || "-",
              sku: detail.sku,
              product_name: detail.product_name,
              variant: detail.variant || "-",
              quantity: detail.quantity,
            });
          });
        }
      });

      // Add pick order details table if there are any details
      if (allPickOrderDetails.length > 0) {
        // Check if we need a new page
        if (detailYPosition > 250) {
          doc.addPage();
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Pick Order Details", 14, 15);

          autoTable(doc, {
            head: [
              [
                "No",
                "Order ID",
                "Picker",
                "SKU",
                "Product Name",
                "Variant",
                "Qty",
              ],
            ],
            body: allPickOrderDetails.map((detail, index) => [
              index + 1,
              detail.order_id,
              detail.picker_name,
              detail.sku,
              detail.product_name,
              detail.variant,
              detail.quantity,
            ]),
            startY: 20,
            theme: "grid",
            styles: {
              fontSize: 8,
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
              1: { cellWidth: 30 }, // Order ID
              2: { cellWidth: 25 }, // Picker
              3: { cellWidth: 20 }, // SKU
              4: { cellWidth: 50 }, // Product Name
              5: { cellWidth: 20 }, // Variant
              6: { cellWidth: 12 }, // Qty
            },
          });
        } else {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Pick Order Details", 14, detailYPosition);

          autoTable(doc, {
            head: [
              [
                "No",
                "Order ID",
                "Picker",
                "SKU",
                "Product Name",
                "Variant",
                "Qty",
              ],
            ],
            body: allPickOrderDetails.map((detail, index) => [
              index + 1,
              detail.order_id,
              detail.picker_name,
              detail.sku,
              detail.product_name,
              detail.variant,
              detail.quantity,
            ]),
            startY: detailYPosition + 5,
            theme: "grid",
            styles: {
              fontSize: 8,
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
              1: { cellWidth: 30 }, // Order ID
              2: { cellWidth: 25 }, // Picker
              3: { cellWidth: 20 }, // SKU
              4: { cellWidth: 66 }, // Product Name
              5: { cellWidth: 20 }, // Variant
              6: { cellWidth: 12 }, // Qty
            },
          });
        }
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

  // Render expanded row content
  const renderExpandedContent = (pickOrderData: PickOrder) => {
    const details = pickOrderData.pick_order_details || [];

    if (details.length === 0) {
      return null;
    }

    return (
      <div>
        <div className="p-4 bg-muted/30">
          <div className="mt-3 pt-3 border-t">
            <h4 className="text-sm font-semibold mb-3">Pick Order Details</h4>
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
                            {detail.product_name}
                          </div>
                          {detail.sku && (
                            <div className="text-xs text-muted-foreground font-mono">
                              SKU: {detail.sku}
                            </div>
                          )}
                          {detail.variant && detail.variant !== "-" && (
                            <div className="text-xs text-muted-foreground">
                              Variant: {detail.variant}
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

                      {detail.product?.barcode && (
                        <div className="text-xs text-muted-foreground">
                          Barcode: {detail.product.barcode}
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

  const columns: ColumnDef<PickOrder>[] = [
    {
      id: "expand",
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const pickOrderData = row.original;
        const details = pickOrderData.pick_order_details || [];
        const hasDetails = details.length > 0;
        const isExpanded = expandedRows.has(pickOrderData.id);

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <Button
              onClick={() => toggleRowExpansion(pickOrderData.id)}
              className="h-8 w-8 p-0"
              variant="default"
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
      accessorKey: "created_at",
      header: () => (
        <div className="text-sm text-center font-semibold">Picked</div>
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
      accessorKey: "picker",
      header: () => (
        <div className="text-sm text-center font-semibold">Picker</div>
      ),
      cell: ({ row }) => {
        const pickOrderData = row.original;
        return (
          <div className="text-sm">
            {pickOrderData.picker ? (
              <div className="text-center">
                <div className="font-medium">
                  {pickOrderData.picker.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  @{pickOrderData.picker.username}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
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
      cell: ({ row }) => {
        const pickOrderData = row.original;
        return (
          <div className="font-mono text-sm text-center">
            {pickOrderData.order?.order_id || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "tracking",
      header: () => (
        <div className="text-sm text-center font-semibold">Tracking</div>
      ),
      cell: ({ row }) => {
        const pickOrderData = row.original;
        return (
          <div className="font-mono text-sm text-center">
            {pickOrderData.order?.tracking || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "channel",
      header: () => (
        <div className="text-sm text-center font-semibold">Channel</div>
      ),
      cell: ({ row }) => {
        const pickOrderData = row.original;
        return (
          <div className="text-sm text-center">
            {pickOrderData.order?.channel || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "store",
      header: () => (
        <div className="text-sm text-center font-semibold">Store</div>
      ),
      cell: ({ row }) => {
        const pickOrderData = row.original;
        return (
          <div className="text-sm text-center">
            {pickOrderData.order?.store || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <div className="text-sm text-center font-semibold">Status</div>
      ),
      cell: ({ row }) => {
        const pickOrderData = row.original;
        return (
          <div className="text-sm text-center">
            <Badge variant="outline">
              {pickOrderData.order?.status || "-"}
            </Badge>
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
                placeholder="Search pick orders..."
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
                  Print Reports
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
                    Loading pick orders...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const pickOrderData = row.original;
                const isExpanded = expandedRows.has(pickOrderData.id);

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
                          {renderExpandedContent(pickOrderData)}
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
                  No pick orders found.
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
          {pagination.total} pick orders
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

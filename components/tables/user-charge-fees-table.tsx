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
  ChevronsUpDown,
  Check,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/custom-ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { UserChargeFeeReport } from "@/types/report";
import { User } from "@/types/auth";
import { reportApi } from "@/lib/api/reportApi";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api/adminApi";
import { ApiError } from "@/lib/api/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React from "react";
import ExcelJS from "exceljs";

export default function UserChargeFeesTable() {
  const [data, setData] = useState<UserChargeFeeReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    user_id: false,
    email: false,
  });
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
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

  // Define query params interface for user charge fee reports
  interface UserChargeFeeQueryParams {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }

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

  // Format currency with thousand dot separator
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Get selected user display text
  const getSelectedUserText = (userId: string) => {
    if (!userId) return "Select user...";
    const user = users.find((u) => u.id.toString() === userId);
    return user ? `${user.full_name}` : "Select user...";
  };

  // Fetch users data for combobox
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      // Fetch all users with a large limit to get all users
      const response = await adminApi.getUsers(1, 1000);
      setUsers((response.data?.users as User[]) || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch user charge fee reports data
  const fetchUserChargeFeeReports = useCallback(
    async (params: UserChargeFeeQueryParams = {}, userId: string = "") => {
      try {
        setIsLoading(true);

        const response = await reportApi.getUserChargeFeeReports(
          params.page || 1,
          params.limit || 10,
          params.start_date,
          params.end_date,
          userId.trim() || undefined
        );

        // Extract user charge fee reports array from the response data
        const userChargeFeeReports = response.data
          .reports as UserChargeFeeReport[];
        setData(userChargeFeeReports || []); // Ensure we always set an array
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Error fetching user charge fee reports:", error);
        toast.error("Failed to fetch user charge fee reports", {
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

  // Handle user selection change
  const handleUserSelectionChange = (userId: string) => {
    setSelectedUserId(userId);
    setUserSearchOpen(false);
    setUserSearch("");
    // Reset to page 1 when searching
    setPagination((prev) => ({ ...prev, page: 1 }));

    const params: UserChargeFeeQueryParams = {
      page: 1,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchUserChargeFeeReports(params, userId);
  };

  // Initial load and fetch users
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Initial load and date range changes (like orders table)
  useEffect(() => {
    const params: UserChargeFeeQueryParams = {
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
    setSelectedUserId(""); // Reset user selection on date/limit changes
    setUserSearch(""); // Reset user search state
    setUserSearchOpen(false); // Close the combobox
    fetchUserChargeFeeReports(params, ""); // Reset search on date/limit changes
  }, [dateRange, pagination.limit, fetchUserChargeFeeReports]);

  // Pagination handlers (like orders table)
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));

    const params: UserChargeFeeQueryParams = {
      page: newPage,
      limit: pagination.limit,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchUserChargeFeeReports(params, selectedUserId);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitValue = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, limit: newLimitValue, page: 1 }));

    const params: UserChargeFeeQueryParams = {
      page: 1,
      limit: newLimitValue,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    fetchUserChargeFeeReports(params, selectedUserId);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Note: The useEffect will handle the actual data fetching when dateRange changes
  };

  // Render expanded row content
  const renderExpandedContent = (userChargeReport: UserChargeFeeReport) => {
    const complainDetails = userChargeReport.complain_details || [];

    if (complainDetails.length === 0) {
      return null;
    }

    return (
      <div>
        <div className="p-4 bg-muted/30">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
            Complain Details ({complainDetails.length} complaints)
          </h4>
          <div className="space-y-3">
            {complainDetails.map((detail, index) => (
              <div key={index} className="border rounded-lg p-3 bg-background">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Code:</span>
                    <p className="font-mono">{detail.complain_code}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tracking:</span>
                    <p className="font-mono">{detail.tracking}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order ID:</span>
                    <p className="font-mono">{detail.order_ginee_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fee Charge:</span>
                    <p className="font-mono">
                      Rp. {formatCurrency(detail.fee_charge)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <p className="font-mono">
                      {format(
                        new Date(detail.complain_updated_at),
                        "dd MMM yyyy HH:mm:ss"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleExportToExcel = async () => {
    try {
      setIsLoading(true);

      // First, fetch all data (without pagination limits for the Excel)
      const params: UserChargeFeeQueryParams = {};

      if (dateRange?.from) {
        params.start_date = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange?.to) {
        params.end_date = format(dateRange.to, "yyyy-MM-dd");
      }

      // Fetch all data for Excel (not limited by table pagination)
      let allReportData: UserChargeFeeReport[] = [];
      let currentPage = 1;
      let hasMoreData = true;

      // Log the filter being applied
      const userFilter = selectedUserId.trim() || undefined;

      while (hasMoreData) {
        const response = await reportApi.getUserChargeFeeReports(
          currentPage,
          100, // Use reasonable page size for API calls
          params.start_date,
          params.end_date,
          userFilter
        );

        if (!response.success) {
          throw new Error(
            response.message || "Failed to fetch user charge fee reports"
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
        let message = "No user charge fee reports found";
        const filters = [];

        if (dateRange?.from) {
          filters.push(`from: ${format(dateRange.from, "dd MMM yyyy")}`);
        }
        if (dateRange?.to) {
          filters.push(`to: ${format(dateRange.to, "dd MMM yyyy")}`);
        }
        if (selectedUserId) {
          const selectedUser = users.find(
            (u) => u.id.toString() === selectedUserId
          );
          filters.push(
            `user: ${selectedUser ? selectedUser.username : selectedUserId}`
          );
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
      titleCell.value = "User Charge Fee Reports";
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

      // Add user filter information
      const userFilterRow = sheet1.getRow(currentRow);
      userFilterRow.getCell(1).value = "User Filter";
      userFilterRow.getCell(1).font = { bold: true };
      userFilterRow.getCell(1).border = borderStyle;
      if (selectedUserId) {
        const selectedUser = users.find(
          (u) => u.id.toString() === selectedUserId
        );
        userFilterRow.getCell(2).value = selectedUser
          ? selectedUser.full_name
          : `User ID: ${selectedUserId}`;
      } else {
        userFilterRow.getCell(2).value = "All Users";
      }
      userFilterRow.getCell(2).border = borderStyle;
      currentRow++;

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

      // SHEET 2: Users Charged Fee Summary
      const sheet2 = workbook.addWorksheet("Users Charged Fee");

      // Add headers
      const headers = [
        "No",
        "Username",
        "Full Name",
        "Total Complaints",
        "Total Fee Charge",
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
          item.username,
          item.full_name,
          item.total_complaints,
          `Rp. ${formatCurrency(item.total_fee_charge)}`,
        ]);
        dataRow.alignment = { horizontal: "center", vertical: "middle" };
        dataRow.eachCell((cell) => {
          cell.border = borderStyle;
        });
      });

      // Set column widths for Sheet 2
      sheet2.getColumn(1).width = 8; // No
      sheet2.getColumn(2).width = 20; // Username
      sheet2.getColumn(3).width = 25; // Full Name
      sheet2.getColumn(4).width = 18; // Total Complaints
      sheet2.getColumn(5).width = 20; // Total Fee Charge

      // SHEET 3: Details Users Charged Fee
      const allComplainDetails: Array<{
        full_name: string;
        order_id: string;
        fee_charge: number;
        updated_at: string;
      }> = [];

      reportData.forEach((userReport) => {
        if (
          userReport.complain_details &&
          userReport.complain_details.length > 0
        ) {
          userReport.complain_details.forEach((complainDetail) => {
            allComplainDetails.push({
              full_name: userReport.full_name,
              order_id: complainDetail.order_ginee_id,
              fee_charge: complainDetail.fee_charge,
              updated_at: complainDetail.complain_updated_at,
            });
          });
        }
      });

      if (allComplainDetails.length > 0) {
        const sheet3 = workbook.addWorksheet("Details Users Charged Fee");

        // Add headers
        const detailHeaders = [
          "No",
          "Full Name",
          "Order ID",
          "Fee Charge",
          "Updated",
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
        allComplainDetails.forEach((detail, index) => {
          const detailRow = sheet3.addRow([
            index + 1,
            detail.full_name,
            detail.order_id,
            `Rp. ${formatCurrency(detail.fee_charge)}`,
            format(new Date(detail.updated_at), "dd MMMM yyyy"),
          ]);
          detailRow.alignment = { horizontal: "center", vertical: "middle" };
          detailRow.eachCell((cell) => {
            cell.border = borderStyle;
          });
        });

        // Set column widths for Sheet 3
        sheet3.getColumn(1).width = 8; // No
        sheet3.getColumn(2).width = 25; // Full Name
        sheet3.getColumn(3).width = 25; // Order ID
        sheet3.getColumn(4).width = 20; // Fee Charge
        sheet3.getColumn(5).width = 20; // Updated
      }

      // Generate and download Excel file
      const fileName = `User_Charge_Fee_Report_${format(
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
      const params: UserChargeFeeQueryParams = {};

      if (dateRange?.from) {
        params.start_date = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange?.to) {
        params.end_date = format(dateRange.to, "yyyy-MM-dd");
      }

      // Fetch all data for PDF (not limited by table pagination)
      let allReportData: UserChargeFeeReport[] = [];
      let currentPage = 1;
      let hasMoreData = true;

      // Log the filter being applied
      const userFilter = selectedUserId.trim() || undefined;
      console.log(
        "PDF Generation - User Filter:",
        userFilter ? `User ID: ${userFilter}` : "All Users"
      );

      while (hasMoreData) {
        const response = await reportApi.getUserChargeFeeReports(
          currentPage,
          100, // Use reasonable page size for API calls
          params.start_date,
          params.end_date,
          userFilter
        );

        if (!response.success) {
          throw new Error(
            response.message || "Failed to fetch user charge fee reports"
          );
        }

        const pageData = response.data.reports || [];
        allReportData = [...allReportData, ...pageData];

        // Check if we have more data to fetch
        const totalPages = Math.ceil(response.data.pagination.total / 100);
        hasMoreData = currentPage < totalPages;

        console.log(
          `PDF Generation - Page ${currentPage}/${totalPages}: Fetched ${pageData.length} records, Total so far: ${allReportData.length}`
        );
        currentPage++;
      }

      console.log(
        `PDF Generation Complete - Total records fetched: ${allReportData.length}`
      );

      const reportData = allReportData;

      if (reportData.length === 0) {
        let message = "No user charge fee reports found";
        const filters = [];

        if (dateRange?.from) {
          filters.push(`from: ${format(dateRange.from, "dd MMM yyyy")}`);
        }
        if (dateRange?.to) {
          filters.push(`to: ${format(dateRange.to, "dd MMM yyyy")}`);
        }
        if (selectedUserId) {
          const selectedUser = users.find(
            (u) => u.id.toString() === selectedUserId
          );
          filters.push(
            `user: ${selectedUser ? selectedUser.username : selectedUserId}`
          );
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
      const titleText = "User Charge Fee Reports";
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

      // Add user filter information
      if (selectedUserId) {
        const selectedUser = users.find(
          (u) => u.id.toString() === selectedUserId
        );
        filterData.push([
          "User Filter",
          selectedUser ? selectedUser.full_name : `User ID: ${selectedUserId}`,
        ]);
      } else {
        filterData.push(["User Filter", "All Users"]);
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

      // Add "Users Charged Fee" title before main table
      const mainTableStartY =
        filterData.length > 0 ? 25 + filterData.length * 8 + 25 : 45;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Users Charged Fee", 14, mainTableStartY - 5);

      // Add main table
      autoTable(doc, {
        head: [
          [
            "No",
            "Username",
            "Full Name",
            "Total Complaints",
            "Total Fee Charge",
          ],
        ],
        body: reportData.map((item, index) => [
          index + 1,
          item.username,
          item.full_name,
          item.total_complaints,
          `Rp. ${formatCurrency(item.total_fee_charge)}`,
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
          1: { cellWidth: 42 }, // Username
          2: { cellWidth: 50 }, // Full Name
          3: { cellWidth: 30 }, // Total Complaints
          4: { cellWidth: 50 }, // Total Fee Charge
        },
      });

      // Add detailed complain list section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detailYPosition = (doc as any).lastAutoTable.finalY - 5;

      // Create flat array of all complain details with user info
      const allComplainDetails: Array<{
        full_name: string;
        order_id: string;
        fee_charge: number;
        updated_at: string;
      }> = [];

      reportData.forEach((userReport) => {
        if (
          userReport.complain_details &&
          userReport.complain_details.length > 0
        ) {
          userReport.complain_details.forEach((complainDetail) => {
            allComplainDetails.push({
              full_name: userReport.full_name,
              order_id: complainDetail.order_ginee_id,
              fee_charge: complainDetail.fee_charge,
              updated_at: complainDetail.complain_updated_at,
            });
          });
        }
      });

      console.log(
        `PDF Generation - Complain Details: Found ${allComplainDetails.length} complain records`
      );

      // Add complain details table if there are any details
      if (allComplainDetails.length > 0) {
        // Add "Details Users Charged Fee" title before details table
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Details Users Charged Fee", 14, detailYPosition + 20);

        autoTable(doc, {
          head: [["No", "Full Name", "Order ID", "Fee Charge", "Updated"]],
          body: allComplainDetails.map((detail, index) => [
            index + 1,
            detail.full_name,
            detail.order_id,
            `Rp. ${formatCurrency(detail.fee_charge)}`,
            format(new Date(detail.updated_at), "dd MMMM yyyy"),
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
            1: { cellWidth: 50 }, // Full Name
            2: { cellWidth: 40 }, // Order ID
            3: { cellWidth: 35 }, // Fee Charge
            4: { cellWidth: 47 }, // Updated
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

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const columns: ColumnDef<UserChargeFeeReport>[] = [
    {
      id: "expand",
      header: () => (
        <div className="text-sm text-center font-semibold w-12"></div>
      ),
      cell: ({ row }) => {
        const userChargeReport = row.original;
        const complainDetails = userChargeReport.complain_details || [];
        const hasDetails = complainDetails.length > 0;
        const isExpanded = expandedRows.has(userChargeReport.user_id);

        if (!hasDetails) {
          return <div className="w-12"></div>;
        }

        return (
          <div className="flex justify-start">
            <Button
              onClick={() => toggleRowExpansion(userChargeReport.user_id)}
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
      accessorKey: "user_id",
      header: () => (
        <div className="text-sm text-center font-semibold">User ID</div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center">
          {row.getValue("user_id")}
        </div>
      ),
    },
    {
      accessorKey: "username",
      header: () => (
        <div className="text-sm text-center font-semibold">Username</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">{row.getValue("username")}</div>
      ),
    },
    {
      accessorKey: "full_name",
      header: () => (
        <div className="text-sm text-center font-semibold">Full Name</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">{row.getValue("full_name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: () => (
        <div className="text-sm text-center font-semibold">Email</div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "total_complaints",
      header: () => (
        <div className="text-sm text-center font-semibold">
          Total Complaints
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center font-medium">
          {row.getValue("total_complaints")}
        </div>
      ),
    },
    {
      accessorKey: "total_fee_charge",
      header: () => (
        <div className="text-sm text-center font-semibold">
          Total Fee Charge
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-center font-medium">
          Rp. {formatCurrency(row.getValue("total_fee_charge") || 0)}
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
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className="w-[280px] justify-between"
                  disabled={isLoadingUsers}
                >
                  {getSelectedUserText(selectedUserId)}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by username or full name..."
                    value={userSearch}
                    onValueChange={setUserSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isLoadingUsers
                        ? "Loading users..."
                        : userSearch
                        ? `No users found for "${userSearch}"`
                        : "No users found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {/* Add "All Users" option */}
                      {(() => {
                        const searchTerm = userSearch.toLowerCase();

                        // Show "All Users" option when no search or when "all" matches
                        const showAllUsers =
                          !searchTerm || "all users".includes(searchTerm);

                        const filteredUsers = users.filter((user) => {
                          if (!searchTerm) return true; // Show all when no search

                          const usernameMatch = user.username
                            .toLowerCase()
                            .includes(searchTerm);
                          const fullNameMatch = user.full_name
                            .toLowerCase()
                            .includes(searchTerm);
                          const emailMatch = user.email
                            .toLowerCase()
                            .includes(searchTerm);

                          return usernameMatch || fullNameMatch || emailMatch;
                        });

                        return (
                          <>
                            {showAllUsers && (
                              <CommandItem
                                value="all-users"
                                onSelect={() => handleUserSelectionChange("")}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedUserId === ""
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                All Users
                              </CommandItem>
                            )}
                            {filteredUsers
                              .slice(0, 50) // Limit to 50 results for performance
                              .map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.id.toString()}
                                  onSelect={() =>
                                    handleUserSelectionChange(
                                      user.id.toString()
                                    )
                                  }
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedUserId === user.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {user.full_name}
                                </CommandItem>
                              ))}
                          </>
                        );
                      })()}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Range Picker */}
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

          {/* Print User Charge Fee Reports */}
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
                  Print User Charge Fee Reports
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
                    Loading user charge fee reports...
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
                  {/* Expanded row content */}
                  {expandedRows.has(row.original.user_id) && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-0">
                        {renderExpandedContent(row.original)}
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
                  No user charge fee reports found.
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
          {pagination.total} user charge fee reports
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

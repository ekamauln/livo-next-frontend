"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  FileText,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ComplainReport } from "@/types/report";
import { reportApi } from "@/lib/api/reportApi";
import { ApiError } from "@/lib/api/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export default function HandoutComplain() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateAndPrintReport = async () => {
    try {
      setIsLoading(true);

      // First, fetch the data
      const dateParam = date ? format(date, "yyyy-MM-dd") : undefined;

      const response = await reportApi.getComplainReports(dateParam);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch complain reports");
      }

      const reportData: ComplainReport[] = response.data.complains || [];

      if (reportData.length === 0) {
        let message = "No complain reports found";
        
        if (date) {
          message += ` for date: ${format(date, "dd MMM yyyy")}`;
        }

        message +=
          ". Try adjusting your filters or selecting a different date.";

        toast.warning(message);
        return;
      }

      // Then generate and show the PDF
      const doc = new jsPDF({});

      // Add title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const titleText = "Handout Report Complain";
      doc.text(titleText, 14, 15);

      // Add filters info
      doc.setFontSize(10);
      const filterData = [];

      if (date) {
        filterData.push(["Date", format(date, "dd MMMM yyyy")]);
      }

      filterData.push(["Total Records", `${reportData.length}`]);

      // Calculate total products (sum of all quantities)
      const totalProducts = reportData.reduce((total, item) => {
        return total + item.product_details.reduce((itemTotal, detail) => {
          return itemTotal + detail.quantity;
        }, 0);
      }, 0);

      filterData.push(["Total Products", `${totalProducts}`]);

      filterData.push([
        "Generated",
        format(new Date(), "dd MMMM yyyy - HH:mm"),
      ]);

      filterData.push(["Picker", ""]);

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
            }, // Label column (Date, etc.)
            1: { fontStyle: "normal" }, // Value column
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
            // Add more height to the picker row (last row)
            if (data.row.index === filterData.length - 1) {
              data.cell.styles.minCellHeight = 15; // Increase height for picker row
            }
          },
        });
      }

      // Flatten the data to show complain product details
      const tableData: (string | number)[][] = [];
      reportData.forEach((item) => {
        item.product_details.forEach((detail) => {
          tableData.push([
            tableData.length + 1,
            item.order_id, // order_id
            detail.product.name, // product name
            detail.quantity, // quantity
          ]);
        });
      });

      // Add table
      autoTable(doc, {
        head: [["No", "Order ID", "Product Name", "Quantity"]],
        body: tableData,
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
          1: { cellWidth: 60 }, // Order ID
          2: { cellWidth: 80 }, // Product Name
          3: { cellWidth: 32 }, // Quantity
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

  const handleExportToExcel = async () => {
    try {
      setIsLoading(true);

      // Fetch the data
      const dateParam = date ? format(date, "yyyy-MM-dd") : undefined;

      const response = await reportApi.getComplainReports(dateParam);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch complain reports");
      }

      const reportData: ComplainReport[] = response.data.complains || [];

      if (reportData.length === 0) {
        let message = "No complain reports found";
        
        if (date) {
          message += ` for date: ${format(date, "dd MMM yyyy")}`;
        }

        message +=
          ". Try adjusting your filters or selecting a different date.";

        toast.warning(message);
        return;
      }

      // Create workbook and worksheets
      const workbook = new ExcelJS.Workbook();
      const infoSheet = workbook.addWorksheet("Information");
      const dataSheet = workbook.addWorksheet("Complain Data");

      // Sheet 1: Information
      const infoData = [];

      if (date) {
        infoData.push(["Date", format(date, "dd MMMM yyyy")]);
      }

      infoData.push(["Total Records", reportData.length]);

      // Calculate total products (sum of all quantities)
      const totalProducts = reportData.reduce((total, item) => {
        return total + item.product_details.reduce((itemTotal, detail) => {
          return itemTotal + detail.quantity;
        }, 0);
      }, 0);

      infoData.push(["Total Products", totalProducts]);

      infoData.push([
        "Generated",
        format(new Date(), "dd MMMM yyyy - HH:mm"),
      ]);

      infoData.push(["Picker", ""]);

      // Add data to info sheet
      infoData.forEach((row, index) => {
        const excelRow = infoSheet.addRow(row);
        
        // Style all cells
        excelRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        // Make first column bold
        excelRow.getCell(1).font = { bold: true };

        // Add extra height to picker row (last row)
        if (index === infoData.length - 1) {
          excelRow.height = 30;
        }
      });

      // Set column widths for info sheet
      infoSheet.getColumn(1).width = 20;
      infoSheet.getColumn(2).width = 50;

      // Sheet 2: Complain Data
      // Add headers
      const headerRow = dataSheet.addRow([
        "No",
        "Order ID",
        "Product Name",
        "Quantity",
      ]);

      // Style header
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
        cell.font = { bold: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Flatten the data to show complain product details
      let rowNumber = 1;
      reportData.forEach((item) => {
        item.product_details.forEach((detail) => {
          const dataRow = dataSheet.addRow([
            rowNumber,
            item.order_id,
            detail.product.name,
            detail.quantity,
          ]);

          // Style data cells
          dataRow.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = { horizontal: "center", vertical: "middle" };
          });

          rowNumber++;
        });
      });

      // Set column widths for data sheet
      dataSheet.getColumn(1).width = 8;
      dataSheet.getColumn(2).width = 25;
      dataSheet.getColumn(3).width = 40;
      dataSheet.getColumn(4).width = 12;

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Handout_Complain_Report_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);

      toast.success(`Exported ${reportData.length} records to Excel`);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Complain Reports
          </CardTitle>
          <CardDescription>
            Generate and export complain reports with date filter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd MMMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Button */}
            <div className="flex justify-start gap-2">
              <Button
                onClick={handleExportToExcel}
                disabled={isLoading}
                variant="outline"
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export to Excel
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerateAndPrintReport}
                disabled={isLoading}
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate & Print Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

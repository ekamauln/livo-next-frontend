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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReturnReport } from "@/types/report";
import { reportApi } from "@/lib/api/reportApi";
import { ApiError } from "@/lib/api/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

const RETURN_TYPES = [
  { value: "double", label: "Double" },
  { value: "retur", label: "Retur" },
  { value: "tukar", label: "Tukar" },
  { value: "gagal kirim", label: "Gagal Kirim" },
  { value: "batal", label: "Batal" },
];

export default function HandoutReturn() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedReturnType, setSelectedReturnType] = useState<string>("");
  const [returnTypeOpen, setReturnTypeOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateAndPrintReport = async () => {
    try {
      setIsLoading(true);

      // First, fetch the data
      const dateParam = date ? format(date, "yyyy-MM-dd") : undefined;
      const returnTypeParam = selectedReturnType || undefined;

      const response = await reportApi.getReturnReports(
        dateParam,
        undefined, // no search parameter
        returnTypeParam
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch return reports");
      }

      const reportData: ReturnReport[] = response.data.returns || [];

      if (reportData.length === 0) {
        let message = "No return reports found";
        const filters = [];

        if (date) {
          filters.push(`date: ${format(date, "dd MMM yyyy")}`);
        }

        if (selectedReturnType) {
          filters.push(`return type: ${selectedReturnTypeName}`);
        }

        if (filters.length > 0) {
          message += ` for ${filters.join(" and ")}`;
        }

        message +=
          ". Try adjusting your filters or selecting a different date/return type.";

        toast.warning(message);
        return;
      }

      // Then generate and show the PDF
      const doc = new jsPDF({});

      // Add title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const titleText =
        selectedReturnType && selectedReturnTypeName
          ? `Handout Report Return - ${selectedReturnTypeName}`
          : "Handout Report Return - All Types";
      doc.text(titleText, 14, 15);

      // Add filters info
      doc.setFontSize(10);
      const filterData = [];

      if (date) {
        filterData.push(["Date", format(date, "dd MMMM yyyy")]);
      }

      if (selectedReturnTypeName && selectedReturnType) {
        filterData.push(["Return Type", selectedReturnTypeName]);
      }

      filterData.push(["Total Records", `${reportData.length}`]);

      // Calculate total products (sum of all quantities)
      const totalProducts = reportData.reduce((total, item) => {
        return (
          total +
          item.return_details.reduce((itemTotal, detail) => {
            return itemTotal + detail.quantity;
          }, 0)
        );
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
            }, // Label column (Date, Return Type, etc.)
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

      // Flatten the data to show return details with products
      const tableData: (string | number)[][] = [];
      reportData.forEach((item) => {
        item.return_details.forEach((detail) => {
          tableData.push([
            tableData.length + 1,
            item.order_id, // order_ginee_id
            detail.product.name, // product name
            detail.quantity, // quantity
          ]);
        });
      });

      // Add table
      autoTable(doc, {
        head: [["No", "Order Ginee ID", "Product Name", "Quantity"]],
        body: tableData,
        startY: filterData.length > 0 ? 25 + filterData.length * 8 + 15 : 45,
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
          1: { cellWidth: 60 }, // Order Ginee ID
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
      const returnTypeParam = selectedReturnType || undefined;

      const response = await reportApi.getReturnReports(
        dateParam,
        undefined,
        returnTypeParam
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch return reports");
      }

      const reportData: ReturnReport[] = response.data.returns || [];

      if (reportData.length === 0) {
        let message = "No return reports found";
        const filters = [];

        if (date) {
          filters.push(`date: ${format(date, "dd MMM yyyy")}`);
        }

        if (selectedReturnType) {
          filters.push(`return type: ${selectedReturnTypeName}`);
        }

        if (filters.length > 0) {
          message += ` for ${filters.join(" and ")}`;
        }

        message +=
          ". Try adjusting your filters or selecting a different date/return type.";

        toast.warning(message);
        return;
      }

      // Create workbook
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Information
      const infoSheet = workbook.addWorksheet("Information");

      // Add filter information
      const infoData: string[][] = [];

      if (date) {
        infoData.push(["Date", format(date, "dd MMMM yyyy")]);
      }

      if (selectedReturnTypeName && selectedReturnType) {
        infoData.push(["Return Type", selectedReturnTypeName]);
      }

      infoData.push(["Total Records", reportData.length.toString()]);

      // Calculate total products
      const totalProducts = reportData.reduce((total, item) => {
        return (
          total +
          item.return_details.reduce((itemTotal, detail) => {
            return itemTotal + detail.quantity;
          }, 0)
        );
      }, 0);

      infoData.push(["Total Products", totalProducts.toString()]);
      infoData.push(["Generated", format(new Date(), "dd MMMM yyyy - HH:mm")]);
      infoData.push(["Picker", ""]);

      // Add data to sheet
      infoData.forEach((row, index) => {
        const excelRow = infoSheet.addRow(row);
        excelRow.height = index === infoData.length - 1 ? 30 : 20;

        // Style cells
        excelRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.font = { bold: true };
        });
      });

      // Set column widths
      infoSheet.columns = [{ width: 20 }, { width: 50 }];

      // Sheet 2: Return Data
      const dataSheet = workbook.addWorksheet("Return Data");

      // Add headers
      const headers = ["No", "Order Ginee ID", "Product Name", "Quantity"];
      const headerRow = dataSheet.addRow(headers);

      // Style header row
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { bold: true };
      });

      // Add data rows
      let rowNumber = 1;
      reportData.forEach((item) => {
        item.return_details.forEach((detail) => {
          const row = dataSheet.addRow([
            rowNumber++,
            item.order_id,
            detail.product.name,
            detail.quantity,
          ]);

          // Style data row
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
          });
        });
      });

      // Set column widths
      dataSheet.columns = [
        { width: 8 },
        { width: 25 },
        { width: 40 },
        { width: 12 },
      ];

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Handout_Return_Report_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();

      // Cleanup
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

  const selectedReturnTypeName =
    RETURN_TYPES.find((type) => type.value === selectedReturnType)?.label ||
    selectedReturnType;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Return Reports
          </CardTitle>
          <CardDescription>
            Generate and export return reports with filters for date and return
            type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Return Type Combobox */}
            <div className="space-y-2">
              <Popover open={returnTypeOpen} onOpenChange={setReturnTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="return-type"
                    variant="outline"
                    role="combobox"
                    aria-expanded={returnTypeOpen}
                    className="w-full justify-between"
                  >
                    {selectedReturnType
                      ? selectedReturnTypeName
                      : "Select return type..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search return type..." />
                    <CommandList>
                      <CommandEmpty>No return type found.</CommandEmpty>
                      <CommandGroup>
                        {RETURN_TYPES.map((returnType) => (
                          <CommandItem
                            key={returnType.value}
                            value={returnType.label}
                            onSelect={(currentValue) => {
                              const selectedType = RETURN_TYPES.find(
                                (type) => type.label === currentValue
                              );
                              const valueToSet = selectedType?.value || "";

                              setSelectedReturnType(
                                valueToSet === selectedReturnType
                                  ? ""
                                  : valueToSet
                              );
                              setReturnTypeOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedReturnType === returnType.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {returnType.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Button */}
            <div className="flex justify-start gap-2">
              <Button
                onClick={handleExportToExcel}
                disabled={isLoading || !selectedReturnType}
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
                disabled={isLoading || !selectedReturnType}
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

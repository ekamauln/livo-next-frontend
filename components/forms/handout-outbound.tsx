"use client";

import { useState, useEffect } from "react";
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
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OutboundReport } from "@/types/report";
import { Expedition } from "@/types/expedition";
import { reportApi } from "@/lib/api/reportApi";
import { expeditionApi } from "@/lib/api/expeditionApi";
import { ApiError } from "@/lib/api/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function HandoutOutbound() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedExpedition, setSelectedExpedition] = useState<string>("");
  const [expeditionOpen, setExpeditionOpen] = useState(false);

  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExpeditions, setIsLoadingExpeditions] = useState(false);

  // Fetch expeditions on component mount
  useEffect(() => {
    fetchExpeditions();
  }, []);

  const fetchExpeditions = async () => {
    try {
      setIsLoadingExpeditions(true);
      const response = await expeditionApi.getExpeditions(1, 100); // Get all expeditions
      const expeditionData = response.data.expeditions as Expedition[];

      // Remove duplicates based on name and filter out empty values
      const uniqueExpeditions =
        expeditionData?.filter(
          (expedition, index, self) =>
            expedition.name &&
            self.findIndex((e) => e.name === expedition.name) === index
        ) || [];

      setExpeditions(uniqueExpeditions);
    } catch (error) {
      console.error("Error fetching expeditions:", error);

      let errorMessage = "Failed to fetch expeditions. Please try again.";
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
      setIsLoadingExpeditions(false);
    }
  };

  const handleGenerateAndPrintReport = async () => {
    try {
      setIsLoading(true);

      // First, fetch the data
      const dateParam = date ? format(date, "yyyy-MM-dd") : undefined;
      const expeditionParam = selectedExpedition || undefined;

      const response = await reportApi.getOutboundReports(
        dateParam,
        undefined, // no search parameter
        expeditionParam
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch outbound reports");
      }

      const reportData: OutboundReport[] = response.data.outbounds || [];

      if (reportData.length === 0) {
        let message = "No outbound reports found";
        const filters = [];

        if (date) {
          filters.push(`date: ${format(date, "dd MMM yyyy")}`);
        }

        if (selectedExpedition) {
          filters.push(`expedition: ${selectedExpeditionName}`);
        }

        if (filters.length > 0) {
          message += ` for ${filters.join(" and ")}`;
        }

        message +=
          ". Try adjusting your filters or selecting a different date/expedition.";

        toast.warning(message);
        return;
      }

      // Then generate and show the PDF
      const doc = new jsPDF({});

      // Add title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const titleText =
        selectedExpedition && selectedExpeditionName
          ? `Handout Report Outbound - ${selectedExpeditionName}`
          : "Handout Report Outbound - All Expeditions";
      doc.text(titleText, 14, 15);

      // Add filters info
      doc.setFontSize(10);
      const filterData = [];

      if (date) {
        filterData.push(["Date", format(date, "dd MMMM yyyy")]);
      }

      if (selectedExpeditionName && selectedExpedition) {
        filterData.push(["Expedition", selectedExpeditionName]);
      }

      filterData.push(["Total Records", `${reportData.length}`]);

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
            }, // Label column (Date, Expedition, etc.)
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

      // Add table
      autoTable(doc, {
        head: [["No", "Tracking", "Date & Time", "Operator"]],
        body: reportData.map((item) => [
          reportData.indexOf(item) + 1,
          item.tracking,
          format(new Date(item.created_at), "dd MMM yyyy - HH:mm:ss"),
          `${item.user.full_name}`,
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

  const selectedExpeditionName =
    expeditions.find((exp) => exp.slug === selectedExpedition)?.name ||
    selectedExpedition;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Outbound Reports
          </CardTitle>
          <CardDescription>
            Generate and export outbound reports with filters for date,
            expedition.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Expedition Combobox */}
            <div className="space-y-2">
              <Popover open={expeditionOpen} onOpenChange={setExpeditionOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="expedition"
                    variant="outline"
                    role="combobox"
                    aria-expanded={expeditionOpen}
                    className="w-full justify-between"
                    disabled={isLoadingExpeditions}
                  >
                    {isLoadingExpeditions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : selectedExpedition ? (
                      selectedExpeditionName
                    ) : (
                      "Select expedition..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search expedition..." />
                    <CommandList>
                      <CommandEmpty>No expedition found.</CommandEmpty>
                      <CommandGroup>
                        {expeditions.map((expedition) => (
                          <CommandItem
                            key={expedition.id}
                            value={expedition.name}
                            onSelect={(currentValue) => {
                              const selectedExp = expeditions.find(
                                (exp) => exp.name === currentValue
                              );
                              const slugToSet = selectedExp?.slug || "";

                              setSelectedExpedition(
                                slugToSet === selectedExpedition
                                  ? ""
                                  : slugToSet
                              );
                              setExpeditionOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedExpedition === expedition.slug
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: expedition.color }}
                              />
                              {expedition.name}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Button */}
            <div className="flex justify-start">
              <Button
                onClick={handleGenerateAndPrintReport}
                disabled={isLoading || !selectedExpedition}
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

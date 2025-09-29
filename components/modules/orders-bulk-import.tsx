"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Send, Copy, FileSpreadsheet } from "lucide-react";
import { orderApi } from "@/lib/api";

// Define types locally to avoid import issues
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
type CellValue = JsonValue;
type ExcelRow = { [key: string]: JsonValue };
type WorksheetData = (string | number | boolean | null | undefined)[][];

interface OrderDetail {
  id?: number;
  sku?: string;
  product_name: string;
  variant?: string;
  quantity?: number;
}

interface Order {
  id?: number;
  order_id: string;
  status: string;
  channel?: string;
  store?: string;
  buyer?: string;
  tracking?: string;
  courier?: string;
  created_at?: string;
  updated_at?: string;
  picked_by?: string;
  picked_at?: string;
  order_details: OrderDetail[];
  "No."?: string | number;
}

interface OrdersData {
  orders: Order[];
}

// Column mappings
const ORDER_COLUMN_MAPPING: { [key: string]: string } = {
  "No.": "No.",
  "ID Pesanan": "order_id",
  Status: "status",
  Channel: "channel",
  "Nama Toko": "store",
  "Nama Pembeli": "buyer",
  "AWB/No. Tracking": "tracking",
  Kurir: "courier",
};

const DETAIL_COLUMN_MAPPING: { [key: string]: string } = {
  "Nama Produk": "product_name",
  "Variant Produk": "variant",
  SKU: "sku",
  Jumlah: "quantity",
};

export default function OrdersBulkImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState<string>("0");
  const [nestedStructure, setNestedStructure] = useState<boolean>(true);
  const [outputJson, setOutputJson] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert value to JSON serializable with proper type conversion
  const convertToJsonSerializable = (
    obj: CellValue,
    fieldName?: string
  ): JsonValue => {
    if (obj === null || obj === undefined || obj === "") return null;

    // Handle different types
    if (typeof obj === "number") return obj;

    if (typeof obj === "boolean") return obj;

    if (typeof obj === "string") {
      const trimmed = obj.trim().toLowerCase();
      if (
        trimmed === "" ||
        trimmed === "nan" ||
        trimmed === "none" ||
        trimmed === "nat"
      ) {
        return null;
      }

      // Get the original trimmed value (preserving case)
      const originalTrimmed = obj.trim();

      // Force order_id and tracking to remain as strings (to avoid precision loss with large numbers)
      if (fieldName === "order_id" || fieldName === "tracking") {
        return originalTrimmed;
      }

      // Convert quantity fields to integers
      if (fieldName === "quantity" || fieldName === "Jumlah") {
        const numValue = parseInt(originalTrimmed, 10);
        if (!isNaN(numValue)) {
          return numValue;
        }
      }

      // Try to convert numeric strings to numbers for other numeric-looking fields
      if (/^\d+(\.\d+)?$/.test(originalTrimmed)) {
        const numValue = originalTrimmed.includes(".")
          ? parseFloat(originalTrimmed)
          : parseInt(originalTrimmed, 10);
        if (!isNaN(numValue)) {
          return numValue;
        }
      }

      return originalTrimmed;
    }

    return obj as JsonValue;
  };

  // Check if value is valid (not empty, null, or placeholder text)
  const isValidValue = (value: CellValue): boolean => {
    if (value === null || value === undefined) return false;

    try {
      const strValue = String(value).trim().toLowerCase();
      return (
        strValue !== "" &&
        strValue !== "nan" &&
        strValue !== "none" &&
        strValue !== "nat" &&
        strValue !== "undefined" &&
        strValue !== "null"
      );
    } catch {
      return false;
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOutputJson("");

      // Read workbook to get sheet names
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          setAvailableSheets(workbook.SheetNames);
        } catch (error) {
          console.error("Error reading Excel file:", error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Main conversion function
  const convertExcelToJson = async () => {
    if (!selectedFile) {
      alert("Please select an Excel file.");
      return;
    }

    setIsConverting(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      // Determine which sheet to use
      let targetSheet: string;
      const sheetIndex = parseInt(sheetName);
      if (!isNaN(sheetIndex)) {
        targetSheet = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
      } else {
        targetSheet = sheetName;
      }

      if (!workbook.Sheets[targetSheet]) {
        throw new Error(`Sheet "${targetSheet}" not found`);
      }

      const worksheet = workbook.Sheets[targetSheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      }) as WorksheetData;

      if (jsonData.length === 0) {
        throw new Error("No data found in the Excel sheet");
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as WorksheetData;

      if (nestedStructure) {
        const result = convertToNestedStructure(headers, dataRows);
        setOutputJson(JSON.stringify(result, null, 2));
      } else {
        const result = convertToFlatStructure(headers, dataRows);
        setOutputJson(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      alert(
        `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    } finally {
      setIsConverting(false);
    }
  };

  // Convert to nested structure (orders with order details)
  const convertToNestedStructure = (
    headers: string[],
    dataRows: WorksheetData
  ): OrdersData => {
    const orderIdColumn = 0; // Assuming first column is order ID

    // Convert rows to objects
    const rowObjects = dataRows.map(
      (row: (string | number | boolean | null | undefined)[]) => {
        const obj: ExcelRow = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] as JsonValue;
        });
        return obj;
      }
    ); // Forward fill the order ID column (handle merged cells)
    let lastOrderId: string = "";
    rowObjects.forEach((row) => {
      const currentOrderId = row[headers[orderIdColumn]];
      if (isValidValue(currentOrderId)) {
        lastOrderId = String(currentOrderId);
        row[headers[orderIdColumn]] = lastOrderId;
      } else if (lastOrderId) {
        row[headers[orderIdColumn]] = lastOrderId;
      }
    });

    // Remove rows where all detail columns are empty
    const validRows = rowObjects.filter((row) => {
      const detailColumns = headers.filter((h) => h in DETAIL_COLUMN_MAPPING);
      return detailColumns.some((col) => isValidValue(row[col]));
    });

    // Group by order ID
    const groupedOrders: { [key: string]: ExcelRow[] } = {};
    validRows.forEach((row) => {
      const orderId = row[headers[orderIdColumn]];
      if (!groupedOrders[orderId as string]) {
        groupedOrders[orderId as string] = [];
      }
      groupedOrders[orderId as string].push(row);
    });

    const orders: Order[] = [];

    Object.entries(groupedOrders).forEach(([, group]) => {
      const firstRow = group[0];

      // Create order object with type-safe assignment
      const order: Record<string, JsonValue> = {};
      const orderColumns = headers.filter((h) => h in ORDER_COLUMN_MAPPING);

      orderColumns.forEach((col) => {
        const value = firstRow[col];
        const jsonField = ORDER_COLUMN_MAPPING[col];

        if (jsonField === "status") {
          order[jsonField] = "ready to pick"; // Force status as per Python code
        } else {
          order[jsonField] = convertToJsonSerializable(value, jsonField);
        }
      });

      // Create order details with forward-filling for product names
      const details: OrderDetail[] = [];
      let lastProductName: string | null = null;

      group.forEach((row) => {
        const detail: Record<string, JsonValue> = {};
        const detailColumns = headers.filter((h) => h in DETAIL_COLUMN_MAPPING);

        detailColumns.forEach((col) => {
          const value = row[col];
          const jsonField = DETAIL_COLUMN_MAPPING[col];

          if (isValidValue(value)) {
            detail[jsonField] = convertToJsonSerializable(value, jsonField);
            if (jsonField === "product_name") {
              lastProductName = String(
                convertToJsonSerializable(value, jsonField)
              );
            }
          } else if (jsonField === "product_name" && lastProductName) {
            detail[jsonField] = lastProductName;
          }
        });

        if (Object.keys(detail).length > 0) {
          details.push(detail as unknown as OrderDetail);
        }
      });

      order.order_details = details as unknown as JsonValue;
      orders.push(order as unknown as Order);
    });

    return { orders };
  };

  // Convert to flat structure
  const convertToFlatStructure = (
    headers: string[],
    dataRows: WorksheetData
  ): ExcelRow[] => {
    const orderIdColumn = 0;

    const rowObjects = dataRows.map(
      (row: (string | number | boolean | null | undefined)[]) => {
        const obj: ExcelRow = {};
        headers.forEach((header, index) => {
          obj[header] = convertToJsonSerializable(row[index] ?? null, header);
        });
        return obj;
      }
    );

    // Forward fill the order ID column
    let lastOrderId: string = "";
    rowObjects.forEach((row) => {
      const currentOrderId = row[headers[orderIdColumn]];
      if (isValidValue(currentOrderId)) {
        lastOrderId = String(currentOrderId);
        row[headers[orderIdColumn]] = lastOrderId;
      } else if (lastOrderId) {
        row[headers[orderIdColumn]] = lastOrderId;
      }
    });

    // Remove rows where all detail columns are empty
    return rowObjects.filter((row) => {
      const detailColumns = headers.slice(1); // All columns except first
      return detailColumns.some((col) => isValidValue(row[col]));
    });
  };

  // Copy JSON to clipboard
  const copyToClipboard = async () => {
    if (!outputJson) {
      toast.error("No content to copy. Please convert a file first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(outputJson);
      toast.success("JSON content copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard. Please try again.");
    }
  };

  // Send JSON to API
  const sendToApi = async () => {
    if (!outputJson) {
      toast.error("No data to send. Please convert a file first.");
      return;
    }

    setIsSending(true);

    try {
      const parsedData = JSON.parse(outputJson);
      const result = await orderApi.bulkImportOrders(parsedData);

      // Extract summary information from the API response
      const summary = result.data?.summary;
      if (summary) {
        toast.success("Data sent to API successfully!", {
          description: `Created: ${summary.created}, Failed: ${summary.failed}, Skipped: ${summary.skipped}, Total: ${summary.total}`,
          duration: 6000, // Show for 6 seconds for better readability
        });

        // Show additional warnings if there are failed or skipped orders
        if (summary.failed > 0) {
          toast.warning(`${summary.failed} orders failed to process`, {
            description:
              "Check the API response for details about failed orders.",
            duration: 5000,
          });
        }

        if (summary.skipped > 0) {
          toast.info(`${summary.skipped} orders were skipped`, {
            description: "These orders may already exist in the database.",
            duration: 5000,
          });
        }
      } else {
        // Fallback for responses without summary structure
        toast.success("Successfully sent data to API!", {
          description: `Response: ${JSON.stringify(result)}`,
        });
      }
    } catch (error) {
      console.error("Failed to send to API:", error);
      toast.error("Failed to send data to API", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pt-0 space-y-6">
      {/* File Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="file-upload" className="text-sm font-semibold">
          Excel File:
        </Label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <RippleButton
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Upload className="size-4" />
                <span className="font-bold">Browse</span>
              </RippleButton>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet size={16} />
                  {selectedFile.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Selection */}
      {availableSheets.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="sheet-select" className="text-sm font-semibold">
            Sheet:
          </Label>
          <Select value={sheetName} onValueChange={setSheetName}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a sheet" />
            </SelectTrigger>
            <SelectContent>
              {availableSheets.map((sheet, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {sheet} (Index: {index})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="nested-structure"
            checked={nestedStructure}
            onCheckedChange={(checked) =>
              setNestedStructure(checked as boolean)
            }
            className="cursor-pointer"
          />
          <Label
            htmlFor="nested-structure"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Create nested structure (Orders with Order Details)
          </Label>
        </div>
      </div>

      {/* Convert Button */}
      <RippleButton
        onClick={convertExcelToJson}
        disabled={!selectedFile || isConverting}
        className="w-full cursor-pointer"
      >
        {isConverting ? "Converting..." : "Convert"}
      </RippleButton>

      {/* Output Section */}
      {outputJson && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="text-lg font-semibold">Output JSON:</Label>
            <div className="flex gap-2">
              <RippleButton
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Copy className="size-4" />
                <span className="font-bold">Copy</span>
              </RippleButton>
              <RippleButton
                onClick={sendToApi}
                variant="outline"
                disabled={isSending}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Send className="size-4" />
                {isSending ? "Sending..." : "Send to API"}
              </RippleButton>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-auto border">
            <pre className="text-sm whitespace-pre-wrap break-words">
              {outputJson}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

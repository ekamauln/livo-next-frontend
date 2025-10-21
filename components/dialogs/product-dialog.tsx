"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn-io/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  Package,
  Settings,
  Download,
  Upload,
  PackageOpen,
  ScanBarcode,
  ScanQrCode,
} from "lucide-react";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { productApi } from "@/lib/api/productApi";
import { Product } from "@/types/product";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

// Form schemas
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  variant: z.string().min(1, "Variant is required"),
  image: z
    .string()
    .min(1, "Please enter a valid URL or upload an image")
    .refine(
      (value) => {
        // Allow URLs (http/https) or relative paths starting with /
        return (
          value.startsWith("http://") ||
          value.startsWith("https://") ||
          value.startsWith("/")
        );
      },
      {
        message: "Please enter a valid URL or upload an image",
      }
    ),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "detail" | "profile" | "barcode1d" | "barcode2d";
  onProductUpdate?: () => void;
}

export function ProductDialog({
  productId,
  open,
  onOpenChange,
  initialTab = "detail",
  onProductUpdate,
}: ProductDialogProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updating, setUpdating] = useState(false);
  const [generatingBarcodes, setGeneratingBarcodes] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Barcode state
  const [barcode1D, setBarcode1D] = useState<string>("");
  const [barcode2D, setBarcode2D] = useState<string>("");

  // Product form
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      variant: "",
      image: "",
    },
  });

  // Fetch product details
  const fetchProductDetail = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await productApi.getProductById(id);
        const productData = response.data;
        setProduct(productData);
        // Update product form with data
        productForm.reset({
          name: productData.name,
          variant: productData.variant,
          image: productData.image,
        });
      } catch (error) {
        console.error("Error fetching product details:", error);
        toast.error("Failed to fetch product details", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    },
    [productForm]
  );

  // Update product
  const updateProduct = async (data: ProductFormData) => {
    if (!productId) return;

    try {
      setUpdating(true);
      const response = await productApi.updateProduct(productId, {
        name: data.name,
        variant: data.variant,
        image: data.image,
      });

      toast.success("Product updated successfully");
      // Update local product state with the returned data
      setProduct(response.data);
      // Also update the form with the new data
      productForm.reset({
        name: response.data.name,
        variant: response.data.variant,
        image: response.data.image,
      });
      onProductUpdate?.();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Generate 1D Barcode using JsBarcode
  const generate1DBarcode = useCallback((sku: string) => {
    try {
      // Create a canvas element to generate the barcode
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, sku, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 12,
        margin: 10,
      });
      const dataURL = canvas.toDataURL("image/png");
      setBarcode1D(dataURL);
    } catch (error) {
      console.error("Error generating 1D barcode:", error);
      toast.error("Failed to generate 1D barcode");
    }
  }, []);

  // Generate 2D Barcode using QRCode
  const generate2DBarcode = useCallback(async (sku: string) => {
    try {
      // First generate the QR code
      const qrDataURL = await QRCode.toDataURL(sku, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Create a canvas to combine QR code with text
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Set canvas size (QR code + space for text)
      canvas.width = 200;
      canvas.height = 230;

      // Fill white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and draw the QR code
      const qrImage = document.createElement("img");
      qrImage.onload = () => {
        // Draw QR code centered horizontally
        const qrX = (canvas.width - qrImage.width) / 2;
        ctx.drawImage(qrImage, qrX, 10);

        // Add SKU text below QR code
        ctx.fillStyle = "#000000";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        const textY = qrImage.height + 20;
        ctx.fillText(sku, canvas.width / 2, textY);

        // Convert to data URL and set state
        const finalDataURL = canvas.toDataURL("image/png");
        setBarcode2D(finalDataURL);
      };

      qrImage.onerror = () => {
        throw new Error("Failed to load QR code image");
      };

      qrImage.src = qrDataURL;
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  }, []);

  // Download barcode
  const downloadBarcode = (dataURL: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} downloaded successfully`);
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update the form with the new image URL
        productForm.setValue("image", result.url);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUploading(false);
      // Clear the input so the same file can be selected again if needed
      event.target.value = "";
    }
  };

  // Effects
  useEffect(() => {
    if (open && productId) {
      fetchProductDetail(productId);
      setActiveTab(initialTab);
    } else {
      setProduct(null);
      productForm.reset({
        name: "",
        variant: "",
        image: "",
      });
      setBarcode1D("");
      setBarcode2D("");
      setGeneratingBarcodes(false);
      setUploading(false);
    }
  }, [open, productId, initialTab, fetchProductDetail, productForm]);

  // Generate barcodes when product data changes
  useEffect(() => {
    if (
      product?.sku &&
      (activeTab === "barcode1d" || activeTab === "barcode2d")
    ) {
      const generateBarcodes = async () => {
        setGeneratingBarcodes(true);
        try {
          if (activeTab === "barcode1d") {
            generate1DBarcode(product.sku);
          } else if (activeTab === "barcode2d") {
            await generate2DBarcode(product.sku);
          }
        } catch (error) {
          console.error("Error generating barcodes:", error);
        } finally {
          setGeneratingBarcodes(false);
        }
      };

      generateBarcodes();
    }
  }, [product?.sku, activeTab, generate1DBarcode, generate2DBarcode]);

  // Update form when product data changes
  useEffect(() => {
    if (product) {
      productForm.reset({
        name: product.name,
        variant: product.variant,
        image: product.image,
      });
    }
  }, [product, productForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span className="truncate">
              {loading
                ? "Loading..."
                : product
                ? `${product.name}`
                : "Product Details"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {product
              ? `Manage product details for ${product.sku}`
              : "View and manage product information"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading product details...
          </div>
        ) : product ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(
                value as "detail" | "profile" | "barcode1d" | "barcode2d"
              )
            }
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="detail" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Edit Product
              </TabsTrigger>
              <TabsTrigger
                value="barcode1d"
                className="flex items-center gap-2"
              >
                <ScanBarcode className="h-4 w-4" />
                1D Barcode
              </TabsTrigger>
              <TabsTrigger
                value="barcode2d"
                className="flex items-center gap-2"
              >
                <ScanQrCode className="h-4 w-4" />
                2D Barcode
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0 mt-4">
              <TabsContents>
                {/* Product Details Tab */}
                <TabsContent value="detail" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PackageOpen className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">Detail Information</span>
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="w-1/4">
                                Product ID
                              </TableCell>
                              <TableCell className="font-mono">
                                {product.id}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">SKU</TableCell>
                              <TableCell className="font-mono">
                                {product.sku}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Name</TableCell>
                              <TableCell className="text-wrap">
                                {product.name}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Variant</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {product.variant}
                                </Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Location</TableCell>
                              <TableCell>
                                {product.location || (
                                  <span className="text-muted-foreground">
                                    Not specified
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Barcode</TableCell>
                              <TableCell>
                                {product.barcode || (
                                  <span className="text-muted-foreground">
                                    Not specified
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Image</TableCell>
                              <TableCell>
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={64}
                                    height={64}
                                    className="rounded-md"
                                  />
                                ) : (
                                  <span className="text-muted-foreground">
                                    No image
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="w-1/4">Created</TableCell>
                              <TableCell>
                                {format(
                                  new Date(product.created_at),
                                  "dd MMMM yyyy - HH:mm"
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Product Tab */}
                <TabsContent value="profile" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">
                          Edit Product Information
                        </span>
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <Form {...productForm}>
                        <form
                          onSubmit={productForm.handleSubmit(updateProduct)}
                          className="space-y-6"
                        >
                          <FormField
                            control={productForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter product name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={productForm.control}
                            name="variant"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Variant</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter variant"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={productForm.control}
                            name="image"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Image</FormLabel>
                                <FormControl>
                                  <div className="space-y-4">
                                    <Input
                                      type="text"
                                      placeholder="Enter image URL or upload a file below"
                                      {...field}
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        or
                                      </span>
                                      <RippleButton
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploading}
                                        onClick={() =>
                                          document
                                            .getElementById("file-upload")
                                            ?.click()
                                        }
                                        className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent/90 all duration-300 ease-in-out"
                                      >
                                        {uploading ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Upload className="h-4 w-4 mr-2" />
                                        )}
                                        {uploading
                                          ? "Uploading..."
                                          : "Upload Image"}
                                      </RippleButton>
                                      <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={uploading}
                                      />
                                    </div>
                                    {field.value && (
                                      <div className="mt-2">
                                        <Image
                                          src={field.value}
                                          alt="Product preview"
                                          width={100}
                                          height={100}
                                          className="rounded-md"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                <FormDescription className="text-xs text-yellow-500">
                                  * Enter a direct image URL or upload an image
                                  file. Uploaded images will be saved to
                                  /images/products/.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <RippleButton
                              size="sm"
                              type="button"
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => setActiveTab("detail")}
                            >
                              Cancel
                            </RippleButton>
                            <RippleButton
                              size="sm"
                              type="submit"
                              disabled={updating}
                              className="cursor-pointer"
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Update Product
                            </RippleButton>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Generate 1D Barcode Tab */}
                <TabsContent value="barcode1d" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ScanBarcode className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">Generate 1D Barcode</span>
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                        {generatingBarcodes ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Generating barcode...
                          </div>
                        ) : barcode1D ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={barcode1D}
                              alt="1D Barcode"
                              className="border"
                            />
                            <RippleButton
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                downloadBarcode(
                                  barcode1D,
                                  `${product.sku}_1D_barcode.png`
                                )
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download 1D Barcode
                            </RippleButton>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">
                              Switch to this tab to generate 1D barcode
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Generate 2D Barcode Tab */}
                <TabsContent value="barcode2d" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ScanQrCode className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">Generate 2D Barcode</span>
                      </CardTitle>
                      <Separator
                        orientation="horizontal"
                        className="mt-2 data-[orientation=horizontal]"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                        {generatingBarcodes ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Generating QR code...
                          </div>
                        ) : barcode2D ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={barcode2D}
                              alt="QR Code"
                              className="border"
                            />
                            <RippleButton
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                downloadBarcode(
                                  barcode2D,
                                  `${product.sku}_2D_barcode.png`
                                )
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download 2D Barcode
                            </RippleButton>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">
                              Switch to this tab to generate QR code
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </TabsContents>
            </div>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No product selected or product not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

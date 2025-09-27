import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { House } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/contexts/protected-route";
import ProductsTable from "@/components/tables/products-table";

export default function Products() {
  return (
    <ProtectedRoute requiredRoles={["admin", "coordinator"]}>
      <div>
        <header className="flex h-16 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <Link href="/">
              <House className="h-4 w-4" />
            </Link>
            {/* Icon */}
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage className="hidden md:block">
                  Users
                </BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="w-full p-10 pt-0">
          <Card className="relative p-6 space-y-2">
            <h1 className="text-2xl font-semibold">Products Data List</h1>
            <Separator className="mt-0" />
            <ProductsTable />
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

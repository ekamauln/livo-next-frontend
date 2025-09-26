import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { House } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/contexts/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
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
                <BreadcrumbPage className="hidden md:block">
                  Dashboard
                </BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </div>
    </ProtectedRoute>
  );
}

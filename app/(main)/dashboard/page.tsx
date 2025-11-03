"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { House } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/contexts/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Highlighter } from "@/components/ui/highlighter";
import { UserChargeFeeWidget } from "@/components/widgets/user-charge-fee-widget";
import { MbOnlinesChartWidget } from "@/components/widgets/mb-onlines-chart-widget";
import { OutboundsChartWidget } from "@/components/widgets/outbounds-chart-widget";
import { QcOnlinesChartWidget } from "@/components/widgets/qc-onlines-chart-widget";
import { PcOnlinesChartWidget } from "@/components/widgets/pc-onlines-chart-widget";
import { MbRibbonsChartWidget } from "@/components/widgets/mb-ribbons-chart-widget";
import { QcRibbonsChartWidget } from "@/components/widgets/qc-ribbons-chart-widget";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns/format";

// Role-specific badge styling
const getRoleBadgeStyle = (roleName: string) => {
  const roleStyles: Record<string, string> = {
    superadmin:
      "bg-purple-600 text-white hover:bg-purple-700 border-purple-600",
    coordinator: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
    admin: "bg-red-600 text-white hover:bg-red-700 border-red-600",
    finance: "bg-green-600 text-white hover:bg-green-700 border-green-600",
    picker: "bg-orange-500 text-white hover:bg-orange-600 border-orange-500",
    outbound: "bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-500",
    "qc-ribbon":
      "bg-indigo-500 text-white hover:bg-indigo-600 border-indigo-500",
    "qc-online":
      "bg-violet-500 text-white hover:bg-violet-600 border-violet-500",
    "mb-ribbon": "bg-pink-500 text-white hover:bg-pink-600 border-pink-500",
    "mb-online": "bg-rose-500 text-white hover:bg-rose-600 border-rose-500",
    packing: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500",
    guest: "bg-gray-500 text-white hover:bg-gray-600 border-gray-500",
  };

  return (
    roleStyles[roleName.toLowerCase()] ||
    "bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
  );
};

export default function Page() {
  const { user } = useAuth();

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
          <p className="mt-2">
            Welcome back,{" "}
            <Highlighter action="underline" color="#FF9800">
              {user?.full_name || user?.username}
            </Highlighter>
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md gap-4">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="w-1/4">ID</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.id}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Username</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.username}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Email</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.email}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Full Name</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.full_name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Status</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          <Badge
                            variant={user?.is_active ? "default" : "secondary"}
                          >
                            {user?.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Created</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.created_at
                            ? format(user.created_at, "dd MMMM yyyy - HH:mm")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Roles */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user?.roles?.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <div>
                        <p className="font-medium capitalize">{role.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`font-bold ${getRoleBadgeStyle(role.name)}`}
                      >
                        {role.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {/* MB Onlines Chart Widget */}
            <div>
              <MbOnlinesChartWidget />
            </div>

            {/* QC Onlines Chart Widget */}
            <div>
              <QcOnlinesChartWidget />
            </div>

            {/* PC Onlines Chart Widget */}
            <div>
              <PcOnlinesChartWidget />
            </div>
          </div>

          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {/* MB Ribbons Chart Widget */}
            <div>
              <MbRibbonsChartWidget />
            </div>

            {/* QC Ribbons Chart Widget */}
            <div>
              <QcRibbonsChartWidget />
            </div>

            {/* Outbounds Chart Widget */}
            <div>
              <OutboundsChartWidget />
            </div>
          </div>

          {/* User Charge Fee Widget */}
          {user?.id && (
            <div>
              <UserChargeFeeWidget userId={user.id} />
            </div>
          )}

          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </div>
    </ProtectedRoute>
  );
}

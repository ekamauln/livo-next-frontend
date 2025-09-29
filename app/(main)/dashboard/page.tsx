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

// Role-specific badge styling
const getRoleBadgeStyle = (roleName: string) => {
  const roleStyles: Record<string, string> = {
    "superadmin": "bg-purple-600 text-white hover:bg-purple-700 border-purple-600",
    "coordinator": "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
    "admin": "bg-red-600 text-white hover:bg-red-700 border-red-600",
    "finance": "bg-green-600 text-white hover:bg-green-700 border-green-600",
    "picker": "bg-orange-500 text-white hover:bg-orange-600 border-orange-500",
    "outbound": "bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-500",
    "qc-ribbon": "bg-indigo-500 text-white hover:bg-indigo-600 border-indigo-500",
    "qc-online": "bg-violet-500 text-white hover:bg-violet-600 border-violet-500",
    "mb-ribbon": "bg-pink-500 text-white hover:bg-pink-600 border-pink-500",
    "mb-online": "bg-rose-500 text-white hover:bg-rose-600 border-rose-500",
    "packing": "bg-amber-500 text-white hover:bg-amber-600 border-amber-500",
    "guest": "bg-gray-500 text-white hover:bg-gray-600 border-gray-500",
  };
  
  return roleStyles[roleName.toLowerCase()] || "bg-gray-500 text-white hover:bg-gray-600 border-gray-500";
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
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.full_name || user?.username}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Username
                    </p>
                    <p className="text-sm">{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </p>
                    <p className="text-sm">{user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <Badge variant={user?.is_active ? "default" : "secondary"}>
                      {user?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

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

            {/* <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" /> */}
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  FolderUp,
  LogOut,
  Package,
  PackageOpen,
  ScrollText,
  ShoppingBag,
  SquareUser,
  Store,
  Truck,
  Tv,
  User,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { RippleButton } from "@/components/ui/shadcn-io/ripple-button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ThemeToggleButton,
  useThemeTransition,
} from "@/components/ui/shadcn-io/theme-toggle-button";

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

export default function AppNavbar() {
  const { theme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Show success even if API fails
    } finally {
      router.replace("/auth/login");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    startTransition(() => {
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
    });
  };

  const currentTheme =
    theme === "system" ? "light" : (theme as "light" | "dark");

  if (!mounted) {
    return null;
  }

  return (
    <header className="flex h-16 justify-between items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <div className="font-bold">
          <Link href="/dashboard">LIVOTECH</Link>
        </div>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <Menubar>
            {/* Admin menus */}
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">
                Coordinator Menu
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/coordinator/boxes">
                    <PackageOpen className="h-4 w-4" />
                    Boxes
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/coordinator/channels">
                    <Tv className="h-4 w-4" />
                    Channels
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/coordinator/expeditions">
                    <Truck className="h-4 w-4" />
                    Expeditions
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/coordinator/products">
                    <Package className="h-4 w-4" />
                    Products
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/coordinator/stores">
                    <Store className="h-4 w-4" />
                    Stores
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/coordinator/users">
                    <SquareUser className="h-4 w-4" />
                    Users
                  </Link>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            {/* Orders menu */}
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">Orders</MenubarTrigger>
              <MenubarContent>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/orders/orders">
                    <ScrollText className="h-4 w-4" />
                    Orders
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/orders/orders-import">
                    <FolderUp className="h-4 w-4" />
                    Orders Import
                  </Link>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            {/* Ribbons menu */}
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">
                Ribbons
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/ribbons/mb-ribbons">
                    <ShoppingBag className="h-4 w-4" />
                    MB Ribbons
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/ribbons/qc-ribbons">
                    <ShoppingBag className="h-4 w-4" />
                    QC Ribbons
                  </Link>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/ribbons/ribbon-flows">
                    <ShoppingBag className="h-4 w-4" />
                    Ribbon Flows
                  </Link>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            {/* Onlines menu */}
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">Online</MenubarTrigger>
              <MenubarContent>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/onlines/mb-onlines">
                    <ShoppingBag className="h-4 w-4" />
                    MB Onlines
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/onlines/qc-onlines">
                    <ShoppingBag className="h-4 w-4" />
                    QC Onlines
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/onlines/pc-onlines">
                    <ShoppingBag className="h-4 w-4" />
                    PC Onlines
                  </Link>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/onlines/online-flows">
                    <ShoppingBag className="h-4 w-4" />
                    Online Flows
                  </Link>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            {/* Outbounds menu */}
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">
                Outbounds
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/outbounds/input-outbounds">
                    <ShoppingBag className="h-4 w-4" />
                    Input Outbounds
                  </Link>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4">
        <div className="flex items-center text-right">
          <ThemeToggleButton
            theme={currentTheme}
            onClick={handleThemeToggle}
            variant="circle-blur"
            start="top-right"
            className="cursor-pointer"
          />

          {/* <ModeToggle /> */}
        </div>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-6"
        />
        <div className="flex items-center justify-end text-right text-sm">
          <User className="mr-2 size-4" />
          <span className="truncate font-semibold text-left mr-2">
            Welcome, {user?.full_name || user?.username}
          </span>
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-6"
          />
          <span className="truncate text-xs text-left">
            {user?.roles && user.roles.length > 0 && (
              <div className="flex gap-1">
                {user.roles.map((role, index) => (
                  <Badge
                    variant="secondary"
                    key={role.id || index}
                    className={`text-xs font-bold hover:translate-y-[-4px] transition-all duration-300 ease-in-out ${getRoleBadgeStyle(
                      role.name
                    )}`}
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
            )}
          </span>
        </div>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-6"
        />
        <RippleButton
          onClick={handleLogout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </RippleButton>
      </div>
    </header>
  );
}

"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  FolderUp,
  ListOrdered,
  LogOut,
  Package,
  SquareUser,
  User,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ThemeToggleButton,
  useThemeTransition,
} from "@/components/ui/shadcn-io/theme-toggle-button";

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
                  <Link href="/coordinator/users">
                    <SquareUser className="h-4 w-4" />
                    Users
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/superadmin/products-list">
                    <Package className="h-4 w-4" />
                    Products List
                  </Link>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            {/* Orders menu */}
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">Orders</MenubarTrigger>
              <MenubarContent>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/orders/orders-list">
                    <ListOrdered className="h-4 w-4" />
                    Orders List
                  </Link>
                </MenubarItem>
                <MenubarItem asChild className="cursor-pointer">
                  <Link href="/orders/order-imports">
                    <FolderUp className="h-4 w-4" />
                    Orders Import
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
                    variant="default"
                    key={role.id || index}
                    className="text-xs font-bold hover:translate-y-[-4px] transition-all duration-300 ease-in-out"
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
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2 cursor-pointer hover:translate-y-[-4px] all duration-300 ease-in-out"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}

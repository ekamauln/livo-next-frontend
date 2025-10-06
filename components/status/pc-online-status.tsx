"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";
import { authApi } from "@/lib/api/authApi";
import { User as UserType } from "@/types/auth";

interface PcOnlineStatusProps {
  totalRecords: number;
  target?: number;
}

export function PcOnlineStatus({
  totalRecords,
  target = 3000,
}: PcOnlineStatusProps) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // First try to get from localStorage
        const userData = localStorage.getItem("user_data");
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        } else {
          // If not in localStorage, fetch from API
          const response = await authApi.getProfile();
          if (response.success) {
            setCurrentUser(response.data);
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const progressPercentage = Math.min((totalRecords / target) * 100, 100);
  const remaining = Math.max(target - totalRecords, 0);

  // Get role badge style function (consistent with other components)
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

  if (isLoading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 rounded border border-border"></div>
          <div className="h-6 rounded border border-border"></div>
          <div className="h-4 rounded w-3/4 border border-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Operator Information */}
      {currentUser && (
        <div className="flex items-center gap-3 p-3 rounded-md border border-border">
          <User className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">{currentUser.full_name}</p>
            <p className="text-sm text-muted-foreground">
              @{currentUser.username}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentUser.roles?.map((role) => (
              <Badge
                key={role.id}
                variant="outline"
                className={`text-xs ${getRoleBadgeStyle(role.name)}`}
              >
                {role.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="space-y-3 mt-6">
        <Progress value={progressPercentage} className="h-3" />

        <div className="flex items-center justify-between text-sm">
          <span className="text-primary font-medium">
            {progressPercentage.toFixed(1)}% Complete
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{remaining.toLocaleString()} remaining</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-2">
        <div
          className={`w-3 h-3 rounded-full ${
            progressPercentage >= 100
              ? "bg-green-500"
              : progressPercentage >= 75
              ? "bg-yellow-500"
              : "bg-blue-500"
          }`}
        />
        <span className="text-sm font-medium">
          {progressPercentage >= 100
            ? "Target Achieved!"
            : progressPercentage >= 75
            ? "Nearly There!"
            : "In Progress"}
        </span>
      </div>
    </div>
  );
}

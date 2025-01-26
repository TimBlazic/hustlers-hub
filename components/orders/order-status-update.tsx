"use client";

import * as React from "react";
import { OrderStatus } from "@prisma/client";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  Hourglass,
  FileCheck,
  Star,
  XCircle,
} from "lucide-react";

interface OrderStatusUpdateProps {
  currentStatus: OrderStatus;
  onUpdateStatus: (newStatus: OrderStatus) => Promise<void>;
  userRole: "buyer" | "seller";
  order: {
    id: string;
    buyerId: string;
  };
}

// Definiramo tip za statusFlow
type StatusFlowType = {
  [K in OrderStatus]?: readonly OrderStatus[];
};

const statusFlow: StatusFlowType = {
  PAID: ["STARTED"],
  STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["REVIEW"],
  REVIEW: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: [],
  CANCELLED: [],
} as const;

// Definiramo tip za statusColors
type StatusColorsType = {
  [K in OrderStatus]: string;
};

const statusColors: StatusColorsType = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
  PAID: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
  STARTED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200",
  IN_PROGRESS:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200",
  REVIEW:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
} as const;

// Definiramo tip za statusConfig
type StatusConfigType = {
  [K in OrderStatus]: {
    label: string;
    color: string;
    icon: React.ElementType;
  };
};

const statusConfig: StatusConfigType = {
  PENDING: {
    label: "Pending",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    icon: Clock,
  },
  PAID: {
    label: "Paid",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-100",
    icon: CheckCircle2,
  },
  STARTED: {
    label: "Started",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-100",
    icon: PlayCircle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100",
    icon: Hourglass,
  },
  REVIEW: {
    label: "In Review",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-100",
    icon: FileCheck,
  },
  COMPLETED: {
    label: "Completed",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-100",
    icon: Star,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-100",
    icon: XCircle,
  },
} as const;

// Dodamo logiko za preverjanje preteklih statusov
const getStatusProgress = (
  status: OrderStatus,
  currentStatus: OrderStatus
): "completed" | "current" | "upcoming" => {
  const order: OrderStatus[] = [
    "PAID",
    "STARTED",
    "IN_PROGRESS",
    "REVIEW",
    "COMPLETED",
  ];
  const currentIndex = order.indexOf(currentStatus);
  const statusIndex = order.indexOf(status);

  if (statusIndex < 0 || currentIndex < 0) return "upcoming";
  if (statusIndex < currentIndex) return "completed";
  if (statusIndex === currentIndex) return "current";
  return "upcoming";
};

export function OrderStatusUpdate({
  currentStatus,
  onUpdateStatus,
  userRole,
  order,
}: OrderStatusUpdateProps) {
  const availableStatuses = statusFlow[currentStatus] || [];
  const config = statusConfig[currentStatus];
  const colorClass = statusColors[currentStatus];

  const createNotification = async (newStatus: OrderStatus) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "STATUS_CHANGE",
          content: `Order status changed to ${statusConfig[newStatus].label}`,
          orderId: order.id,
          userId: order.buyerId,
        }),
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      await onUpdateStatus(newStatus);
      await createNotification(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {userRole === "seller" ? "Update Status" : "Current Status"}
      </h2>

      <div className="space-y-4">
        {/* Current Status Badge */}
        <div className="flex items-center gap-2">
          <config.icon className="w-5 h-5" />
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
          >
            {config.label}
          </span>
        </div>

        {/* Status Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {userRole === "seller"
            ? "As a seller, you can update the order status below."
            : "The seller will update the status as they progress with your order."}
        </p>

        {/* Status Update Buttons - Only for Seller */}
        {userRole === "seller" && availableStatuses.length > 0 && (
          <div className="space-y-3 mt-4">
            {availableStatuses.map((status) => {
              const statusConf = statusConfig[status];
              return (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <statusConf.icon className="w-4 h-4" />
                  Mark as {statusConf.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Status Timeline */}
        {userRole === "buyer" && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Order Progress
            </h3>
            <div className="space-y-3">
              {["PAID", "STARTED", "IN_PROGRESS", "REVIEW", "COMPLETED"].map(
                (status) => {
                  const conf = statusConfig[status as OrderStatus];
                  const progress = getStatusProgress(
                    status as OrderStatus,
                    currentStatus
                  );

                  return (
                    <div
                      key={status}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        progress === "current"
                          ? conf.color
                          : progress === "completed"
                          ? "bg-green-50 dark:bg-green-900/10"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      {progress === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <conf.icon
                          className={`w-5 h-5 ${
                            progress === "current"
                              ? ""
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        />
                      )}
                      <span
                        className={`text-sm ${
                          progress === "current"
                            ? "font-medium"
                            : progress === "completed"
                            ? "text-green-700 dark:text-green-300"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {conf.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Status Timeline for Seller */}
        {userRole === "seller" && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Status History
            </h3>
            <div className="space-y-3">
              {Object.entries(statusConfig).map(([key, conf]) => {
                const status = key as OrderStatus;
                const isActive = currentStatus === status;

                return (
                  <div
                    key={status}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isActive ? conf.color : "bg-gray-50 dark:bg-gray-800/50"
                    }`}
                  >
                    <conf.icon
                      className={`w-5 h-5 ${
                        isActive ? "" : "text-gray-400 dark:text-gray-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isActive ? "" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {conf.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

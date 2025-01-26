"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

interface OrdersListProps {
  orders: {
    id: string;
    status: OrderStatus;
    amount: number;
    createdAt: Date;
    signature: string | null;
    gig: {
      id: string;
      title: string;
      images: string[];
      seller: {
        name: string | null;
        pfp_url: string | null;
      };
    };
    buyer: {
      name: string | null;
      pfp_url: string | null;
    };
    messages: {
      content: string;
      createdAt: Date;
    }[];
  }[];
  userRole: "buying" | "selling";
}

export function OrdersList({ orders, userRole }: OrdersListProps) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No orders yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {userRole === "buying"
            ? "Start exploring gigs and make your first order!"
            : "You haven't received any orders yet."}
        </p>
        {userRole === "buying" && (
          <Link
            href="/gigs"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800"
          >
            Browse Gigs
          </Link>
        )}
      </div>
    );
  }

  const handleOrderClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div
          key={order.id}
          onClick={() => handleOrderClick(order.id)}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                    {order.gig.images[0] ? (
                      <Image
                        src={order.gig.images[0]}
                        alt={order.gig.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    <Link href={`/orders/${order.id}`}>{order.gig.title}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {userRole === "buying"
                      ? `Seller: ${order.gig.seller.name || "Anonymous"}`
                      : `Buyer: ${order.buyer.name || "Anonymous"}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {order.amount} SOL
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <OrderStatusBadge status={order.status} />
                {order.messages[0] && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Last message: {order.messages[0].content.slice(0, 50)}
                    {order.messages[0].content.length > 50 ? "..." : ""}
                  </span>
                )}
              </div>
              {order.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${order.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  View Transaction ↗
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusConfig = {
    PENDING: {
      color: "yellow",
      label: "Pending Payment",
    },
    PAID: {
      color: "blue",
      label: "Paid",
    },
    STARTED: {
      color: "purple",
      label: "Started",
    },
    IN_PROGRESS: {
      color: "indigo",
      label: "In Progress",
    },
    REVIEW: {
      color: "orange",
      label: "In Review",
    },
    COMPLETED: {
      color: "green",
      label: "Completed",
    },
    CANCELLED: {
      color: "red",
      label: "Cancelled",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/20 dark:text-${config.color}-200`}
    >
      {config.label}
    </span>
  );
}

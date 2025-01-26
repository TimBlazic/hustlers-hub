"use client";

import { OrderStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface OrderTimelineProps {
  order: {
    status: OrderStatus;
    createdAt: Date;
    messages: {
      id: string;
      content: string;
      createdAt: Date;
      user: {
        name: string | null;
        pfp_url: string | null;
      };
    }[];
  };
}

const timelineConfig = {
  PAID: {
    icon: "💰",
    title: "Payment Received",
    description: "Payment has been confirmed on the blockchain",
  },
  STARTED: {
    icon: "🎯",
    title: "Work Started",
    description: "Seller has started working on the order",
  },
  IN_PROGRESS: {
    icon: "⚡",
    title: "In Progress",
    description: "Work is actively being done",
  },
  REVIEW: {
    icon: "👀",
    title: "In Review",
    description: "Work is ready for review",
  },
  COMPLETED: {
    icon: "✅",
    title: "Completed",
    description: "Order has been completed successfully",
  },
  CANCELLED: {
    icon: "❌",
    title: "Cancelled",
    description: "Order has been cancelled",
  },
} as const;

export function OrderTimeline({ order }: OrderTimelineProps) {
  const events = [
    {
      ...timelineConfig.PAID,
      date: order.createdAt,
    },
    ...order.messages
      .filter((msg) => msg.content.includes("status changed to"))
      .map((msg) => ({
        icon: "📝",
        title: msg.content,
        description: `Updated by ${msg.user.name || "Anonymous"}`,
        date: msg.createdAt,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Order Timeline
      </h2>
      <div className="flow-root">
        <ul className="-mb-8">
          {events.map((event, eventIdx) => (
            <li key={eventIdx}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                      <span className="text-lg" aria-hidden="true">
                        {event.icon}
                      </span>
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {event.description}
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(event.date), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

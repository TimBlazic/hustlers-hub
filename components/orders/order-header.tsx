"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { OrderStatus } from "@prisma/client";

interface OrderHeaderProps {
  order: {
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
  };
  userRole: "buyer" | "seller";
}

export function OrderHeader({ order, userRole }: OrderHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="relative h-16 w-16 rounded-lg overflow-hidden">
              {order.gig.images[0] ? (
                <Image
                  src={order.gig.images[0]}
                  alt={order.gig.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              <Link href={`/gigs/${order.gig.id}`} className="hover:underline">
                {order.gig.title}
              </Link>
            </h1>
            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {userRole === "buyer"
                  ? `Seller: ${order.gig.seller.name || "Anonymous"}`
                  : `Buyer: ${order.buyer.name || "Anonymous"}`}
              </span>
              <span>•</span>
              <span>
                Ordered{" "}
                {formatDistanceToNow(new Date(order.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {order.amount} SOL
          </p>
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
  );
}

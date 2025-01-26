"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";

interface PurchasesListProps {
  purchases: {
    id: string;
    createdAt: Date;
    transactionSignature: string;
    status: string;
    gig: {
      id: string;
      title: string;
      price: number;
      images: string[];
      seller: {
        name: string | null;
        pfp_url: string | null;
      };
    };
  }[];
}

export function PurchasesList({ purchases }: PurchasesListProps) {
  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No purchases yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Start exploring gigs and make your first purchase!
        </p>
        <Link
          href="/gigs"
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800"
        >
          Browse Gigs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                    {purchase.gig.images[0] ? (
                      <Image
                        src={purchase.gig.images[0]}
                        alt={purchase.gig.title}
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
                    <Link href={`/gigs/${purchase.gig.id}`}>
                      {purchase.gig.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    by {purchase.gig.seller.name || "Anonymous Seller"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {purchase.gig.price} SOL
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(purchase.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    purchase.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                  }`}
                >
                  {purchase.status}
                </span>
              </div>
              <a
                href={`https://explorer.solana.com/tx/${purchase.transactionSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                View Transaction ↗
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

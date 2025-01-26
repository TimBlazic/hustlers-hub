"use client";

import Image from "next/image";
import Link from "next/link";
import { UserCircle } from "lucide-react";

interface GigCardProps {
  gig: {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    seller: {
      id: string;
      name: string | null;
      email: string | null;
      pfp_url: string | null;
      user_metadata?: {
        full_name: string | null;
      };
    };
  };
}

export function GigCard({ gig }: GigCardProps) {
  console.log("Full gig data:", JSON.stringify(gig, null, 2));
  console.log("Seller data:", {
    id: gig.seller.id,
    name: gig.seller.name,
    email: gig.seller.email,
    pfp_url: gig.seller.pfp_url,
    metadata: gig.seller.user_metadata,
  });

  // Get the display name in order of preference: full_name > name > email
  const displayName =
    gig.seller.user_metadata?.full_name ||
    gig.seller.name ||
    gig.seller.email ||
    "Anonymous";

  return (
    <Link
      href={`/gigs/${gig.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
    >
      <div className="aspect-[4/3] relative">
        {gig.images[0] ? (
          <Image
            src={gig.images[0]}
            alt={gig.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">No image</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Seller info */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800">
            {gig.seller.pfp_url ? (
              <Image
                src={gig.seller.pfp_url}
                alt={displayName}
                fill
                sizes="32px"
                className="object-cover"
                onError={(e) => {
                  console.error("Error loading profile image:", e);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loop
                  target.style.display = "none"; // Hide the broken image
                  const parent = target.parentElement;
                  if (parent) {
                    const icon = document.createElement("div");
                    icon.className =
                      "h-full w-full flex items-center justify-center";
                    icon.innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
                    parent.appendChild(icon);
                  }
                }}
              />
            ) : (
              <UserCircle className="h-full w-full text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {displayName}
          </span>
        </div>

        <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
          {gig.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {gig.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {gig.price} SOL
          </span>
        </div>
      </div>
    </Link>
  );
}

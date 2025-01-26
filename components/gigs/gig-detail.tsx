"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PurchaseFlow } from "./purchase-flow";

interface GigDetailProps {
  gig: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    seller: {
      id: string;
      name: string | null;
      pfp_url: string | null;
      bio: string | null;
      solanaAddress: string | null;
    };
  };
}

export function GigDetail({ gig }: GigDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
  const placeholderImage =
    "https://plus.unsplash.com/premium_photo-1685086785054-d047cdc0e525?q=80&w=3732&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  const handlePurchase = () => {
    if (!gig.seller.solanaAddress) {
      alert("This seller hasn't set up their wallet address yet");
      return;
    }
    setShowPurchaseFlow(true);
  };

  console.log({
    originalPrice: gig.price,
    type: typeof gig.price,
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="aspect-[16/9] relative overflow-hidden bg-gray-100 dark:bg-gray-900">
              <Image
                src={gig.images[selectedImage] || placeholderImage}
                alt={gig.title}
                fill
                priority
                className="object-cover"
              />
            </div>
            {gig.images.length > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-5 gap-4">
                  {gig.images.map((image, index) => (
                    <button
                      key={image}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square relative rounded-lg overflow-hidden ${
                        selectedImage === index
                          ? "ring-2 ring-gray-900 dark:ring-white"
                          : "ring-1 ring-gray-200 dark:ring-gray-700"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 20vw, 10vw"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About This Gig
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              {gig.description}
            </div>
          </div>
        </div>

        {/* Right Column - Pricing and Seller Info */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {gig.category}
              </span>
              <div className="flex items-center text-yellow-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">
                  New
                </span>
              </div>
            </div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {gig.title}
              </h1>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {gig.price} SOL
              </p>
            </div>
            {!gig.seller.solanaAddress && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                This seller hasn't set up their wallet address yet
              </div>
            )}
            <button
              onClick={handlePurchase}
              disabled={!gig.seller.solanaAddress}
              className="w-full flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gig.seller.solanaAddress ? "Purchase Now" : "Not Available"}
            </button>
          </div>

          {/* Seller Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800">
                {gig.seller.pfp_url ? (
                  <Image
                    src={gig.seller.pfp_url}
                    alt={gig.seller.name || "Seller"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">
                      {gig.seller.name?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {gig.seller.name || "Anonymous Seller"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Level 1 Seller
                </p>
              </div>
            </div>
            {gig.seller.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {gig.seller.bio}
              </p>
            )}
            <Link
              href={`/profile/${gig.seller.id}`}
              className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>

      {showPurchaseFlow && (
        <PurchaseFlow gig={gig} onClose={() => setShowPurchaseFlow(false)} />
      )}
    </>
  );
}

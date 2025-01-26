"use client";

import { useEffect, useState } from "react";
import { GigCard } from "@/components/gigs/gig-card";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";

interface Gig {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  createdAt: string;
  seller: {
    id: string;
    name: string | null;
    email: string | null;
    pfp_url: string | null;
  };
}

export default function MarketplacePage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const response = await fetch("/api/gigs");
      const data = await response.json();
      setGigs(data);
      setFilteredGigs(data);
    } catch (error) {
      console.error("Error fetching gigs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filters: {
    search: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    sortBy: string;
  }) => {
    let filtered = [...gigs];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (gig) =>
          gig.title.toLowerCase().includes(searchLower) ||
          gig.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((gig) => gig.category === filters.category);
    }

    // Apply price range filter
    filtered = filtered.filter(
      (gig) => gig.price >= filters.minPrice && gig.price <= filters.maxPrice
    );

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    setFilteredGigs(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Marketplace
          </h1>
          <Link
            href="/gigs/new"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Create Gig
          </Link>
        </div>

        <MarketplaceFilters onFilterChange={handleFilterChange} />

        {isLoading ? (
          <div className="text-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading gigs...
            </p>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-32">
            <PackageSearch className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No gigs found
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Try different filters or create a new gig!
            </p>
            <Link
              href="/gigs/new"
              className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Create First Gig
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

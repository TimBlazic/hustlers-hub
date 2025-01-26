"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
  "Development",
  "Marketing",
  "Design",
  "Video",
  "Writing",
  "Consulting",
  "Other",
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Cheapest", value: "price_asc" },
  { label: "Most expensive", value: "price_desc" },
];

interface MarketplaceFiltersProps {
  onFilterChange: (filters: {
    search: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    sortBy: string;
  }) => void;
}

export function MarketplaceFilters({
  onFilterChange,
}: MarketplaceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: 0,
    maxPrice: 1000,
    sortBy: "newest",
  });

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | number
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mb-8 space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search for gigs..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Extended Filters */}
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price range (SOL)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                step="0.1"
                value={filters.minPrice}
                onChange={(e) =>
                  handleFilterChange("minPrice", parseFloat(e.target.value))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
                placeholder="Min"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={filters.maxPrice}
                onChange={(e) =>
                  handleFilterChange("maxPrice", parseFloat(e.target.value))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort by
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

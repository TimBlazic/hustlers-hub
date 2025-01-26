"use client";

import { GigForm } from "@/components/gigs/gig-form";
import Link from "next/link";

export default function NewGigPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex space-x-2 text-sm mb-8" aria-label="Breadcrumb">
          <Link
            href="/marketplace"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Marketplace
          </Link>
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <span className="text-gray-900 dark:text-white font-medium">
            Create Gig
          </span>
        </nav>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="px-8 py-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Create a new gig
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Get started by filling in the information below to create your
                new gig.
              </p>
            </div>
          </div>

          <div className="px-8 py-6">
            <GigForm />
          </div>
        </div>
      </div>
    </div>
  );
}

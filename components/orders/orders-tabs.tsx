"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function OrdersTabs({ activeTab }: { activeTab: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs = [
    { id: "buying", label: "Buying" },
    { id: "selling", label: "Selling" },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={{ pathname, query: { tab: tab.id } }}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

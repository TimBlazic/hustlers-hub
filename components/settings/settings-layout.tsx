"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { AccountSettings } from "@/components/settings/tabs/account-settings";
import { WalletSettings } from "@/components/settings/tabs/wallet-settings";
import { LogOut } from "lucide-react";

interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  pfp_url: string | null;
}

interface SettingsLayoutProps {
  user: DbUser;
}

type Tab = "account" | "wallet";

const TABS: { id: Tab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "wallet", label: "Wallet" },
];

export function SettingsLayout({ user }: SettingsLayoutProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          {/* Sidebar */}
          <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0">
            <nav className="space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  } group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="bg-white dark:bg-gray-800 py-6 px-4 sm:p-6">
                {activeTab === "account" && <AccountSettings user={user} />}
                {activeTab === "wallet" && <WalletSettings user={user} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

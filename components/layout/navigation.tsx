"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Database } from "@/types/database.types";
import { NotificationsDropdown } from "../notifications/notifications-dropdown";
import { UserDropdown } from "../user-dropdown";
import { User as UserIcon } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  pfp_url: string | null;
};

export function Navigation() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setUserData(null);
          return;
        }

        // First sync the user
        const syncResponse = await fetch("/api/auth/user", {
          method: "POST",
        });

        if (!syncResponse.ok) {
          const error = await syncResponse.json();
          console.error("Error syncing user:", error);
          setUserData(null);
          return;
        }

        // Then fetch user data
        const response = await fetch(`/api/user/${session.user.id}`);
        const data = await response.json();

        if (response.ok) {
          setUserData(data);
        } else {
          console.error("Error fetching user data:", data.error);
          setUserData(null);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserData(null);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser();
      } else {
        setUserData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300"
            >
              Hustlers Hub
            </Link>
            <div className="hidden md:flex md:ml-10 space-x-1">
              <Link
                href="/marketplace"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-all"
              >
                Marketplace
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userData ? (
              <div className="flex items-center">
                <NotificationsDropdown />
                <UserDropdown user={userData} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

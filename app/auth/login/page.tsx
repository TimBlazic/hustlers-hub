"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Database } from "@/types/database.types";
import { AuthContainer } from "@/components/ui/auth-container";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/marketplace");
      }
    };
    checkUser();
  }, [router, supabase]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-[600px]">
        <AuthContainer>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#404040",
                    brandAccent: "#171717",
                    inputBackground: "transparent",
                    inputText: "inherit",
                  },
                },
              },
              className: {
                container: "w-full",
                button:
                  "w-full px-4 py-2.5 text-white bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors",
                input:
                  "w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent",
                label: "text-sm font-medium text-gray-700 dark:text-gray-300",
                loader: "text-gray-600 dark:text-gray-400",
                message: "text-red-500 dark:text-red-400 text-sm",
                anchor:
                  "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
                divider: "bg-gray-200 dark:bg-gray-700",
              },
            }}
            redirectTo={origin ? `${origin}/auth/callback` : undefined}
            theme="dark"
          />
        </AuthContainer>
      </div>
    </div>
  );
}

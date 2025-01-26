"use client";

import { useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Navigation } from "@/components/layout/navigation";
import { WalletProvider } from "@/components/providers/wallet-provider";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();

  useEffect(() => {
    const debugChannel = supabase.channel("debug");
    debugChannel
      .on("system", { event: "*" }, (payload) => {
        console.log("Supabase system event:", payload);
      })
      .subscribe((status) => {
        console.log("Debug channel status:", status);
      });

    return () => {
      supabase.removeChannel(debugChannel);
    };
  }, [supabase]);

  return (
    <WalletProvider>
      <Navigation />
      <main className="pt-16">{children}</main>
    </WalletProvider>
  );
}

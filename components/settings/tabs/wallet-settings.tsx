"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  pfp_url: string | null;
}

interface WalletSettingsProps {
  user: DbUser;
}

export function WalletSettings({ user }: WalletSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { publicKey, connected } = useWallet();
  const supabase = createClientComponentClient();

  const handleSaveAddress = async () => {
    if (!publicKey) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update user in database
      const response = await fetch("/api/user/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solanaAddress: publicKey.toString() }),
      });

      if (!response.ok) {
        throw new Error("Failed to save wallet address");
      }

      setSuccess(true);
      toast.success("Wallet address saved successfully!");
    } catch (error) {
      console.error("Error saving wallet address:", error);
      setError("Failed to save wallet address. Please try again.");
      toast.error("Failed to save wallet address");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Wallet</h3>
        <p className="text-sm text-muted-foreground">
          Manage your wallet and transactions.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center justify-between p-6 bg-accent rounded-lg">
          <div>
            <p className="text-sm font-medium">Current Balance</p>
            <p className="text-2xl font-bold">{0} €</p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            disabled
          >
            Add Funds
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Recent Transactions</h4>
          <div className="rounded-md border">
            <div className="p-4 text-sm text-center text-muted-foreground">
              No transactions
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Connected Wallet
            </h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {connected
                ? `Connected: ${publicKey?.toString().slice(0, 4)}...${publicKey
                    ?.toString()
                    .slice(-4)}`
                : "No wallet connected"}
            </p>
          </div>
          <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800" />
        </div>

        {connected && (
          <button
            onClick={handleSaveAddress}
            disabled={isSaving}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              "Save as Payment Address"
            )}
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            Wallet address saved successfully!
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Security Note
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your wallet address is stored securely and is only used for receiving
          payments. We never store your private keys or have access to your
          funds.
        </p>
      </div>
    </div>
  );
}

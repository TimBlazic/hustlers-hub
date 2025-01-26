"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouter } from "next/navigation";

interface PurchaseFlowProps {
  gig: {
    id: string;
    title: string;
    price: number;
    seller: {
      name: string | null;
      solanaAddress: string | null;
    };
  };
  onClose: () => void;
}

type Step = "connect" | "confirm" | "processing" | "success" | "error";

export function PurchaseFlow({ gig, onClose }: PurchaseFlowProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(
    connected ? "confirm" : "connect"
  );
  const [error, setError] = useState<string | null>(null);
  const [isRequestingAirdrop, setIsRequestingAirdrop] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (connected && currentStep === "connect") {
      setCurrentStep("confirm");
    }
  }, [connected, currentStep]);

  const handleConfirmPurchase = async () => {
    if (!publicKey || !gig.seller.solanaAddress) {
      setError("Missing wallet information");
      setCurrentStep("error");
      return;
    }

    try {
      setCurrentStep("processing");
      const connection = new Connection("https://api.devnet.solana.com", {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000, // 60 sekund timeout
      });

      const balance = await connection.getBalance(publicKey);
      const requiredAmount = Math.round(gig.price * LAMPORTS_PER_SOL);
      const estimatedFee = 5000;

      console.log({
        walletAddress: publicKey.toString(),
        sellerAddress: gig.seller.solanaAddress,
        balance: balance / LAMPORTS_PER_SOL,
        requiredAmount: requiredAmount / LAMPORTS_PER_SOL,
        estimatedFee: estimatedFee / LAMPORTS_PER_SOL,
        totalNeeded: (requiredAmount + estimatedFee) / LAMPORTS_PER_SOL,
        price: gig.price,
        LAMPORTS_PER_SOL,
        isDevnet: connection.rpcEndpoint.includes("devnet"),
      });

      if (balance < requiredAmount + estimatedFee) {
        throw new Error(
          `Insufficient funds. You need at least ${
            gig.price
          } SOL plus transaction fees. (Balance: ${
            balance / LAMPORTS_PER_SOL
          } SOL)`
        );
      }

      const sellerPublicKey = new PublicKey(gig.seller.solanaAddress);

      // Najprej dobimo blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: sellerPublicKey,
          lamports: requiredAmount,
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Pošljemo transakcijo
      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction sent:", signature);

      // Čakamo na potrditev z retry logiko
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 60; // Povečamo na 60 poskusov (60 sekund)

      while (!confirmed && attempts < maxAttempts) {
        try {
          const status = await connection.getSignatureStatus(signature);
          console.log("Transaction status:", status);

          if (status.value?.err) {
            throw new Error("Transaction failed");
          }

          if (
            status.value?.confirmationStatus === "confirmed" ||
            status.value?.confirmationStatus === "finalized"
          ) {
            confirmed = true;
            console.log("Transaction confirmed:", signature);
            break;
          }

          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          console.warn("Confirmation attempt failed:", err);
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error(
              "Transaction confirmation timeout. Please check your wallet for status."
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Če smo prišli do sem, je transakcija uspela
      try {
        const response = await fetch(`/api/gigs/${gig.id}/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signature,
            amount: gig.price,
            buyerAddress: publicKey.toString(),
          }),
        });

        if (response.ok) {
          const order = await response.json();
          setCurrentStep("success");
          // Shranimo orderId za preusmeritev
          setOrderId(order.id);
        }
      } catch (err) {
        console.error("Backend error:", err);
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during the purchase"
      );
      setCurrentStep("error");
    }
  };

  const handleRequestAirdrop = async () => {
    if (!publicKey) return;

    try {
      setIsRequestingAirdrop(true);
      const connection = new Connection("https://api.devnet.solana.com");

      const signature = await connection.requestAirdrop(
        publicKey,
        2 * LAMPORTS_PER_SOL // Request 2 SOL
      );

      await connection.confirmTransaction(signature);

      // Preveri novo stanje
      const newBalance = await connection.getBalance(publicKey);
      console.log("New balance:", newBalance / LAMPORTS_PER_SOL, "SOL");

      setError(null);
    } catch (err) {
      console.error("Airdrop error:", err);
      setError("Failed to request test SOL. Please try again.");
    } finally {
      setIsRequestingAirdrop(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
    onClose();
  };

  const steps = {
    connect: {
      title: "Connect Your Wallet",
      description: "Connect your Solana wallet to continue with the purchase.",
      action: <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800" />,
    },
    confirm: {
      title: "Confirm Purchase",
      description: (
        <div className="space-y-2">
          <p>
            You are about to purchase "{gig.title}" for {gig.price} SOL
          </p>
        </div>
      ),
      action: (
        <div className="space-y-3">
          <button
            onClick={handleConfirmPurchase}
            className="w-full flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all"
          >
            Confirm Purchase
          </button>
          <button
            onClick={handleRequestAirdrop}
            disabled={isRequestingAirdrop}
            className="w-full items-center hidden justify-center px-6 py-3 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 transition-all"
          >
            {isRequestingAirdrop ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Requesting SOL...
              </>
            ) : (
              "Get Test SOL (Devnet)"
            )}
          </button>
        </div>
      ),
    },
    processing: {
      title: "Processing Payment",
      description: "Please approve the transaction in your wallet...",
      action: <LoadingSpinner className="w-8 h-8" />,
    },
    success: {
      title: "Purchase Successful! 🎉",
      description: (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              Your purchase of "{gig.title}" was successful. The seller has been
              notified and will contact you soon.
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => orderId && handleViewOrder(orderId)}
              className="w-full px-6 py-3 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-all"
            >
              View Order Details
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      ),
      action: null,
    },
    error: {
      title: "Something went wrong",
      description: error || "An error occurred during the purchase.",
      action: (
        <button
          onClick={() => setCurrentStep("confirm")}
          className="w-full px-6 py-3 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      ),
    },
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          {(currentStep === "error" || currentStep === "confirm") && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {steps[currentStep].title}
          </h2>
          <div className="text-gray-600 dark:text-gray-400">
            {steps[currentStep].description}
          </div>
          {steps[currentStep].action && (
            <div className="flex justify-center py-4">
              {steps[currentStep].action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

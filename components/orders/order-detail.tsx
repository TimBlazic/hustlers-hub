"use client";

import { useState, useEffect } from "react";
import { OrderStatus } from "@prisma/client";
import { OrderChat } from "@/components/orders/order-chat";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderStatusUpdate } from "@/components/orders/order-status-update";
import { OrderHeader } from "@/components/orders/order-header";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface OrderDetailProps {
  order: {
    id: string;
    status: OrderStatus;
    amount: number;
    createdAt: Date;
    signature: string | null;
    gig: {
      id: string;
      title: string;
      images: string[];
      seller: {
        id: string;
        name: string | null;
        pfp_url: string | null;
      };
    };
    buyer: {
      id: string;
      name: string | null;
      pfp_url: string | null;
    };
    seller: {
      id: string;
      name: string | null;
      pfp_url: string | null;
    };
    messages: {
      id: string;
      content: string;
      createdAt: Date;
      user: {
        id: string;
        name: string | null;
        pfp_url: string | null;
      };
    }[];
  };
  userRole: "buyer" | "seller";
  userId: string;
}

export function OrderDetail({
  order: initialOrder,
  userRole,
  userId,
}: OrderDetailProps) {
  const [order, setOrder] = useState(initialOrder);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          // Posodobi order state z novim statusom
          setOrder((prev) => ({
            ...prev,
            status: payload.new.status,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Left side - order details */}
      <div className="lg:col-span-2 space-y-3">
        <OrderHeader order={order} userRole={userRole} />
        <OrderChat
          orderId={order.id}
          messages={order.messages}
          userId={userId}
          order={{
            buyerId: order.buyer.id,
            sellerId: order.gig.seller.id,
          }}
        />
      </div>

      {/* Right side - status and timeline */}
      <div className="space-y-3">
        <OrderStatusUpdate
          currentStatus={order.status}
          onUpdateStatus={handleStatusUpdate}
          userRole={userRole}
          order={{
            id: order.id,
            buyerId: order.buyer.id,
          }}
        />
        <OrderTimeline order={order} />
      </div>
    </div>
  );
}

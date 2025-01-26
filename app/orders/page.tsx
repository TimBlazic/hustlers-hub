import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrdersList } from "@/components/orders/orders-list";
import { OrdersTabs } from "@/components/orders/orders-tabs";
import prisma from "@/lib/prisma";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const tab = searchParams.tab || "buying";

  const orders = await prisma.order.findMany({
    where: {
      [tab === "buying" ? "buyerId" : "sellerId"]: session.user.id,
    },
    include: {
      gig: {
        include: {
          seller: true,
        },
      },
      buyer: true,
      seller: true,
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Orders
        </h1>
      </div>

      <OrdersTabs activeTab={tab} />
      <OrdersList orders={orders} userRole={tab as "buying" | "selling"} />
    </div>
  );
}

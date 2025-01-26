import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrderDetail } from "@/components/orders/order-detail";
import prisma from "@/lib/prisma";

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      gig: {
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              pfp_url: true,
              solanaAddress: true,
            },
          },
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          pfp_url: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          pfp_url: true,
        },
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              pfp_url: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    redirect("/orders");
  }

  // Preveri, če je uporabnik povezan z naročilom
  if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
    redirect("/orders");
  }

  const userRole = order.buyerId === session.user.id ? "buyer" : "seller";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OrderDetail order={order} userRole={userRole} userId={session.user.id} />
    </div>
  );
}

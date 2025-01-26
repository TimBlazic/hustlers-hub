import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PurchasesList } from "@/components/purchases/purchases-list";
import prisma from "@/lib/prisma";

export default async function PurchasesPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const purchases = await prisma.purchase.findMany({
    where: {
      buyerId: session.user.id,
    },
    include: {
      gig: {
        include: {
          seller: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        My Purchases
      </h1>
      <PurchasesList purchases={purchases} />
    </div>
  );
}

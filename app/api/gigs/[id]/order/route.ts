import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { signature, amount, buyerAddress } = await request.json();

    // Najprej dobimo gig in prodajalca
    const gig = await prisma.gig.findUnique({
      where: { id: params.id },
      include: { seller: true },
    });

    if (!gig) {
      return NextResponse.json({ error: "Gig not found" }, { status: 404 });
    }

    // Ustvarimo novo naročilo
    const order = await prisma.order.create({
      data: {
        status: "PAID", // Ker je transakcija že potrjena
        amount: amount,
        signature: signature,
        buyerAddress: buyerAddress,
        gigId: gig.id,
        buyerId: session.user.id,
        sellerId: gig.seller.id,
        messages: {
          create: {
            content: "Order created and payment received",
            userId: session.user.id,
          },
        },
      },
      include: {
        gig: true,
        buyer: true,
        seller: true,
        messages: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

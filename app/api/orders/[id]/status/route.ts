import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function PATCH(
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
    const { status } = await request.json();

    // Preveri, če je status veljaven
    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Preveri, če je uporabnik prodajalec tega naročila
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        seller: true,
        buyer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only seller can update status" },
        { status: 403 }
      );
    }

    // Posodobi status naročila
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        messages: {
          create: {
            content: `Order status changed to ${status}`,
            userId: session.user.id,
          },
        },
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
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Pošlji real-time obvestilo
    const supabaseAdmin = createRouteHandlerClient({ cookies });
    await supabaseAdmin.from("Order").update({ status }).eq("id", params.id);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}

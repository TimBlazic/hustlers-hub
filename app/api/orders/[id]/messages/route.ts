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
    const { content } = await request.json();

    // Preveri, če je uporabnik povezan z naročilom
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { buyerId: true, sellerId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.buyerId !== session.user.id &&
      order.sellerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log("Creating message in Prisma...");
    // Ustvari novo sporočilo v Prisma
    const message = await prisma.orderMessage.create({
      data: {
        content,
        orderId: params.id,
        userId: session.user.id,
      },
      include: {
        user: true,
      },
    });
    console.log("Message created in Prisma:", message);

    // Shrani sporočilo v Supabase za real-time funkcionalnost
    console.log("Inserting message into Supabase...");
    const { data: supabaseData, error: supabaseError } = await supabase
      .from("order_message")
      .insert([
        {
          id: message.id,
          content: message.content,
          order_id: message.orderId,
          user_id: message.userId,
          created_at: message.createdAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (supabaseError) {
      console.error("Error inserting message to Supabase:", supabaseError);
      // Ne prekini zahtevka, saj je sporočilo že shranjeno v Prisma
    } else {
      console.log("Message inserted into Supabase:", supabaseData);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

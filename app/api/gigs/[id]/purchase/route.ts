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
    const { signature, buyerAddress } = await request.json();

    const purchase = await prisma.purchase.create({
      data: {
        gigId: params.id,
        buyerId: session.user.id,
        transactionSignature: signature,
        buyerAddress,
        status: "completed",
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Error creating purchase" },
      { status: 500 }
    );
  }
}

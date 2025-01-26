import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // Preveri avtentikacijo
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { solanaAddress } = await request.json();

    // Posodobi uporabnika v Prisma bazi
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { solanaAddress },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating wallet address:", error);
    return NextResponse.json(
      { error: "Failed to update wallet address" },
      { status: 500 }
    );
  }
}

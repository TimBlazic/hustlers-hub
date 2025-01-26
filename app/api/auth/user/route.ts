import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Database } from "@/types/database.types";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Session user:", session.user); // Debug log

    // Check if user exists by ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ id: session.user.id }, { email: session.user.email }],
      },
    });

    if (user) {
      // Update existing user
      console.log("Updating existing user...");
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          id: session.user.id,
          email: session.user.email ?? "",
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User",
          pfp_url: session.user.user_metadata?.pfp_url || null,
        },
      });
      console.log("User updated:", user);
    } else {
      // Create new user
      console.log("Creating new user...");
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email ?? "",
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User",
          pfp_url: session.user.user_metadata?.pfp_url || null,
        },
      });
      console.log("New user created:", user);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Detailed error syncing user:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to sync user", details: error }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

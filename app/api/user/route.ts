import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Database } from "@/types/database.types";

export async function PUT(request: Request) {
  console.log("Starting PUT request to /api/user");

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    console.log("Created Supabase client");

    const session = await supabase.auth.getSession();
    console.log("Got session:", session.data.session?.user.id);

    if (!session.data.session?.user) {
      console.log("No authenticated user found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body);

    // First try to find user by ID
    let existingUser = await prisma.user.findUnique({
      where: { id: session.data.session.user.id },
    });
    console.log("Found by ID:", existingUser);

    // If not found by ID, try to find by email
    if (!existingUser && session.data.session.user.email) {
      existingUser = await prisma.user.findUnique({
        where: { email: session.data.session.user.email },
      });
      console.log("Found by email:", existingUser);
    }

    let user;
    if (!existingUser) {
      console.log("Creating new user");
      user = await prisma.user.create({
        data: {
          id: session.data.session.user.id,
          email: session.data.session.user.email!,
          name: body.name || session.data.session.user.user_metadata?.full_name,
          pfp_url: body.pfp_url,
        },
      });
      console.log("Created user:", user);
    } else {
      console.log("Updating existing user");
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: body.name,
          pfp_url: body.pfp_url,
        },
      });
      console.log("Updated user:", user);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in PUT /api/user:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to update user in database",
        details: error,
      }),
      { status: 500 }
    );
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Database } from "@/types/database.types";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    console.log("Session user:", session.user);

    const body = await request.json();
    const { title, description, price, category, images } = body;
    console.log("Request body:", {
      title,
      description,
      price,
      category,
      images: images.length,
    });

    // Validate input
    if (!title || !description || !price || !category || !images) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First check if user exists by email
    console.log("Checking if user exists by email...");
    let user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });
    console.log("Found user by email:", user);

    // If not found by email, check by ID
    if (!user) {
      console.log("Checking if user exists by ID...");
      user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
      });
      console.log("Found user by ID:", user);
    }

    // If still no user, create one
    if (!user) {
      console.log("Creating new user...");
      console.log("User metadata from session:", session.user.user_metadata);
      console.log("PFP URL from metadata:", session.user.user_metadata.pfp_url);
      try {
        user = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.full_name,
            pfp_url: session.user.user_metadata.pfp_url,
          },
        });
        console.log("New user created with data:", user);
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    } else {
      // Update existing user with latest metadata
      console.log("Updating existing user with latest metadata...");
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: session.user.user_metadata.full_name,
            pfp_url: session.user.user_metadata.pfp_url,
          },
        });
        console.log("User updated with data:", user);
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    }

    // Then create the gig
    console.log("Creating gig with sellerId:", user.id);
    try {
      const gig = await prisma.gig.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          category,
          images,
          sellerId: user.id,
        },
        include: {
          seller: {
            select: {
              name: true,
              pfp_url: true,
            },
          },
        },
      });
      console.log("Gig created successfully:", gig);
      return NextResponse.json(gig);
    } catch (error) {
      console.error("Error creating gig in database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: "Error creating gig",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const gigs = await prisma.gig.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            pfp_url: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Raw gigs data:", JSON.stringify(gigs, null, 2));

    // Transform the data to include user_metadata
    const gigsWithMetadata = gigs.map((gig) => ({
      ...gig,
      seller: {
        ...gig.seller,
        user_metadata: {
          full_name: gig.seller.name,
          pfp_url: gig.seller.pfp_url,
        },
      },
    }));

    console.log(
      "Transformed gigs data:",
      JSON.stringify(gigsWithMetadata, null, 2)
    );

    return NextResponse.json(gigsWithMetadata);
  } catch (error) {
    console.error("Error fetching gigs:", error);
    return NextResponse.json({ error: "Error fetching gigs" }, { status: 500 });
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { type, content, orderId, userId } = await request.json();

    // Ustvari v Prisma
    const notification = await prisma.notification.create({
      data: {
        type,
        content,
        orderId,
        userId,
      },
    });

    // Sproži realtime event preko Supabase
    const { error: broadcastError } = await supabase
      .from("notification")
      .insert({
        id: notification.id,
        type: notification.type,
        content: notification.content,
        order_id: notification.orderId,
        user_id: notification.userId,
        read: notification.read,
        created_at: notification.createdAt.toISOString(),
      });

    if (broadcastError) {
      console.error("Error broadcasting notification:", broadcastError);
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification", details: error },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

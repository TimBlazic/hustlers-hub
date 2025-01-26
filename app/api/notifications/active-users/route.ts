import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const activeUsers = new Map<string, Set<string>>(); // userId -> Set of orderIds

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { orderId, active } = await request.json();

    if (!activeUsers.has(session.user.id)) {
      activeUsers.set(session.user.id, new Set());
    }

    const userOrders = activeUsers.get(session.user.id)!;

    if (active) {
      userOrders.add(orderId);
    } else {
      userOrders.delete(orderId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating active users:", error);
    return NextResponse.json(
      { error: "Failed to update active users" },
      { status: 500 }
    );
  }
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const userId = url.searchParams.get("userId");

  if (!orderId || !userId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const userOrders = activeUsers.get(userId);
  const isActive = userOrders?.has(orderId) ?? false;

  return NextResponse.json({ isActive });
}

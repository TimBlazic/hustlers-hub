import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (
    !session &&
    (req.nextUrl.pathname.startsWith("/marketplace") ||
      req.nextUrl.pathname.startsWith("/gigs/new"))
  ) {
    const redirectUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
};

export const config = {
  matcher: ["/marketplace/:path*", "/gigs/new"],
};

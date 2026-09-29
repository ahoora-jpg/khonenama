import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const requestProto = request.nextUrl.protocol.replace(":", "").toLowerCase();

  if (forwardedProto === "http" || (!forwardedProto && requestProto === "http")) {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};

import { NextResponse, type NextRequest } from "next/server";

// Phones and the installed app get the app's Welcome screen at "/". Everything else gets the landing page.
export function proxy(request: NextRequest) {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.rewrite(new URL("/start", request.url));
  }
}

export const config = { matcher: "/" };

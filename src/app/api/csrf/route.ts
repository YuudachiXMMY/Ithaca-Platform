import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";
import type { ApiResponse } from "@/types";

interface CsrfData {
  csrfToken: string;
}

export async function GET(): Promise<NextResponse<ApiResponse<CsrfData>>> {
  const csrfToken = generateCsrfToken();
  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json<ApiResponse<CsrfData>>({
    success: true,
    data: { csrfToken },
  });

  response.cookies.set("csrf_token", csrfToken, {
    httpOnly: false, // Must be readable by JS for double-submit cookie pattern
    sameSite: "lax",
    path: "/",
    secure: isProduction,
  });

  return response;
}

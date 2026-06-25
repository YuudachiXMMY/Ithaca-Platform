"use client";

import { useRef } from "react";
import type { ApiResponse } from "@/types";

interface CsrfData {
  csrfToken: string;
}

export function useCsrfToken(): { getToken: () => Promise<string> } {
  const tokenRef = useRef<string | null>(null);

  const getToken = async (): Promise<string> => {
    if (tokenRef.current !== null) return tokenRef.current;

    const response = await fetch("/api/csrf");
    if (!response.ok) {
      throw new Error("Failed to fetch CSRF token");
    }

    const json: ApiResponse<CsrfData> = await response.json();
    if (!json.success || !json.data?.csrfToken) {
      throw new Error("Invalid CSRF token response");
    }

    tokenRef.current = json.data.csrfToken;
    return tokenRef.current;
  };

  return { getToken };
}

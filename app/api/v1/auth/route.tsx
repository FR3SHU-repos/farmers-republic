// app/api/v1/auth/logout/route.tsx

// app/api/v1/auth/logout/route.ts
import { NextRequest } from "next/server";
import { proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

export function POST(request: NextRequest) {
  return proxyCatalogueMutation(request, "/auth/logout");
}

import { NextRequest } from "next/server";
import { proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

export async function POST(request: NextRequest) {
  return proxyCatalogueMutation(request, "/auth/password-reset/complete");
}

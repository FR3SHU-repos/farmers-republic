import { NextRequest } from "next/server";
import { proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns community group membership. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyCatalogueMutation(request, `/community/${encodeURIComponent(id)}/join`);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyCatalogueMutation(request, `/community/${encodeURIComponent(id)}/join`);
}

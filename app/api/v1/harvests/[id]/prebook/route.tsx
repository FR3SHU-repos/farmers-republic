import { NextRequest } from "next/server";
import { proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyCatalogueMutation(request, `/harvests/${encodeURIComponent(id)}/prebook`);
}

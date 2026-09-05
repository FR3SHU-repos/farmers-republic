import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyCatalogueGET(request, `/harvests/${encodeURIComponent(id)}/prebookings`);
}

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyCatalogueMutation(request, `/harvests/${encodeURIComponent(id)}/prebookings`);
}

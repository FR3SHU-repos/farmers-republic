import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

type Context = { params: Promise<{ id: string }> };

/** @deprecated Compatibility proxy; go-api-backend is the catalogue owner. */
export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyCatalogueGET(request, `/products/${encodeURIComponent(id)}`);
}

/** @deprecated Compatibility proxy; performs no local database write. */
export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyCatalogueMutation(request, `/products/${encodeURIComponent(id)}`);
}

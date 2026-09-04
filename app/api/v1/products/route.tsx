import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility proxy; go-api-backend is the catalogue owner. */
export function GET(request: NextRequest) { return proxyCatalogueGET(request, "/products"); }

/** @deprecated Compatibility proxy; performs no local database write. */
export function POST(request: NextRequest) { return proxyCatalogueMutation(request, "/products"); }

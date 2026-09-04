import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";
export function GET(req: NextRequest) { return proxyCatalogueGET(req, "/admin/farmers"); }

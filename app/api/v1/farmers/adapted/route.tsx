import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";
export function GET(req: NextRequest) { return proxyCatalogueGET(req, "/farmers/adapted"); }
export function POST(req: NextRequest) { return proxyCatalogueMutation(req, "/farmers/adapted"); }

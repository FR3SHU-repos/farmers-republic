import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";
export function GET(request: NextRequest) { return proxyCatalogueGET(request, "/voice-orders"); }
export function POST(request: NextRequest) { return proxyCatalogueMutation(request, "/voice-orders"); }

import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns wallet balance reads. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/wallet");
}

/**
 * @deprecated Compatibility route; Go owns wallet credit/debit
 * (`POST /api/v1/wallet`). Each mutation appends an immutable
 * `wallettransactions` entry and moves the materialized balance in one
 * transaction (debits are `$gte`-guarded); an elevated role may act on any
 * wallet, a non-elevated caller may only debit their own. Idempotent on
 * `Idempotency-Key`.
 */
export function POST(request: NextRequest) {
  return proxyCatalogueMutation(request, "/wallet");
}

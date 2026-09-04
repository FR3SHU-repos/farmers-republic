import assert from "node:assert/strict";
import test from "node:test";

import { CatalogueAPIError, catalogueAPI } from "../shared/lib/api/catalogue";

test("catalogue list maps canonical ids and pagination", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.match(String(input), /\/api\/v1\/products\?/);
    return new Response(JSON.stringify({ success: true, data: { products: [{ id: "p1", name: "Rice", price: 42 }], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const result = await catalogueAPI.list({ q: "rice", page: 1, limit: 12 });
    assert.equal(result.items[0]?.id, "p1");
    assert.equal(result.items[0]?.price, 42);
    assert.equal(result.meta.total, 1);
  } finally { globalThis.fetch = original; }
});

test("catalogue client rejects non-2xx and malformed responses", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, message: "missing", code: "not_found" }), { status: 404 });
  try {
    await assert.rejects(() => catalogueAPI.get("missing"), (error) => error instanceof CatalogueAPIError && error.status === 404);
    globalThis.fetch = async () => new Response("not-json", { status: 200 });
    await assert.rejects(() => catalogueAPI.get("bad"), /malformed JSON/);
  } finally { globalThis.fetch = original; }
});

test("catalogue client reports backend unavailability safely", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError("connection refused"); };
  try {
    await assert.rejects(() => catalogueAPI.list(), (error) => error instanceof CatalogueAPIError && error.code === "unavailable" && error.status === 0);
  } finally { globalThis.fetch = original; }
});

test("catalogue create uses authenticated proxy and idempotency header", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "/api/v1/products");
    assert.equal(init?.credentials, "include");
    assert.equal((init?.headers as Record<string, string>)["Idempotency-Key"], "operation-1");
    return new Response(JSON.stringify({ success: true, data: { id: "p1", name: "Rice", price: 10 } }), { status: 201 });
  };
  try {
    const product = await catalogueAPI.create({ name: "Rice", price: 10 }, "operation-1");
    assert.equal(product.id, "p1");
  } finally { globalThis.fetch = original; }
});

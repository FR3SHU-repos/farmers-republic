import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { proxyCatalogueMutation } from "../shared/lib/api/catalogue-proxy";

test("mutation proxy forwards auth, request id and Set-Cookie", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers.Cookie, "token=inbound");
    assert.equal(headers.Authorization, "Bearer bearer-token");
    return new Response(JSON.stringify({ success: true, data: { id: "u1" } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": "token=outbound; Path=/; HttpOnly; SameSite=Lax",
        "x-request-id": "request-1",
      },
    });
  };
  try {
    const request = new NextRequest("http://localhost/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "token=inbound",
        authorization: "Bearer bearer-token",
      },
      body: JSON.stringify({ email: "user@example.test", password: "not-a-real-password" }),
    });
    const response = await proxyCatalogueMutation(request, "/auth/login");
    assert.match(response.headers.get("set-cookie") ?? "", /token=outbound/);
    assert.equal(response.headers.get("x-request-id"), "request-1");
    assert.equal(response.headers.get("deprecation"), "true");
  } finally {
    globalThis.fetch = original;
  }
});

test("mutation proxy fails closed to an unavailable response without local fallback", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError("offline"); };
  try {
    const request = new NextRequest("http://localhost/api/v1/auth/login", { method: "POST", body: "{}" });
    const response = await proxyCatalogueMutation(request, "/auth/login");
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "api_unavailable");
  } finally {
    globalThis.fetch = original;
  }
});

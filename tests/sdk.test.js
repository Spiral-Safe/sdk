const assert = require("node:assert/strict");
const test = require("node:test");
const { SpiralSafeAPIError, SpiralSafeSDK } = require("../dist/index.bundle.js");

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("uses bearer auth and propagates tenant-local chain identity", async () => {
  let request;
  const sdk = new SpiralSafeSDK({
    apiToken: "tenant-token",
    chain: "ethereum",
    fetchImplementation: async (url, init) => {
      request = { url, init };
      return jsonResponse({ ceremonyId: "c".repeat(32) });
    },
  });

  await sdk.init("alice");
  assert.equal(request.url, "http://localhost:3000/init");
  assert.equal(request.init.headers.Authorization, "Bearer tenant-token");
  assert.deepEqual(JSON.parse(request.init.body), {
    username: "alice",
    chain: "ethereum",
  });
  assert.equal(request.init.headers["X-Vault-Token"], undefined);
});

test("pairs ceremony IDs with completion requests", async () => {
  let body;
  const sdk = new SpiralSafeSDK({
    apiToken: "tenant-token",
    fetchImplementation: async (_url, init) => {
      body = JSON.parse(init.body);
      return jsonResponse({ address: "wallet" });
    },
  });

  await sdk.complete("alice", "x".repeat(32), { id: "credential" });
  assert.equal(body.ceremonyId, "x".repeat(32));
  assert.equal(body.chain, "solana");
  assert.equal(body.operation, "transaction");
  assert.deepEqual(body.credential, { id: "credential" });
});

test("pairs message completions with their requested operation", async () => {
  let body;
  const sdk = new SpiralSafeSDK({
    apiToken: "tenant-token",
    chain: "ethereum",
    fetchImplementation: async (_url, init) => {
      body = JSON.parse(init.body);
      return jsonResponse({ address: "wallet", operation: "message" });
    },
  });

  await sdk.complete(
    "alice",
    "m".repeat(32),
    { id: "credential" },
    "ethereum",
    "message",
  );
  assert.equal(body.chain, "ethereum");
  assert.equal(body.operation, "message");
});

test("encodes byte signing payloads", async () => {
  let body;
  const sdk = new SpiralSafeSDK({
    apiToken: "tenant-token",
    fetchImplementation: async (_url, init) => {
      body = JSON.parse(init.body);
      return jsonResponse({ ceremonyId: "y".repeat(32) });
    },
  });

  await sdk.signin({ username: "alice", operation: "message", payload: new Uint8Array([1, 2, 3]) });
  assert.equal(body.payload, "AQID");
  assert.equal(body.operation, "message");
});

test("rejects insecure remote service URLs", () => {
  assert.throws(
    () => new SpiralSafeSDK({ baseUrl: "http://safe.example.com", apiToken: "token" }),
    /HTTPS/,
  );
});

test("returns stable service error details", async () => {
  const sdk = new SpiralSafeSDK({
    apiToken: "tenant-token",
    fetchImplementation: async () =>
      jsonResponse(
        { error: { code: "unauthorized", message: "no" }, requestId: "request-1" },
        401,
      ),
  });

  await assert.rejects(
    sdk.check("alice"),
    (error) =>
      error instanceof SpiralSafeAPIError &&
      error.status === 401 &&
      error.code === "unauthorized" &&
      error.requestId === "request-1",
  );
});

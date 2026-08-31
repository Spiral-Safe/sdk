import fetch from "cross-fetch";

export type SpiralSafeChain = "solana" | "ethereum";
export type SigningOperation = "transaction" | "message";

export interface SpiralSafeSDKOptions {
  /** Public Spiral Safe service URL. Vault is never addressed by browser clients. */
  baseUrl?: string;
  /** Tenant-scoped API token issued by the Spiral Safe service operator. */
  apiToken: string;
  /** Default chain for wallet operations. */
  chain?: SpiralSafeChain;
  /** Primarily useful for tests and non-browser runtimes. */
  fetchImplementation?: typeof fetch;
}

export interface WalletIdentity {
  username: string;
  chain?: SpiralSafeChain;
}

export interface CeremonyResponse {
  ceremonyId: string;
  options?: unknown;
  address?: string;
  pubKey?: string;
  [key: string]: unknown;
}

export interface WalletResponse {
  address?: string;
  pubKey?: string;
  operation?: SigningOperation;
  encodedTX?: string;
  signature?: string;
  [key: string]: unknown;
}

export interface SigningRequest extends WalletIdentity {
  operation?: SigningOperation;
  /** Standard-base64 transaction or message bytes. */
  payload: string | Uint8Array;
}

export class SpiralSafeAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "SpiralSafeAPIError";
  }
}

/**
 * Low-level client for the authenticated Spiral Safe HTTP service.
 *
 * WebAuthn calls must remain in the relying-party page (or the extension's
 * injected provider). This client transports the serialized results and never
 * receives a Vault token or private signing key.
 */
export class SpiralSafeSDK {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly chain: SpiralSafeChain;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: SpiralSafeSDKOptions) {
    if (!options || typeof options.apiToken !== "string" || !options.apiToken.trim()) {
      throw new Error("apiToken is required");
    }
    this.baseUrl = normalizeServiceURL(options.baseUrl || "http://localhost:3000");
    this.apiToken = options.apiToken;
    this.chain = options.chain || "solana";
    this.fetchImplementation = options.fetchImplementation || fetch;
  }

  /** Begin WebAuthn registration and return an opaque one-time ceremony ID. */
  init(username: string, chain?: SpiralSafeChain): Promise<CeremonyResponse> {
    return this.post("/init", this.identity(username, chain));
  }

  /** Complete the exact registration ceremony returned by init(). */
  create(
    username: string,
    ceremonyId: string,
    credential: Record<string, unknown>,
    chain?: SpiralSafeChain,
  ): Promise<WalletResponse> {
    return this.post("/create", {
      ...this.identity(username, chain),
      ceremonyId,
      credential,
    });
  }

  /** Look up the tenant-local wallet for the selected chain. */
  check(username: string, chain?: SpiralSafeChain): Promise<WalletResponse> {
    return this.post("/check", this.identity(username, chain));
  }

  /** Begin WebAuthn authorization for a transaction or message signature. */
  signin(request: SigningRequest): Promise<CeremonyResponse> {
    return this.post("/signin", {
      ...this.identity(request.username, request.chain),
      operation: request.operation || "transaction",
      payload: toBase64(request.payload),
    });
  }

  /** Complete the exact signing ceremony returned by signin(). */
  complete(
    username: string,
    ceremonyId: string,
    credential: Record<string, unknown>,
    chain?: SpiralSafeChain,
    operation: SigningOperation = "transaction",
  ): Promise<WalletResponse> {
    return this.post("/complete", {
      ...this.identity(username, chain),
      ceremonyId,
      operation,
      credential,
    });
  }

  private identity(username: string, chain?: SpiralSafeChain): Required<WalletIdentity> {
    return { username, chain: chain || this.chain };
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const contentType = response.headers.get("content-type") || "";
    const payload: any = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    if (response.ok) return payload as T;

    const code = payload?.error?.code || "request_failed";
    const message = payload?.error?.message || (typeof payload === "string" ? payload : "Request failed");
    throw new SpiralSafeAPIError(response.status, code, message, payload?.requestId);
  }
}

function normalizeServiceURL(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("baseUrl must be an absolute URL");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("baseUrl cannot include credentials, query parameters, or a fragment");
  }
  const loopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) {
    throw new Error("baseUrl must use HTTPS except for loopback development");
  }
  return parsed.toString().replace(/\/$/, "");
}

function toBase64(value: string | Uint8Array): string {
  if (typeof value === "string") return value;
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

# Spiral Safe SDK

Typed, low-level access to the public Spiral Safe service. The SDK sends a
tenant-scoped bearer token to the service; it never accepts a Vault token and
never receives wallet private keys.

The browser extension is the preferred Solana Wallet Standard integration. Use
this SDK when an application needs to drive the HTTP/WebAuthn ceremony itself.

## Install and configure

```bash
npm install @spiralsafe/sdk
```

```ts
import { SpiralSafeSDK } from "@spiralsafe/sdk";

const spiralSafe = new SpiralSafeSDK({
  baseUrl: "https://safe.example.com",
  apiToken: tenantScopedToken,
  chain: "solana", // or "ethereum"
});
```

Only loopback development URLs may use plain HTTP. The API token should be
delivered by your application/session layer, not embedded in a public bundle.

## Ceremony lifecycle

Registration is a paired, one-time ceremony:

```ts
const begin = await spiralSafe.init("alice");
const credential = await navigator.credentials.create({
  publicKey: decodeCreationOptions(begin),
});
const wallet = await spiralSafe.create(
  "alice",
  begin.ceremonyId,
  serializeRegistrationCredential(credential),
);
```

Signing has the same pairing. `payload` is either standard-base64 text or raw
bytes; the SDK encodes raw bytes before transport.

```ts
const begin = await spiralSafe.signin({
  username: "alice",
  chain: "solana",
  operation: "transaction", // or "message"
  payload: unsignedTransactionBytes,
});
const assertion = await navigator.credentials.get({
  publicKey: decodeRequestOptions(begin),
});
const signed = await spiralSafe.complete(
  "alice",
  begin.ceremonyId,
  serializeAuthenticationCredential(assertion),
);
```

The SDK intentionally does not hide the WebAuthn conversion helpers: WebAuthn
must execute under the relying party's browser origin. The extension includes
the complete conversion and Wallet Standard implementation.

## API

- `init(username, chain?)` — start registration.
- `create(username, ceremonyId, credential, chain?)` — finish registration.
- `check(username, chain?)` — return the tenant/chain-local wallet address.
- `signin({ username, chain?, operation?, payload })` — start authorization.
- `complete(username, ceremonyId, credential, chain?)` — finish authorization
  and return `encodedTX` (Solana transaction) or `signature` (messages and
  Ethereum EIP-191 messages).

Non-success responses throw `SpiralSafeAPIError` with `status`, `code`, and the
service `requestId` when available.

## Security boundary

The browser sees a scoped service token, public wallet address, WebAuthn
challenges, and signed output. Vault owns the encrypted wallet record and
performs signing only after consuming a valid one-time WebAuthn ceremony.

## License

Apache-2.0. See [LICENSE](LICENSE).

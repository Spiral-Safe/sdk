# SpiralSafe SDK

The SpiralSafe SDK is a TypeScript library that provides an interface to interact with the SpiralSafe authentication service. It allows developers to easily integrate secure user authentication, registration, and transaction signing into their applications.

## Table of Contents

- [Installation](#installation)
- [Initialization](#initialization)
- [API Reference](#api-reference)
  - [SpiralSafeSDK](#spiralsafesdk-class)
    - [constructor(options)](#constructoroptions)
    - [init(username)](#initusername)
    - [create(username, credential)](#createusername-credential)
    - [check(username)](#checkusername)
    - [signin(username, rawTx)](#signinusername-rawtx)
    - [complete(username, credential)](#completeusername-credential)
- [Usage Example](#usage-example)
- [License](#license)

## Installation

You can install the SpiralSafe SDK via npm:

```bash
npm install @spiralsafe/sdk
```

## Initialization

To use the SDK, you need to import it and create an instance of the `SpiralSafeSDK` class. You can optionally provide configuration options such as the base URL of the SpiralSafe service and a Vault token.

```typescript
import { SpiralSafeSDK } from '@spiralsafe/sdk';

const sdk = new SpiralSafeSDK({
  baseUrl: 'http://localhost:3000', // Default is 'http://localhost:3000'
  vaultToken: 'your-vault-token',   // Default is 'root'
});
```

## API Reference

### `SpiralSafeSDK` Class

The `SpiralSafeSDK` class provides methods to interact with the SpiralSafe authentication service.

#### **Constructor**

#### `constructor(options?: SpiralSafeSDKOptions)`

Creates an instance of the `SpiralSafeSDK` class.

- **Parameters:**
  - `options` (optional): An object containing configuration options.
    - `baseUrl`: The base URL of the SpiralSafe service. Default is `'http://localhost:3000'`.
    - `vaultToken`: The Vault token used for authentication. Default is `'root'`.

- **Example:**

  ```typescript
  const sdk = new SpiralSafeSDK({
    baseUrl: 'http://localhost:3000',
    vaultToken: 'your-vault-token',
  });
  ```

### Methods

#### `init(username: string): Promise<any>`

Initializes a new user registration session. This method should be called when a user begins the registration process. It communicates with the SpiralSafe service to initiate the WebAuthn registration ceremony.

- **Parameters:**
  - `username`: The unique username of the user to be registered.

- **Returns:**
  - A promise that resolves to an object containing registration options required by the WebAuthn API.

- **Usage:**

  ```typescript
  const registrationOptions = await sdk.init('alice');
  // Use registrationOptions in navigator.credentials.create()
  ```

- **Notes:**
  - The returned `registrationOptions` should be passed to `navigator.credentials.create()` to generate a credential.

#### `create(username: string, credential: any): Promise<any>`

Completes the user registration process by providing the credential created by the client's authenticator. This method finalizes the WebAuthn registration ceremony.

- **Parameters:**
  - `username`: The unique username of the user.
  - `credential`: The credential object obtained from `navigator.credentials.create()`.

- **Returns:**
  - A promise that resolves to an object containing the user's public key and credentials.

- **Usage:**

  ```typescript
  const credential = await navigator.credentials.create({ publicKey: registrationOptions });
  const result = await sdk.create('alice', credential);
  ```

- **Notes:**
  - The `credential` must be converted to a suitable format (e.g., using `parseCredential()` function) before sending.

#### `check(username: string): Promise<any>`

Checks if a user is already registered in the SpiralSafe service.

- **Parameters:**
  - `username`: The unique username of the user.

- **Returns:**
  - A promise that resolves to an object containing the user's public key if the user exists.

- **Usage:**

  ```typescript
  const userExists = await sdk.check('alice');
  if (userExists) {
    // Proceed to sign in
  } else {
    // Prompt for registration
  }
  ```

#### `signin(username: string, rawTx: any): Promise<any>`

Initiates a sign-in session for the user and prepares a transaction to be signed. This method begins the WebAuthn authentication ceremony.

- **Parameters:**
  - `username`: The unique username of the user.
  - `rawTx`: The transaction data that needs to be signed by the user.

- **Returns:**
  - A promise that resolves to an object containing authentication options required by the WebAuthn API.

- **Usage:**

  ```typescript
  const authenticationOptions = await sdk.signin('alice', rawTransaction);
  // Use authenticationOptions in navigator.credentials.get()
  ```

- **Notes:**
  - The `rawTx` should be the transaction data encoded in a proper format (e.g., base64).

#### `complete(username: string, credential: any): Promise<any>`

Completes the user authentication process by providing the credential obtained from the client's authenticator. This method finalizes the WebAuthn authentication ceremony and returns the signed transaction.

- **Parameters:**
  - `username`: The unique username of the user.
  - `credential`: The credential object obtained from `navigator.credentials.get()`.

- **Returns:**
  - A promise that resolves to an object containing the signed transaction.

- **Usage:**

  ```typescript
  const credential = await navigator.credentials.get({ publicKey: authenticationOptions });
  const result = await sdk.complete('alice', credential);
  ```

- **Notes:**
  - The `credential` must be converted to a suitable format before sending.
  - The returned `encodedTX` contains the signed transaction.

## Usage Example

Here's an example of how to use the SpiralSafe SDK to register and authenticate a user.

```typescript
import { SpiralSafeSDK } from '@spiralsafe/sdk';

const sdk = new SpiralSafeSDK();

// Registration
async function register(username: string) {
  try {
    // Initialize registration
    const options = await sdk.init(username);

    // Use WebAuthn API to create credentials
    const credential = await navigator.credentials.create({ publicKey: options });

    // Complete registration
    const result = await sdk.create(username, credential);
    console.log('User registered:', result);
  } catch (error) {
    console.error('Registration error:', error);
  }
}

// Authentication
async function authenticate(username: string, rawTransaction: string) {
  try {
    // Initiate sign-in
    const options = await sdk.signin(username, rawTransaction);

    // Use WebAuthn API to get credentials
    const credential = await navigator.credentials.get({ publicKey: options });

    // Complete authentication and get signed transaction
    const result = await sdk.complete(username, credential);
    console.log('Signed Transaction:', result.encodedTX);
  } catch (error) {
    console.error('Authentication error:', error);
  }
}
```

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

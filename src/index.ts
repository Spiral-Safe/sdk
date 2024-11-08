import fetch from 'cross-fetch';

interface SpiralSafeSDKOptions {
  baseUrl?: string;
  vaultToken?: string;
}

export class SpiralSafeSDK {
  private baseUrl: string;
  private vaultToken: string;

  constructor(options?: SpiralSafeSDKOptions) {
    this.baseUrl = options?.baseUrl || 'http://localhost:3000';
    this.vaultToken = options?.vaultToken || 'root';
  }

  // Initialize a user
  async init(username: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/init`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username }),
    });
    return this.handleResponse(response);
  }

  // Create a user with credential
  async create(username: string, credential: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, credential }),
    });
    return this.handleResponse(response);
  }

  // Check if a user exists
  async check(username: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username }),
    });
    return this.handleResponse(response);
  }

  // Sign in a user
  async signin(username: string, rawTx: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/signin`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, rawTx }),
    });
    return this.handleResponse(response);
  }

  // Complete authentication
  async complete(username: string, credential: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, credential }),
    });
    return this.handleResponse(response);
  }

  // Helper method to handle responses
  private async handleResponse(response: Response): Promise<any> {
    if (response.ok) {
      return response.json();
    } else {
      const error = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(error)}`);
    }
  }

  // Helper method to get headers
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Vault-Token': this.vaultToken,
    };
  }
}
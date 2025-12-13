declare module "intuit-oauth" {
  interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: "sandbox" | "production";
    redirectUri: string;
  }

  interface AuthResponse {
    token: {
      access_token: string;
      refresh_token: string;
      realmId: string;
      expires_in: number;
      token_type: string;
    };
  }

  interface Token {
    access_token?: string;
    refresh_token: string;
    realmId?: string;
    expires_in?: number;
    token_type?: string;
  }

  interface MakeApiCallOptions {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: string;
  }

  interface ApiResponse {
    json: unknown;
    response: Response;
  }

  interface Scopes {
    Accounting: string;
    Payment: string;
    Payroll: string;
    TimeTracking: string;
    Benefits: string;
    Profile: string;
    Email: string;
    Phone: string;
    Address: string;
    OpenId: string;
  }

  class OAuthClient {
    constructor(config: OAuthClientConfig);

    static scopes: Scopes;

    authorizeUri(params: {
      scope: string[];
      state: string;
    }): string;

    createToken(uri: string): Promise<AuthResponse>;

    refresh(): Promise<AuthResponse>;

    refreshUsingToken(refreshToken: string): Promise<AuthResponse>;

    setToken(token: Token): void;

    getToken(): Token;

    makeApiCall(options: MakeApiCallOptions): Promise<ApiResponse>;

    isAccessTokenValid(): boolean;
  }

  export default OAuthClient;
}

import { getAuthUrl, getTokensFromCode, refreshToken } from "../quickbooks";

const fetchMock = jest.fn();
const originalFetch = global.fetch;
beforeEach(() => {
  process.env.QUICKBOOKS_CLIENT_ID = "test-client";
  process.env.QUICKBOOKS_CLIENT_SECRET = "test-secret";
  process.env.QUICKBOOKS_REDIRECT_URI = "https://example.test/api/quickbooks/callback";
  global.fetch = fetchMock;
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ access_token: "access", refresh_token: "refresh", expires_in: 3600 }) });
});
afterAll(() => { global.fetch = originalFetch; });
test("authorization URL preserves scope and encodes the callback", () => {
  const url = new URL(getAuthUrl());
  expect(url.origin).toBe("https://appcenter.intuit.com");
  expect(url.searchParams.get("redirect_uri")).toBe(process.env.QUICKBOOKS_REDIRECT_URI);
  expect(url.searchParams.get("scope")).toBe("com.intuit.quickbooks.accounting com.intuit.quickbooks.payment");
});
test("authorization code exchange sends encoded form data and maps token expiry", async () => {
  const tokens = await getTokensFromCode("code&with=special", "realm");
  expect(tokens).toMatchObject({ accessToken: "access", refreshToken: "refresh", realmId: "realm" });
  expect(tokens.expiresAt.getTime()).toBeGreaterThan(Date.now());
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer");
  expect(new URLSearchParams(init.body).get("code")).toBe("code&with=special");
  expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("test-client:test-secret").toString("base64")}`);
});
test("refresh requests have no shared mutable token state", async () => {
  await Promise.all([refreshToken("first-refresh"), refreshToken("second-refresh")]);
  expect(fetchMock.mock.calls.map(([, init]) => new URLSearchParams(init.body).get("refresh_token"))).toEqual(["first-refresh", "second-refresh"]);
});
test("provider rejection and malformed success responses fail closed", async () => {
  fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
  await expect(refreshToken("bad")).rejects.toThrow("401");
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "" }) });
  await expect(refreshToken("bad")).rejects.toThrow();
});

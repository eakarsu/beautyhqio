/**
 * Kiosk client helper.
 *
 * A kiosk device is provisioned once with its location's token, supplied as a
 * `?kioskToken=...` query parameter (the installer configures the home URL) and
 * remembered in localStorage so subsequent navigation keeps working. The token
 * is bound to a single location, so a kiosk can only ever see its own salon.
 */

const STORAGE_KEY = "beautyhq.kioskToken";

/** Read the token from the URL once, then persist it for later requests. */
export function kioskToken(): string {
  if (typeof window === "undefined") return "";

  const fromUrl = new URLSearchParams(window.location.search).get("kioskToken");
  if (fromUrl) {
    try {
      window.localStorage.setItem(STORAGE_KEY, fromUrl);
    } catch {
      /* storage may be unavailable; the URL value still works for this page */
    }
    return fromUrl;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Headers for any kiosk API call. */
export function kioskHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = kioskToken();
  return token ? { ...extra, "x-kiosk-token": token } : extra;
}

/**
 * True when this device has not been provisioned. Kiosk pages use it to show an
 * administrator message instead of a confusing 401.
 */
export function kioskUnprovisioned(): boolean {
  return !kioskToken();
}

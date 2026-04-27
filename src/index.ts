import { patchGlobalFetch } from './patches/fetch.js';
import { patchHttp } from './patches/http.js';
import { forwardCookiesToClient } from './forwarder.js';
import { CookieForwardConfig } from './types.js';
import { splitSetCookieString } from './parser.js';

export type { CookieForwardConfig } from './types.js';

/**
 * Global Mode (Recommended for Node.js/instrumentation.ts)
 * Configure automatic fetch and http/https patching.
 */
export async function setupCookieAutoForward(config: CookieForwardConfig = {}) {
  patchGlobalFetch(config);
  await patchHttp(config);
}

/**
 * Local Mode (Recommended for Edge Runtime or precision)
 * Helper that wraps fetch and forwards the cookies for that specific request.
 */
export async function fetchWithCookiesForward(
  input: RequestInfo | URL,
  init?: RequestInit,
  config: CookieForwardConfig = {},
): Promise<Response> {
  const response = await fetch(input, init);

  let setCookies: string[] = [];

  // Extract cookies using the modern standard or string fallback
  if (typeof response.headers.getSetCookie === 'function') {
    setCookies = response.headers.getSetCookie();
  } else {
    const rawSetCookie = response.headers.get('set-cookie');
    if (rawSetCookie) {
      setCookies = splitSetCookieString(rawSetCookie);
    }
  }

  // Attempt to forward to the client (will fail silently if it is a Server Component)
  await forwardCookiesToClient(setCookies, config);

  return response;
}

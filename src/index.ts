import { patchGlobalFetch } from './patches/fetch.js';
import { patchHttp } from './patches/http.js';
import { forwardCookiesToClient, getClientCookiesHeader } from './forwarder.js';
import { CookieForwardConfig } from './types.js';
import { splitSetCookieString } from './parser.js';
import debug from "debug"

export type { CookieForwardConfig, ParsedCookie } from './types.js';

const log = debug("next-cookie-bridge:init");

/**
 * Global Mode (Recommended for Node.js/instrumentation.ts)
 * Configure automatic fetch and http/https patching.
 */
export async function setupCookieAutoForward(config: CookieForwardConfig = {
  forwardClientCookies: true
}) {
  log("Initializing global patches with config: %O", config);
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
  config: CookieForwardConfig = {
    forwardClientCookies: true
  },
): Promise<Response> {

  let finalInit = { ...init };
  if (config.forwardClientCookies) {
    const clientCookies = await getClientCookiesHeader(config.forwardOnly);
    if (clientCookies) {
      const headers = new Headers(finalInit.headers || {});
      const existing = headers.get('cookie');
      headers.set('cookie', existing ? `${existing}; ${clientCookies}` : clientCookies);
      finalInit.headers = headers;
    }
  }

  const response = await fetch(input, finalInit);

  let setCookies: string[] = [];
  if (typeof response.headers.getSetCookie === 'function') {
    setCookies = response.headers.getSetCookie();
  } else {
    const rawSetCookie = response.headers.get('set-cookie');
    if (rawSetCookie) {
      setCookies = splitSetCookieString(rawSetCookie);
    }
  }

  await forwardCookiesToClient(setCookies, config);

  return response;
}

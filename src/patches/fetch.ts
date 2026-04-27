import { TRIGGER_HEADER, PATCH_SYMBOL_FETCH } from '../constants.js';
import { forwardCookiesToClient, getClientCookiesHeader } from '../forwarder.js';
import { CookieForwardConfig } from '../types.js';
import { splitSetCookieString } from '../parser.js';

export function patchGlobalFetch(config: CookieForwardConfig) {
  if ((globalThis as any)[PATCH_SYMBOL_FETCH]) return;
  (globalThis as any)[PATCH_SYMBOL_FETCH] = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function(
    input: RequestInfo | URL,
    init?: RequestInit,
  ) {
    let shouldForward = false;

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined),
    );

    if (headers.get(TRIGGER_HEADER) === 'true') {
      shouldForward = true;
      headers.delete(TRIGGER_HEADER);

      if (config.forwardClientCookies) {
        const clientCookies = await getClientCookiesHeader(config.forwardOnly);
        if (clientCookies) {

          const existingCookies = headers.get('cookie');
          headers.set('cookie', existingCookies
            ? `${existingCookies}; ${clientCookies}`
            : clientCookies
          );
        }
      }
    }

    const finalInit: RequestInit = { ...init, headers };

    let finalInput = input;
    if (input instanceof Request) {

      finalInput = new Request(input, {
        headers: headers
      });
    }

    const response = await originalFetch(finalInput, input instanceof Request ? undefined : finalInit);

    if (shouldForward) {

      let setCookies: string[] = [];

      if (typeof response.headers.getSetCookie === 'function') {
        setCookies = response.headers.getSetCookie();
      } else {
        const rawSetCookie = response.headers.get('set-cookie');
        if (rawSetCookie) {
          setCookies = splitSetCookieString(rawSetCookie);
        }
      }
      forwardCookiesToClient(setCookies, config).catch(() => { });
    }

    return response;
  };
}

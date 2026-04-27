import { TRIGGER_HEADER, PATCH_SYMBOL_FETCH } from '../constants.js';
import { forwardCookiesToClient } from '../forwarder.js';
import { CookieForwardConfig } from '../types.js';
import { splitSetCookieString } from '../parser.js';

export function patchGlobalFetch(config: CookieForwardConfig) {
  if ((globalThis as any)[PATCH_SYMBOL_FETCH]) return;
  (globalThis as any)[PATCH_SYMBOL_FETCH] = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function (
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
    }

    let finalInput = input;
    const finalInit = { ...init, headers };

    if (input instanceof Request && shouldForward) {
      finalInput = new Request(input, { headers });
    }

    const response = await originalFetch(finalInput, finalInit);

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
      forwardCookiesToClient(setCookies, config).catch(() => {});
    }

    return response;
  };
}

import { TRIGGER_HEADER, PATCH_SYMBOL_HTTP } from '../constants.js';
import { forwardCookiesToClient, getClientCookiesHeader } from '../forwarder.js';
import { CookieForwardConfig } from '../types.js';

export async function patchHttp(config: CookieForwardConfig) {
  if (typeof process === 'undefined' || !process.versions?.node) return;
  if ((globalThis as any)[PATCH_SYMBOL_HTTP]) return;

  (globalThis as any)[PATCH_SYMBOL_HTTP] = true;

  try {
    const http = await import('node:http');
    const https = await import('node:https');

    const patchMethod = (module: any) => {
      const originalRequest = module.request;

      module.request = function(...args: any[]) {
        const req = originalRequest.apply(this, args);

        let shouldForward = false;
        const triggerValue =
          req.getHeader(TRIGGER_HEADER) ||
          req.getHeader(TRIGGER_HEADER.toLowerCase());

        if (triggerValue === 'true') {
          shouldForward = true;
          req.removeHeader(TRIGGER_HEADER);
          req.removeHeader(TRIGGER_HEADER.toLowerCase());

          if (config.forwardClientCookies) {

            getClientCookiesHeader(config.forwardOnly)
              .then((clientCookies) => {
                if (clientCookies) {
                  const existing = req.getHeader('cookie') || '';

                  const finalCookies = existing
                    ? `${existing}; ${clientCookies}`
                    : clientCookies;

                  req.setHeader('cookie', finalCookies);
                }
              })
              .catch(() => {
              });
          }
        }

        req.on('response', (res: any) => {
          if (shouldForward && res.headers['set-cookie']) {
            let cookies = res.headers['set-cookie'];
            if (!Array.isArray(cookies)) cookies = [cookies];

            forwardCookiesToClient(cookies, config).catch(() => { });
          }
        });

        return req;
      };
    };

    patchMethod(http);
    patchMethod(https);
  } catch (e) {
  }
}

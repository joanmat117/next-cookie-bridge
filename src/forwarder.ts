import { cookies } from 'next/headers.js';
import { parseSetCookieHeader } from './parser.js';
import { DEFAULT_OMIT_COOKIES } from './constants.js';
import { CookieForwardConfig } from './types.js';
import debug from "debug"

const logInbound = debug("next-cookie-bridge:inbound");
const logOutbound = debug("next-cookie-bridge:outbound");

export async function forwardCookiesToClient(
  setCookieHeaders: string[],
  config: CookieForwardConfig = {},
) {

  logOutbound("Intercepted Set-Cookie headers from API: %o", setCookieHeaders);

  if (!setCookieHeaders || setCookieHeaders.length === 0) return;

  const omitList = (config.omit || DEFAULT_OMIT_COOKIES).map((c) =>
    c.toLowerCase(),
  );
  const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

  const cookiesToSet = setCookieHeaders
    .map(parseSetCookieHeader)
    .filter((c) => !omitList.includes(c.name.toLowerCase()));

  logOutbound("Cookies allowed to be set on client: %o", cookiesToSet.map(c => c.name));

  if (cookiesToSet.length === 0) return;

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (e) {
    logOutbound("Cookie injection aborted: running inside a Server Component (RSC)");
    console.warn(
      '[next-cookie-bridge] Operation omitted: Cookies cannot be set during the rendering of an RSC',
    );
    return;
  }

  for (const cookie of cookiesToSet) {
    try {
      const path = config.forcePathRoot ? '/' : cookie.path || '/';

      cookieStore.set({
        name: cookie.name,
        value: cookie.value,
        httpOnly: cookie.httpOnly ?? true,
        secure: isDev ? false : (cookie.secure ?? true),
        sameSite: cookie.sameSite || 'lax',
        path: path,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
      });
    } catch (e) {
      if (isDev) {
        console.warn(
          `[next-cookie-bridge] Cannot set ${cookie.name} cookie :`,
          e instanceof Error ? e.message : e,
        );
      }
    }
  }
}

export async function getClientCookiesHeader(
  allowedCookies?: string[]
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    let allCookies = cookieStore.getAll();

    if (allCookies.length === 0) return null;

    if (allowedCookies && allowedCookies.length > 0) {
      const allowedLower = allowedCookies.map(name => name.toLowerCase());
      allCookies = allCookies.filter(c =>
        allowedLower.includes(c.name.toLowerCase())
      );
    }

    if (allCookies.length === 0) return null;

    const clientCookies = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    if (clientCookies) {
      logInbound("Forwarding client cookies to API: %s", clientCookies);
    } else {
      logInbound("No client cookies found to forward");
    }
    return clientCookies

  } catch (e) {
    return null;
  }
}

import { cookies } from 'next/headers.js';
import { parseSetCookieHeader } from './parser.js';
import { DEFAULT_OMIT_COOKIES } from './constants.js';
import { CookieForwardConfig } from './types.js';

export async function forwardCookiesToClient(
  setCookieHeaders: string[],
  config: CookieForwardConfig = {},
) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return;

  const omitList = (config.omit || DEFAULT_OMIT_COOKIES).map((c) =>
    c.toLowerCase(),
  );
  const isDev = process.env.NODE_ENV === 'development';

  const cookiesToSet = setCookieHeaders
    .map(parseSetCookieHeader)
    .filter((c) => !omitList.includes(c.name.toLowerCase()));

  if (cookiesToSet.length === 0) return;

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (e) {
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

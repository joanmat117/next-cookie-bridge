import { ParsedCookie } from './types.js';

export function splitSetCookieString(cookiesStr: string): string[] {
  if (!cookiesStr) return [];

  const cookies: string[] = [];
  let start = 0;

  for (let i = 0; i < cookiesStr.length; i++) {
    if (cookiesStr[i] === ',') {
      const lookahead = cookiesStr.slice(i + 1).trim();

      if (/^[a-zA-Z0-9._-]+ *=/.test(lookahead)) {
        cookies.push(cookiesStr.slice(start, i).trim());
        start = i + 1;
      }
    }
  }
  cookies.push(cookiesStr.slice(start).trim());
  return cookies.filter(Boolean);
}

export function parseSetCookieHeader(header: string): ParsedCookie {
  const parts = header.split(';').map((p) => p.trim());
  const [nameValue, ...attributes] = parts;
  const eqIndex = nameValue.indexOf('=');

  if (eqIndex === -1) return { name: nameValue, value: '' };

  const name = nameValue.substring(0, eqIndex);
  const value = nameValue.substring(eqIndex + 1);

  const cookie: ParsedCookie = { name, value };

  for (const attr of attributes) {
    const [attrName, ...attrValParts] = attr.split('=');
    const attrValue = attrValParts.join('=');
    const lowerName = attrName.toLowerCase();

    if (lowerName === 'max-age') cookie.maxAge = parseInt(attrValue, 10);
    else if (lowerName === 'httponly') cookie.httpOnly = true;
    else if (lowerName === 'secure') cookie.secure = true;
    else if (lowerName === 'samesite')
      cookie.sameSite = attrValue.toLowerCase() as any;
    else if (lowerName === 'path') cookie.path = attrValue;
    else if (lowerName === 'expires') cookie.expires = new Date(attrValue);
  }

  return cookie;
}

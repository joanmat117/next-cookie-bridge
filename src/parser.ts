import { ParsedCookie } from './types.js';

export function splitSetCookieString(cookiesStr: string): string[] {
  if (!cookiesStr) return [];
  return cookiesStr.split(/,(?=\s*[a-zA-Z0-9_-]+\s*=)/);
}

export function parseSetCookieHeader(header: string): ParsedCookie {
  const parts = header.split(';').map((p) => p.trim());
  const [nameValue, ...attributes] = parts;
  const [name, ...valueParts] = nameValue.split('=');
  const value = valueParts.join('=');

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

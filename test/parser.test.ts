import { describe, it, expect } from 'vitest';
import { splitSetCookieString, parseSetCookieHeader } from '../src/parser';

describe('Cookie Parser', () => {
  it('should split multiple cookies correctly, ignoring commas in dates', () => {
    const raw = 'session=123; Expires=Mon, 01 Jan 2026 00:00:00 GMT; HttpOnly, theme=dark; Path=/';
    const parts = splitSetCookieString(raw);

    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain('session=123');
    expect(parts[1]).toContain('theme=dark');
  });

  it('should parse cookie attributes correctly', () => {
    const header = 'auth=abc; Max-Age=3600; SameSite=Lax; Secure; HttpOnly';
    const parsed = parseSetCookieHeader(header);

    expect(parsed.name).toBe('auth');
    expect(parsed.value).toBe('abc');
    expect(parsed.maxAge).toBe(3600);
    expect(parsed.sameSite).toBe('lax');
    expect(parsed.secure).toBe(true);
    expect(parsed.httpOnly).toBe(true);
  });
});

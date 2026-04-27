import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forwardCookiesToClient } from '../src/forwarder';

const mockSet = vi.fn();
vi.mock('next/headers.js', () => ({
  cookies: () =>
    Promise.resolve({
      set: mockSet,
    }),
}));

describe('Cookie Forwarder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should forward cookies to the store', async () => {
    const headers = ['test=val; Path=/api'];
    await forwardCookiesToClient(headers);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test',
        value: 'val',
      }),
    );
  });

  it('should omit cookies in the omit list', async () => {
    const headers = ['JSESSIONID=secret', 'user=joan'];
    await forwardCookiesToClient(headers, { omit: ['JSESSIONID'] });

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'JSESSIONID' }),
    );
  });

  it('should force path root when config is set', async () => {
    const headers = ['foo=bar; Path=/subroute'];
    await forwardCookiesToClient(headers, { forcePathRoot: true });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/',
      }),
    );
  });
});

export const TRIGGER_HEADER = 'X-Cookie-Auto-Forward';

export const DEFAULT_OMIT_COOKIES = [
  'AWSALB',
  'AWSALBCORS',
  'JSESSIONID',
  'PHPSESSID',
  '_cfuid',
  '__cf_bm',
];

export const PATCH_SYMBOL_FETCH = Symbol.for(
  'next-cookie-bridge-patched-fetch',
);
export const PATCH_SYMBOL_HTTP = Symbol.for('next-cookie-bridge-patched-http');

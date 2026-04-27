export interface CookieForwardConfig {
  omit?: string[];
  forcePathRoot?: boolean;
  forwardClientCookies?: boolean;
  forwardOnly?: string[];
}

export interface ParsedCookie {
  name: string;
  value: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

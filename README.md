# Next.js Cookie Bridge

![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)

**Next.js Cookie Bridge** is a utility designed to automate the forwarding of cookies (`Set-Cookie`) from external APIs to the client using the Next.js App Router.

It is ideal for architectures where your Next.js server acts as a proxy or BFF (Backend-for-Frontend) and you need session or authentication cookies issued by an external backend to reach the user's browser correctly.

## ✨ Features

* **Automatic Mode:** Patches global `fetch` and `http/https` to forward cookies without extra code in every request.
* **Local Mode:** A `fetch` wrapper for granular control.
* **App Router Ready:** Deeply integrated with `next/headers`.
* **Smart Filters:** Automatically omits infrastructure cookies (AWS, Cloudflare, etc.).
* **Security:** Corrects and handles `HttpOnly`, `Secure`, and `SameSite` attributes.

---

## 🚀 Installation

```bash
npm install next-cookie-bridge
# or
pnpm add next-cookie-bridge
```

---

## 🛠️ Main Usage (Recommended)

The best way to use this library is through the Next.js `instrumentation.ts` file to enable global auto-forwarding.

### 1. Configure Instrumentation
Create or edit your `instrumentation.ts` file in your project root (or inside `src/`):

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupCookieAutoForward } = await import('next-cookie-bridge');
    await setupCookieAutoForward({
      forcePathRoot: true, // Optional: forces all cookies to path='/'
      omit: ['SOME_INTERNAL_COOKIE'] // Optional: additional cookies to ignore
    });
  }
}
```

### 2. Trigger Forwarding
Once globally configured, simply add a trigger header to any `fetch` call you want to act as a bridge:

```typescript
// Inside a Server Action or Route Handler
const response = await fetch('https://api.your-backend.com/login', {
  method: 'POST',
  headers: {
    'X-Cookie-Auto-Forward': 'true', // Activates the bridge; removed before hitting the API
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ user, pass })
});
```

---

## 🧪 Local Usage (No global patch)

If you prefer not to affect the global `fetch` behavior, you can use the local wrapper:

```typescript
import { fetchWithCookiesForward } from 'next-cookie-bridge';

export async function POST() {
  const res = await fetchWithCookiesForward('https://api.external.com/auth', {
    method: 'POST'
  });
  
  return Response.json({ success: true });
}
```

---

## ⚙️ Configuration (`CookieForwardConfig`)

| Property | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `omit` | `string[]` | List of cookie names that should NOT be forwarded. | `['AWSALB', 'JSESSIONID', ...]` |
| `forcePathRoot` | `boolean` | If `true`, overrides the cookie path to `/`. | `false` |

---

## ⚠️ Important Limitations

1.  **Server Components (RSC):** Due to Next.js limitations, cookies cannot be set during the rendering of a component. Forwarding will fail silently with a console warning.
2.  **Context:** This library works exclusively in **Server Actions**, **Route Handlers**, and **Middleware** (via local mode).
3.  **Domain:** The `domain` attribute from original cookies is intentionally omitted to ensure the cookie is assigned to your Next.js application's domain.

---

## 📄 License

MIT © 2026 [Joan Matias](https://github.com/joanmat117)

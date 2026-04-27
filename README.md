# Next.js Cookie Bridge

![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)

**Next.js Cookie Bridge** is a two-way cookie synchronization tool for **Server Actions, Route Handlers, and Middleware**. 

When your Next.js server talks to an external API, cookies often get lost in the middle. This library creates an automatic "tunnel" that forwards cookies between the user's browser and your backend in both directions.

## 🤔 What does it do?

It handles the cookie flow when your Next.js server acts as a bridge:

1.  **Client → API (Inbound):** It collects cookies from the user's browser and injects them into your server-side `fetch` or `Axios` requests. Your backend now recognizes the user.
2.  **API → Client (Outbound):** It intercepts `Set-Cookie` headers from your backend response and automatically applies them to the user's browser.



---

## ✨ Features

* **Two-Way Sync:** Seamless flow from Browser to API and back.
* **Automatic Patching:** Works globally with `fetch`, `Axios`, and `node:http`.
* **Security Control:** Use `forwardOnly` to select exactly which cookies are allowed to leave your server.
* **Universal:** Optimized for both Node.js (via Global Patch) and Edge Runtime (via Helper).

---

## 🚀 Installation

```bash
npm i next-cookie-bridge
```

---

## 🛠️ Global Mode (Node.js)

The most efficient way. Set it up once in your `instrumentation.ts` and forget about it.

### 1. Setup
```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupCookieAutoForward } = await import('next-cookie-bridge');
    
    setupCookieAutoForward({
      forwardClientCookies: true, // Send browser cookies to the API, it is true by default
      forwardOnly: ['session_id'], // Security: Only forward specific cookies
      forcePathRoot: true,
    });
  }
}
```

### 2. Usage
Just add the trigger header to any server-side request:

```typescript
// Works in Server Actions & Route Handlers
const response = await fetch('https://api.external-backend.com/profile', {
  headers: {
    'X-Cookie-Auto-Forward': 'true' 
  }
});
```

---

## 🧪 Local Mode (Edge & Middleware)

If you are working in the **Edge Runtime** or want surgical precision without global patches, use the helper.

```typescript
import { fetchWithCookiesForward } from 'next-cookie-bridge';

export async function POST() {
  // This helper handles the two-way sync for this specific call
  return await fetchWithCookiesForward('https://api.external.com/auth', {
    method: 'POST'
  }, {
    forwardClientCookies: true, // it is true by default
    forwardOnly: ['auth_token']
  });
}
```

---

## ⚙️ Configuration Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `forwardClientCookies` | `boolean` | If `true`, forwards browser cookies to the external API. |
| `forwardOnly` | `string[]` | Specific cookies allowed to be sent to the API. |
| `omit` | `string[]` | Cookies from the API to ignore (e.g., `AWSALB`). |
| `forcePathRoot` | `boolean` | Forces `path=/` on all forwarded cookies. |

---

## 📄 License

MIT © 2026 [Joan Matias](https://github.com/joanmat117)

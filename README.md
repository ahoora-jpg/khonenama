# خونه‌نما — khonenama.ir

مرجع تخصصی دکوراسیون و خدمات منزل، با شروع از کرج و خیابان برغان.

## Stack

- Next.js 16 + React 19
- Three.js + React Three Fiber + Drei برای 3D واقعی Hero
- vinext + Cloudflare Workers
- TypeScript
- Mobile-first RTL UI

## Local development

```bash
npm install
npm run dev
```

## Cloudflare-compatible development

```bash
npm run dev:vinext
npm run build:vinext
```

## Deploy

```bash
npm run deploy
```

اتصال دامنه `khonenama.ir` و تنظیم credentials کلادفلر در مرحله deployment انجام می‌شود.

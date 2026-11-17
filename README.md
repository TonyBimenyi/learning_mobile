# Twige Academy Mobile

Ionic Vue mobile client for the Django e-learning backend in `../backend`.

## Run

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so run the Django API at the same time:

```bash
cd ../backend
python manage.py runserver 127.0.0.1:8000
```

## API base URL (important for checkout)

All API calls use `VITE_API_BASE` from the active `.env` file — nothing is hardcoded in source.
See `src/main.js` and `src/services/api.js`.

- **Local web dev (default):** `.env.local` sets `VITE_API_BASE=` (empty). Requests such as
  `/api/payments/afripay/` go through the Vite proxy to `http://127.0.0.1:8000`.
  Keep the Django backend running for checkout to work.
- **Remote server / Android APK:** set a live backend URL, e.g. in `.env.ngrok`:
  ```bash
  VITE_API_BASE=https://your-current-tunnel.ngrok-free.dev
  VITE_API_MODE=ngrok
  ```
  then build with `npm run build -- --mode ngrok` and sync the APK.
  Free ngrok URLs change on every restart — update this value and rebuild the APK
  whenever the tunnel changes. A stale URL is the usual cause of a
  "Failed to fetch / Network Error" when tapping **Pay with AfriPay**.

## Video playback

Lesson videos use the direct Cloudflare R2 (`r2.dev`) URL first — it is an edge
request, so playback starts quickly. The backend byte-range proxy
(`/api/videos/stream/`) is only a fallback if the direct URL fails; its relative
path is resolved against `VITE_API_BASE` so it works in the APK too. The player
uses `preload="auto"` so buffering starts as soon as a lesson is selected.

## Notes

- Built with Vue 3 + Ionic Vue using the Vue Options API.
- UI uses plain HTML elements plus `ion-page` and `ion-content` only.
- Watch progress, language, and device preferences are stored locally for now.
- Profile updates sync to `/api/users/:id/` when a valid auth token exists.

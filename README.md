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

## Notes

- Built with Vue 3 + Ionic Vue using the Vue Options API.
- UI uses plain HTML elements plus `ion-page` and `ion-content` only.
- Watch progress, language, and device preferences are stored locally for now.
- Profile updates sync to `/api/users/:id/` when a valid auth token exists.

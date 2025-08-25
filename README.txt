# LoanApp Fixed

- `server.js` uses `DATABASE_URL` and exposes:
  - `POST /apply` to insert an application
  - `GET /applications?limit=100` to list applications (most recent first)
- Static files are served from `public/`:
  - `public/index.html` — the **Apply** page (formerly new-apply.html). It only navigates after a successful submit.
  - `public/applications-list.html` — loads **live data** from `/applications` and shows it in your styled table. No dummy rows.

## Run
```bash
npm i express pg dotenv
export DATABASE_URL='postgres://user:pass@host:port/dbname?sslmode=require'
export PORT=3000
node server.js
```
Then open http://localhost:${PORT}/ (the Apply page). Submit to create a record, then you’ll be redirected to the list.
# LoanApp (Render-ready)

## Deploy
1) Push this folder to GitHub.
2) In Render → your Web Service → Environment, set `DATABASE_URL` to your internal Postgres URL.
3) Build: `npm install`  •  Start: `npm start`.

## Endpoints
- POST /apply → inserts a row; for native form posts it **redirects** to `/admin-applications.html` (303).  
  For JSON clients, send `Accept: application/json` or `?json=1` to receive JSON.
- GET /applications?limit=100 → list rows (JSON).
- GET /health → database probe.

## Static pages
- public/index.html → application form (native POST to /apply)  
- public/admin-applications.html → admin viewer (fetches from /applications)  
- public/test.html → simple writer (optional)

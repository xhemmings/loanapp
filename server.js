// Express + Postgres (Render-ready)
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { URL } = require('url');

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function buildPool() {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error('DATABASE_URL is not set');
  let sslOpt;
  try {
    const u = new URL(cs);
    sslOpt = (/\.render\.com$/i).test(u.hostname) ? { rejectUnauthorized: false } : false;
    console.log('[DB] host:', u.hostname, 'db:', u.pathname.replace(/^\//,''));
  } catch {
    sslOpt = process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false };
  }
  return new Pool({ connectionString: cs, ssl: sslOpt });
}
const pool = buildPool();

app.get('/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: r.rows?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/apply', async (req, res) => {
  const b = req.body || {};
  const clean = v => (typeof v === 'string' ? v.trim() : v);

  const d = {
    firstName: clean(b.firstName),
    lastName: clean(b.lastName),
    email: clean(b.email),
    phoneArea: clean(b.phoneArea) || clean(b['phone-area']),
    phoneMid: clean(b.phoneMid) || clean(b['phone-mid']),
    phoneLast: clean(b.phoneLast) || clean(b['phone-last']),
    addressLine1: clean(b.addressLine1),
    addressLine2: clean(b.addressLine2) || null,
    parish: clean(b.parish) || clean(b.parishSelect) || null,
    selectedTermMonths: b.selectedTermMonths ? parseInt(b.selectedTermMonths, 10) : null,
    promotionId: clean(b.promotionId) || clean(b.promoSelect) || null
  };

  for (const k of ['firstName','lastName','email','phoneArea','phoneMid','phoneLast','addressLine1']) {
    if (!d[k]) return res.status(400).json({ ok:false, error:`Missing required field: ${k}` });
  }

  const applicationId = `APP-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`;
  const phone_full = `(${d.phoneArea}) ${d.phoneMid}-${d.phoneLast}`;

  const sql = `
    INSERT INTO applications
      (application_id, first_name, last_name, email,
       phone_area, phone_mid, phone_last, phone_full,
       address1, address2, parish, term_months, promotion_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING application_id
  `;
  const params = [
    applicationId, d.firstName, d.lastName, d.email,
    d.phoneArea, d.phoneMid, d.phoneLast, phone_full,
    d.addressLine1, d.addressLine2, d.parish,
    d.selectedTermMonths, d.promotionId
  ];

  try {
    const r = await pool.query(sql, params);
    const wantsJSON = (req.get('accept') || '').includes('application/json') || req.query.json === '1';
    if (wantsJSON) {
      return res.json({ ok: true, applicationId: r.rows[0].application_id });
    }
    return res.redirect(303, '/admin-applications.html');
  } catch (e) {
    console.error('[DB] insert error:', e.message);
    res.status(500).json({ ok: false, error: 'Database insert failed' });
  }
});

app.get('/applications', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
  try {
    const { rows } = await pool.query(
      `SELECT application_id, first_name, last_name, email,
              phone_full, address1, address2, parish,
              term_months, promotion_id, created_at
       FROM applications
       ORDER BY id DESC
       LIMIT $1`, [limit]);
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[DB] select error:', e.message);
    res.status(500).json({ ok: false, error: 'Query failed' });
  }
});

app.use(express.static('public'));

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`Server listening on http://0.0.0.0:${port}`));

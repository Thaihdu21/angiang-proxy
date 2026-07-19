const express = require('express');
const axios = require('axios');
const https = require('https');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');
const app = express();
app.use(express.json());

const BASE = 'https://tracuudiemts10.angiang.edu.vn';
const HEADERS = {
  'Referer': BASE + '/',
  'Origin': BASE,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

app.get('/captcha_and_search/:cccd', async (req, res) => {
  const { cccd } = req.params;
  const now = new Date().toLocaleTimeString('vi-VN');
  console.log(`[${now}] 📥 Request SBD: ${cccd}`);

  const jar = new CookieJar();
  const httpAgent  = new HttpCookieAgent({ cookies: { jar } });
  const httpsAgent = new HttpsCookieAgent({ cookies: { jar }, rejectUnauthorized: false });
  const client = axios.create({ httpAgent, httpsAgent });

  try {
    // Bước 1: lấy captcha — cookie session lưu vào jar
    const r1 = await client.get(`${BASE}/get_captcha.php`, { headers: HEADERS });
    const question = r1.data?.question ?? '';
    const expr = question.replace(/=\s*\?.*$/, '').replace(/[^0-9+\-*/ ]/g, '').trim();
    const answer = expr ? String(Math.round(eval(expr))) : '0';
    console.log(`[${now}]    captcha: ${question} → ${answer}`);

    // Bước 2: search với cùng session
    const r2 = await client.post(`${BASE}/search.php`,
      { cccd, captcha: answer },
      { headers: { ...HEADERS, 'Content-Type': 'application/json' } }
    );

    const phan_hoi = r2.data?.set_attributes?.phan_hoi ?? '';
    const ok = phan_hoi.includes('Điểm thi');
    console.log(`[${now}]    → ${ok ? '✓ có dữ liệu' : '✗ không có dữ liệu'}`);

    res.json({ question, answer, ...r2.data });
  } catch (e) {
    console.log(`[${now}]    ❌ lỗi: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

app.get('/ping', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.listen(3000, () => console.log('✅ Proxy running on :3000'));

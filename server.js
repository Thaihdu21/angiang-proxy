const express = require('express');
const axios = require('axios');
const https = require('https');
const app = express();
app.use(express.json());

const BASE = 'https://tracuudiemts10.angiang.edu.vn';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const HEADERS = {
  'Referer': BASE + '/',
  'Origin': BASE,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// GET /captcha → lấy + giải captcha, trả về { question, answer }
app.get('/captcha', async (req, res) => {
  try {
    const r = await axios.get(`${BASE}/get_captcha.php`, {
      httpsAgent, headers: HEADERS
    });
    const question = r.data?.question ?? '';
    // Parse "47 + 2 = ?" → lấy phần trước " = ?"
    const expr = question.replace(/=\s*\?.*$/, '').replace(/[^0-9+\-*/ ]/g, '').trim();
    const answer = expr ? String(Math.round(eval(expr))) : '0';
    res.json({ question, answer });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /search { cccd, captcha } → tra cứu điểm
app.post('/search', async (req, res) => {
  const { cccd, captcha } = req.body;
  try {
    const r = await axios.post(`${BASE}/search.php`,
      { cccd, captcha },
      { httpsAgent, headers: { ...HEADERS, 'Content-Type': 'application/json' } }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /ping → kiểm tra proxy còn sống không
app.get('/ping', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(3000, () => console.log('✅ Proxy running on :3000'));

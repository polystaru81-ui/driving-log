// api/gas-proxy.js — Vercel Serverless Function
// 支援 GET（讀取）和 POST（寫入），解決 URL 長度限制問題

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyW08nH-zz0zoxTHFPcFiA1ciYSoqzjIAjMwx9vRc2qJTOHTTiwYp3BSgIl9Jie3GIS/exec';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // POST：從 body 取參數；GET：從 query 取參數
  const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});

  // 組合 GAS GET 請求網址
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    qs.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  });
  const url = GAS_URL + '?' + qs.toString();

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });
    const text = await response.text();

    try { JSON.parse(text); } catch {
      res.status(502).json({
        success: false,
        error: 'GAS 回傳非 JSON（授權或部署問題）',
        preview: text.slice(0, 200)
      });
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

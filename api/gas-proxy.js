// api/gas-proxy.js — Vercel Serverless Function
// 伺服器端代理：瀏覽器 → Vercel → GAS（繞過 Google 驗證攔截）

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyW08nH-zz0zoxTHFPcFiA1ciYSoqzjIAjMwx9vRc2qJTOHTTiwYp3BSgIl9Jie3GIS/exec';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const params = new URLSearchParams(req.query || {});
  const url = GAS_URL + '?' + params.toString();

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });
    const text = await response.text();

    // 確認是否為有效 JSON（GAS 若回傳登入頁會是 HTML）
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

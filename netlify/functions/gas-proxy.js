// netlify/functions/gas-proxy.js
// 伺服器端代理：瀏覽器 → Netlify Function → Google Apps Script
// 解決瀏覽器直接呼叫 GAS 被 Google 攔截驗證的問題

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyW08nH-zz0zoxTHFPcFiA1ciYSoqzjIAjMwx9vRc2qJTOHTTiwYp3BSgIl9Jie3GIS/exec';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store'
};

exports.handler = async (event) => {
  // 處理 CORS 預檢請求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // 確認 fetch 可用（Netlify Node 18+ 內建，舊版需注意）
  if (typeof fetch === 'undefined') {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success:false, error:'伺服器環境不支援 fetch，請確認 Node 版本 ≥ 18' })
    };
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  params.delete('callback');
  const url = GAS_URL + '?' + params.toString();

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });

    const text = await response.text();

    // 驗證是否為有效 JSON（GAS 偶爾因授權問題回傳 HTML）
    try {
      JSON.parse(text);
    } catch (parseErr) {
      return {
        statusCode: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'GAS 回傳非 JSON 格式（可能是授權或部署問題）',
          rawPreview: text.slice(0, 200)
        })
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: text
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: '代理請求失敗：' + error.message })
    };
  }
};

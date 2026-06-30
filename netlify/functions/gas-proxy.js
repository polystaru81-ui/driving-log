//netlify/functions/gas-proxy.js
// 伺服器端代理：瀏覽器 → Netlify Function → Google Apps Script
// 解決瀏覽器直接呼叫 GAS 被 Google 攔截驗證的問題

const GAS_URL = 'https://script.google.com/macros/s/AKfycbz8MrvBn5vdHemqYvWiIyQOCYb0jkn-yCOQO8aJoMugmRoKkqooKFL3qa0-pZPzv82w/exec';

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

  // 組合 GAS 請求網址（移除 callback，改用直接 JSON）
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

    // 驗證是否為有效 JSON
    JSON.parse(text);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: text
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

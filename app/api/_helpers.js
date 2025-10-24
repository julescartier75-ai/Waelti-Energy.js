import axios from 'axios';

let smToken = null;
let smRefresh = null;

async function solarLogin() {
  const url = `${process.env.SOLARMGR_BASE}/v1/oauth/login`;
  const { data } = await axios.post(url, {
    username: process.env.SOLARMGR_USER,
    password: process.env.SOLARMGR_PASS,
  });
  smToken = data?.access_token;
  smRefresh = data?.refresh_token;
}
export async function solarGet(path) {
  if (!smToken) await solarLogin();
  try {
    const { data } = await axios.get(`${process.env.SOLARMGR_BASE}${path}`, {
      headers: { Authorization: `Bearer ${smToken}` },
    });
    return data;
  } catch (e) {
    if (e?.response?.status === 401 && smRefresh) {
      const r = await axios.post(`${process.env.SOLARMGR_BASE}/v1/oauth/refresh`, { refresh_token: smRefresh });
      smToken = r.data?.access_token;
      smRefresh = r.data?.refresh_token;
      const { data } = await axios.get(`${process.env.SOLARMGR_BASE}${path}`, {
        headers: { Authorization: `Bearer ${smToken}` },
      });
      return data;
    }
    throw e;
  }
}

let ecToken = null;
let ecExpiry = 0;
async function ecarupToken() {
  const now = Date.now();
  if (ecToken && now < ecExpiry - 60_000) return ecToken;
  const form = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.ECARUP_CLIENT_ID,
    client_secret: process.env.ECARUP_CLIENT_SECRET,
    scope: 'user.read device.read device.write',
  });
  const { data } = await axios.post(process.env.ECARUP_AUTH_URL, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  ecToken = data.access_token;
  ecExpiry = Date.now() + data.expires_in * 1000;
  return ecToken;
}
export async function ecarupGet(path) {
  const token = await ecarupToken();
  const { data } = await axios.get(`${process.env.ECARUP_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
export async function ecarupPost(path, body) {
  const token = await ecarupToken();
  const { data } = await axios.post(`${process.env.ECARUP_API}${path}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

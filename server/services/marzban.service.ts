import { ENV } from '../config';

export async function getMarzbanToken() {
  const form = new URLSearchParams();
  form.append('username', ENV.MARZBAN_USERNAME);
  form.append('password', ENV.MARZBAN_PASSWORD);
  
  const res = await fetch(`${ENV.MARZBAN_URL}/api/admin/token`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) throw new Error('Failed to get Marzban token');
  const data = await res.json();
  return data.access_token;
}

export async function createOrUpdateMarzbanUser(tg_id: number, days: number) {
  // Return a mock link if Marzban is not configured (using example.com)
  if (ENV.MARZBAN_URL.includes('example.com')) {
    return `vless://mock-uuid-for-tg-${tg_id}@vpn.mock.nox-network.com:443?type=tcp&security=tls#NOX_VPN_${tg_id}`;
  }

  try {
    const token = await getMarzbanToken();
    const username = `tg_${tg_id}`;
    const expireTimestamp = Math.floor(Date.now() / 1000) + (days * 86400);

    const getRes = await fetch(`${ENV.MARZBAN_URL}/api/user/${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let userData;
    if (getRes.ok) {
      const updateRes = await fetch(`${ENV.MARZBAN_URL}/api/user/${username}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxies: { vless: {} },
          expire: expireTimestamp,
          data_limit: 0,
          status: 'active'
        })
      });
      userData = await updateRes.json();
    } else {
      const createRes = await fetch(`${ENV.MARZBAN_URL}/api/user`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          proxies: { vless: {} },
          expire: expireTimestamp,
          data_limit: 0,
          status: 'active'
        })
      });
      userData = await createRes.json();
    }

    // Filter links by location if node names in Marzban match the location (e.g., "NL Node 1")
    // For now, we just pick the first vless link or mock the location part
    const vlessLink = userData.links?.find((l: string) => l.startsWith('vless://'));
    return vlessLink;
  } catch (error) {
    console.error('Marzban API Error:', error);
    return null;
  }
}

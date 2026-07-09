import { getStore } from '@netlify/blobs';

const PLAYERS = ['kelsey', 'jeff'];

export default async (req) => {
  const store = getStore('ten-points');

  // client fetches the public VAPID key here before subscribing
  if (req.method === 'GET') {
    return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
    const { action, by, subscription } = body || {};
    if (!PLAYERS.includes(by)) return new Response('Unknown player', { status: 400 });

    const subs = (await store.get('push-subs', { type: 'json' })) || { kelsey: [], jeff: [] };

    if (action === 'subscribe') {
      if (!subscription?.endpoint) return new Response('Bad subscription', { status: 400 });
      // one entry per device endpoint; re-subscribing replaces
      subs[by] = (subs[by] || []).filter(s => s.endpoint !== subscription.endpoint);
      subs[by].push(subscription);
      await store.setJSON('push-subs', subs);
      return Response.json({ ok: true, devices: subs[by].length });
    }

    return new Response('Unknown action', { status: 400 });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/push' };

import { getStore } from '@netlify/blobs';

const PLAYERS = ['kelsey', 'jeff'];
const MAX_AHEAD = 366 * 24 * 60 * 60 * 1000; // one year, be serious

export default async (req) => {
  const store = getStore('ten-points');

  if (req.method === 'GET') {
    let timer = (await store.get('timer', { type: 'json' })) || null;
    // lazy cleanup: an hour past zero with nobody celebrating = stale
    if (timer && timer.endTs < Date.now() - 60 * 60 * 1000) {
      await store.setJSON('timer', null);
      timer = null;
    }
    return Response.json(timer, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
    const { action, by } = body || {};
    if (!PLAYERS.includes(by)) return new Response('Unknown player', { status: 400 });

    if (action === 'start') {
      const endTs = Number(body.endTs);
      const now = Date.now();
      if (!Number.isFinite(endTs) || endTs <= now) {
        return new Response('The countdown must end in the future', { status: 400 });
      }
      if (endTs > now + MAX_AHEAD) {
        return new Response('That is too long to be apart', { status: 400 });
      }
      const existing = (await store.get('timer', { type: 'json' })) || null;
      if (existing && existing.endTs > now) {
        return new Response('A countdown is already running', { status: 409 });
      }
      const timer = { endTs, setBy: by, startTs: now };
      await store.setJSON('timer', timer);
      return Response.json(timer, { status: 201 });
    }

    if (action === 'cancel') {
      await store.setJSON('timer', null);
      return Response.json({ ok: true });
    }

    return new Response('Unknown action', { status: 400 });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/timer' };

import { getStore } from '@netlify/blobs';

const PLAYERS = ['kelsey', 'jeff'];

export default async (req) => {
  const store = getStore('ten-points');

  if (req.method === 'GET') {
    const entries = (await store.get('entries', { type: 'json' })) || [];
    return Response.json(entries, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response('Bad JSON', { status: 400 });
    }

    const { to, by, amount, reason } = body || {};

    // validation: two players, no self-dealing, sane amounts, reason required
    if (!PLAYERS.includes(to) || !PLAYERS.includes(by)) {
      return new Response('Unknown player', { status: 400 });
    }
    if (to === by) {
      return new Response('Points may only be bestowed upon the other party', { status: 400 });
    }
    const amt = Math.trunc(Number(amount));
    if (!Number.isFinite(amt) || amt === 0 || Math.abs(amt) > 999) {
      return new Response('Amount must be a whole number between -999 and 999', { status: 400 });
    }
    const why = String(reason || '').trim();
    if (!why || why.length > 200) {
      return new Response('A reason is required. Them\'s the rules.', { status: 400 });
    }

    const entry = { to, by, amount: amt, reason: why, ts: Date.now() };

    const entries = (await store.get('entries', { type: 'json' })) || [];
    entries.unshift(entry);
    await store.setJSON('entries', entries);

    return Response.json(entry, { status: 201 });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/points' };

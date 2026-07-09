import { getStore } from '@netlify/blobs';
import { sendPush } from '../lib/send-push.mjs';

const NAMES = { kelsey: 'Kelsey', jeff: 'Jeff' };

const PLAYERS = ['kelsey', 'jeff'];

export default async (req) => {
  const store = getStore('ten-points');

  if (req.method === 'GET') {
    const items = (await store.get('pips', { type: 'json' })) || [];
    return Response.json(items, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
    const { action, by } = body || {};

    if (!PLAYERS.includes(by)) return new Response('Unknown player', { status: 400 });

    const items = (await store.get('pips', { type: 'json' })) || [];

    if (action === 'add') {
      const { subject, text } = body;
      if (!PLAYERS.includes(subject)) return new Response('Unknown subject', { status: 400 });
      if (subject === by) return new Response('You cannot manage your own PIP', { status: 403 });
      const t = String(text || '').trim();
      if (!t || t.length > 200) return new Response('A development area is required (max 200 chars)', { status: 400 });
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        subject, by, text: t, ts: Date.now(), improvedTs: null
      };
      items.unshift(item);
      await store.setJSON('pips', items);
      try {
        await sendPush(subject, {
          title: 'PIPs \u{1F4CB}',
          body: `${NAMES[by]} added to your Performance Improvement Plan: ${t}`,
          url: '/pips/'
        });
      } catch {}
      return Response.json(item, { status: 201 });
    }

    if (action === 'improve') {
      const item = items.find(i => i.id === body.id);
      if (!item) return new Response('Not found', { status: 404 });
      if (item.subject === by) return new Response('Only your manager can certify growth', { status: 403 });
      if (item.improvedTs) return new Response('Already improved', { status: 409 });
      item.improvedTs = Date.now();
      await store.setJSON('pips', items);
      try {
        await sendPush(item.subject, {
          title: 'PIPs \u{1F4CB}',
          body: `${NAMES[by]} certified your growth \u2713 ${item.text}`,
          url: '/pips/'
        });
      } catch {}
      return Response.json(item);
    }

    return new Response('Unknown action', { status: 400 });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/pips' };

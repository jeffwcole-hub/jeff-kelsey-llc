import { getStore } from '@netlify/blobs';
import { sendPush } from '../lib/send-push.mjs';

const NAMES = { kelsey: 'Kelsey', jeff: 'Jeff' };
const other = id => id === 'kelsey' ? 'jeff' : 'kelsey';

const PLAYERS = ['kelsey', 'jeff'];

export default async (req) => {
  const store = getStore('ten-points');

  if (req.method === 'GET') {
    const items = (await store.get('gripes', { type: 'json' })) || [];
    return Response.json(items, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
    const { action, by } = body || {};

    if (!PLAYERS.includes(by)) return new Response('Unknown player', { status: 400 });

    const items = (await store.get('gripes', { type: 'json' })) || [];

    if (action === 'add') {
      const t = String(body.text || '').trim();
      if (!t || t.length > 200) return new Response('A grievance is required (max 200 chars)', { status: 400 });
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        by, text: t, ts: Date.now(), resolvedTs: null
      };
      items.unshift(item);
      await store.setJSON('gripes', items);
      try {
        await sendPush(other(by), {
          title: '\u{1F4A9} List',
          body: `${NAMES[by]} logged a grievance: ${t}`,
          url: '/list/'
        });
      } catch {}
      return Response.json(item, { status: 201 });
    }

    if (action === 'resolve') {
      const item = items.find(i => i.id === body.id);
      if (!item) return new Response('Not found', { status: 404 });
      if (item.by !== by) return new Response('Only the aggrieved party may settle a grievance', { status: 403 });
      if (item.resolvedTs) return new Response('Already settled', { status: 409 });
      item.resolvedTs = Date.now();
      await store.setJSON('gripes', items);
      try {
        await sendPush(other(by), {
          title: '\u{1F4A9} List',
          body: `${NAMES[by]} settled a grievance \u2713 ${item.text}`,
          url: '/list/'
        });
      } catch {}
      return Response.json(item);
    }

    return new Response('Unknown action', { status: 400 });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/gripes' };

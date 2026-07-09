import webpush from 'web-push';
import { getStore } from '@netlify/blobs';

/**
 * Send a push notification to every registered device for `to`.
 * Silently no-ops if VAPID keys aren't configured. Prunes dead
 * subscriptions (expired/uninstalled) as it goes.
 */
export async function sendPush(to, payload) {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@kelseyandjeff.llc',
    pub, priv
  );

  const store = getStore('ten-points');
  const subs = (await store.get('push-subs', { type: 'json' })) || {};
  const list = subs[to] || [];
  if (!list.length) return;

  const dead = [];
  await Promise.all(list.map(async s => {
    try {
      await webpush.sendNotification(s, JSON.stringify(payload));
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(s.endpoint);
    }
  }));

  if (dead.length) {
    subs[to] = list.filter(s => !dead.includes(s.endpoint));
    await store.setJSON('push-subs', subs);
  }
}

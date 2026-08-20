import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { getPushSubscriptions } from '../../services/supabaseService.js';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BFpvQ56vvUjnZVB-BsjsLtJyObMMGnuR672bTBIDQl9laRUDtx8-2IfrKONOoq1PUtqxkh-x-i4bV8Va8B5ua-o';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'advlt-nPUC15acNjt5CkepA7gRH5feo5xBwf_dl8Rcg';

webpush.setVapidDetails('mailto:contato@baccarim.com.br', publicVapidKey, privateVapidKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { userId, title, message } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const subsMap = await getPushSubscriptions();
    const userSubs: any[] = subsMap[userId] || [];
    if (userSubs.length === 0) {
      return res.status(404).json({ error: 'Nenhum aparelho registrado. Clique em Habilitar pelo celular primeiro!' });
    }
    const payload = JSON.stringify({ title: title || 'Teste Baccarim Systems', body: message || 'Notificacao de teste do servidor!' });
    let successCount = 0;
    for (const sub of userSubs) {
      try { await webpush.sendNotification(sub, payload); successCount++; } catch(e) { console.error('push failed', e); }
    }
    res.status(200).json({ success: true, count: successCount, total: userSubs.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
}

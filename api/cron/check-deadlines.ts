import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { loadStateFromSupabase } from '../../services/supabaseService.js';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BFpvQ56vvUjnZVB-BsjsLtJyObMMGnuR672bTBIDQl9laRUDtx8-2IfrKONOoq1PUtqxkh-x-i4bV8Va8B5ua-o';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'advlt-nPUC15acNjt5CkepA7gRH5feo5xBwf_dl8Rcg';

webpush.setVapidDetails('mailto:contato@baccarim.com.br', publicVapidKey, privateVapidKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const state = await loadStateFromSupabase();
    
    // Configurações e datas
    const now = new Date();
    const alertThresholdDays = 30;
    const thresholdDate = new Date(now.getTime() + alertThresholdDays * 24 * 60 * 60 * 1000);
    
    let totalSent = 0;
    
    // Verifica Licenças
    if (state.licenses) {
      const expiringLicenses = state.licenses.filter((l: any) => {
        if (!l.validade || l.status !== 'Ativo') return false;
        const vDate = new Date(l.validade);
        return vDate > now && vDate <= thresholdDate;
      });
      
      if (expiringLicenses.length > 0) {
        const payload = JSON.stringify({
          title: "🚨 Licenças Vencendo!",
          body: expiringLicenses.length + " licenca(s) vencendo nos proximos " + alertThresholdDays + " dias."
        });
        
        // Envia para admins
        const admins = state.users.filter((u: any) => u.role === 'admin' && u.pushSubscriptions && u.pushSubscriptions.length > 0);
        for (const admin of admins) {
          for (const sub of admin.pushSubscriptions) {
            try {
              await webpush.sendNotification(sub, payload);
              totalSent++;
            } catch(e) {}
          }
        }
      }
    }
    
    res.json({ success: true, totalSent, message: "Cron processado com sucesso" });
  } catch (error: any) {
    console.error("Cron error:", error);
    res.status(500).json({ error: "Cron execution failed" });
  }
}

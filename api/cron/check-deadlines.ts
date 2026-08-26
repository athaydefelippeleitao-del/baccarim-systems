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
        if (!l.expiryDate || l.status !== 'Ativa') return false;
        
        let vDate: Date;
        if (l.expiryDate.includes('/')) {
          const parts = l.expiryDate.split('/');
          vDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else {
          vDate = new Date(l.expiryDate);
        }

        return vDate > now && vDate <= thresholdDate;
      });
      
      if (expiringLicenses.length > 0) {
        const payload = JSON.stringify({
          title: "🚨 Licenças Vencendo!",
          body: expiringLicenses.length + " licença(s) vencendo nos próximos " + alertThresholdDays + " dias.",
          url: 'https://baccarim-systems-blond.vercel.app/'
        });
        
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

    // Verifica Notificações
    if (state.notifications) {
      const expiringNotifications = state.notifications.filter((n: any) => {
        if (!n.deadline || n.status !== 'Open') return false;

        let dDate: Date;
        if (n.deadline.includes('/')) {
          const parts = n.deadline.split('/');
          dDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else {
          dDate = new Date(n.deadline);
        }

        return dDate > now && dDate <= thresholdDate;
      });

      if (expiringNotifications.length > 0) {
        const payload = JSON.stringify({
          title: "🚨 Notificações Pendentes!",
          body: expiringNotifications.length + " notificação(ões) com prazo fatal nos próximos " + alertThresholdDays + " dias.",
          url: 'https://baccarim-systems-blond.vercel.app/'
        });
        
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

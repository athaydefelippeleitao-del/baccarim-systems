import 'dotenv/config';
import express from "express";
import cors from "cors";
import webpush from "web-push";

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BFpvQ56vvUjnZVB-BsjsLtJyObMMGnuR672bTBIDQl9laRUDtx8-2IfrKONOoq1PUtqxkh-x-i4bV8Va8B5ua-o';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'advlt-nPUC15acNjt5CkepA7gRH5feo5xBwf_dl8Rcg';

webpush.setVapidDetails(
  'mailto:contato@baccarim.com.br',
  publicVapidKey,
  privateVapidKey
);

// Import OpenAI service (server-side only)
import {
  analyzeLicensePortfolio,
  analyzeVistoriaImage,
  generateNotificationDraft,
  suggestExcelMapping,
  generateAIDocument,
} from "../services/openaiService.js";

import {
  saveKeyToSupabase,
  loadStateFromSupabase,
  savePushSubscriptions
} from "../services/supabaseService.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: '800mb' }));

app.get("/api/vapidPublicKey", (req, res) => {
  res.send(publicVapidKey);
});

app.post("/api/openai/analyze-portfolio", async (req, res) => {
  try {
    const { licenses, notifications } = req.body;
    const result = await analyzeLicensePortfolio(licenses || [], notifications || []);
    res.json({ result });
  } catch (e: any) {
    console.error("OpenAI analyze-portfolio error:", e);
    res.status(200).json({ error: e.message || "Erro ao analisar portfólio" });
  }
});

app.post("/api/openai/analyze-image", async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ error: "base64Image required" });
    const result = await analyzeVistoriaImage(base64Image);
    res.json({ result });
  } catch (e: any) {
    console.error("OpenAI analyze-image error:", e);
    res.status(200).json({ error: e.message || "Erro ao analisar imagem" });
  }
});

app.post("/api/openai/notification-draft", async (req, res) => {
  try {
    const { agency, description, clientName } = req.body;
    const result = await generateNotificationDraft(agency, description, clientName);
    res.json({ result });
  } catch (e: any) {
    console.error("OpenAI notification-draft error:", e);
    res.status(200).json({ error: e.message || "Erro ao gerar rascunho" });
  }
});

app.post("/api/openai/suggest-mapping", async (req, res) => {
  try {
    const { headers } = req.body;
    const result = await suggestExcelMapping(headers || []);
    res.json({ result });
  } catch (e: any) {
    console.error("OpenAI suggest-mapping error:", e);
    res.status(200).json({ error: e.message || "Erro ao sugerir mapeamento" });
  }
});

app.post("/api/openai/generate-document", async (req, res) => {
  try {
    const { documentType, projectContext, extraContext } = req.body;
    const result = await generateAIDocument(documentType, projectContext, extraContext);
    res.json({ result });
  } catch (e: any) {
    console.error("OpenAI generate-document error:", e);
    res.status(200).json({ error: e.message || "Erro ao gerar documento" });
  }
});

// Push Subscription endpoint
app.post("/api/push/subscribe", async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    // We fetch the current state dynamically since it's serverless
    const state = await loadStateFromSupabase();
    const user = state.users.find((u: any) => u.id === userId);
    
    if (user) {
      if (!user.pushSubscriptions) user.pushSubscriptions = [];
      const exists = user.pushSubscriptions.find((s: any) => s.endpoint === subscription.endpoint);
      if (!exists) {
        user.pushSubscriptions.push(subscription);
        
        const subsMap: Record<string, any[]> = {};
        state.users.forEach((u: any) => {
          if (u.pushSubscriptions && u.pushSubscriptions.length > 0) {
            subsMap[u.id] = u.pushSubscriptions;
          }
        });

        await saveKeyToSupabase('users', state.users);
        await savePushSubscriptions(subsMap);
      }
    }
    res.status(201).json({});
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

app.get("/api/server-stats", async (req, res) => {
  try {
    const state = await loadStateFromSupabase();
    const stats = {
      projects: state.projects?.length || 0,
      licenses: state.licenses?.length || 0,
      notifications: state.notifications?.length || 0,
      reports: state.reports?.length || 0,
      dbSize: 0, // Serverless no local DB
      uptime: process.uptime(),
      lastUpdate: new Date().toISOString()
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.post("/api/push/test", async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    const state = await loadStateFromSupabase();
    const user = state.users.find((u: any) => u.id === userId);
    
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(404).json({ error: "Nenhum aparelho registrado para este usuário. Abra o app no celular e clique em Habilitar." });
    }
    
    let successCount = 0;
    const payload = JSON.stringify({ title: title || "Teste do Sistema", body: message || "Sua notificação de teste chegou!" });
    
    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err) {
        console.error("Erro ao enviar push para endpoint:", sub.endpoint);
        // Opcional: remover subscriptions inválidas (HTTP 410)
      }
    }
    
    res.json({ success: true, count: successCount, message: `Push enviado para ${successCount} aparelho(s)!` });
  } catch (error: any) {
    console.error("Push test error:", error);
    res.status(500).json({ error: error.message || "Erro ao disparar push" });
  }
});

app.get("/api/cron/check-deadlines", async (req, res) => {
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
          body: `${expiringLicenses.length} licença(s) vencendo nos próximos ${alertThresholdDays} dias.`
        });
        
        // Envia para admins
        const admins = state.users.filter((u: any) => u.role === 'admin' && u.pushSubscriptions?.length > 0);
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
});

app.post("/api/restore", async (req, res) => {
  console.log("Restore request received in serverless mode.");
  try {
    const newState = req.body;
    if (!newState || typeof newState !== 'object') {
      return res.status(400).json({ error: "Invalid backup file" });
    }

    const state = await loadStateFromSupabase();
    
    const preservedAppConfig = (newState.appConfig && typeof newState.appConfig === 'object' && Object.keys(newState.appConfig).length > 0) 
      ? newState.appConfig : (state.appConfig || {});
    
    const preservedClientLogos = (newState.clientLogos && typeof newState.clientLogos === 'object' && Object.keys(newState.clientLogos).length > 0) 
      ? newState.clientLogos : (state.clientLogos || {});

    // Save sequentially to avoid limits
    await saveKeyToSupabase('users', newState.users || []);
    await saveKeyToSupabase('clients', newState.clients || []);
    await saveKeyToSupabase('checklistTemplates', newState.checklistTemplates || state.checklistTemplates);
    await saveKeyToSupabase('projects', newState.projects || []);
    await saveKeyToSupabase('licenses', newState.licenses || []);
    await saveKeyToSupabase('notifications', newState.notifications || []);
    await saveKeyToSupabase('contracts', newState.contracts || []);
    await saveKeyToSupabase('meetings', newState.meetings || []);
    await saveKeyToSupabase('videos', newState.videos || []);
    await saveKeyToSupabase('reports', newState.reports || []);
    await saveKeyToSupabase('appConfig', preservedAppConfig);
    await saveKeyToSupabase('clientLogos', preservedClientLogos);

    res.json({ success: true, message: "Backup restaurado com sucesso no Supabase!" });
  } catch (e: any) {
    console.error("Error restoring backup:", e);
    res.status(500).json({ error: e.message || "Internal server error" });
  }
});

app.get("/api/state", async (req, res) => {
  try {
    const state = await loadStateFromSupabase();
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch state" });
  }
});

export default app;

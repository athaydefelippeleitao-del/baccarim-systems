import 'dotenv/config';
import express from "express";
console.log("Server.ts is starting...");
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import cors from "cors";
import webpush from "web-push";

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BFpvQ56vvUjnZVB-BsjsLtJyObMMGnuR672bTBIDQl9laRUDtx8-2IfrKONOoq1PUtqxkh-x-i4bV8Va8B5ua-o';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'advlt-nPUC15acNjt5CkepA7gRH5feo5xBwf_dl8Rcg';

webpush.setVapidDetails(
  'mailto:contato@baccarim.com.br',
  publicVapidKey,
  privateVapidKey
);

// Import mock data for initial state (first-time seed)
import { MOCK_PROJECTS, MOCK_LICENSES, MOCK_NOTIFICATIONS, MOCK_CONTRACTS, CLIENTS, getChecklistTemplate } from "./constants";
import { LicenseType } from "./types";

// Import Supabase service
import {
  loadStateFromSupabase,
  saveKeyToSupabase,
  insertAuditEntry,
  upsertUsers,
  upsertClients,
  upsertProjects,
  upsertLicenses,
  upsertNotifications,
  upsertContracts,
  deleteKeyFromSupabase,
} from "./services/supabaseService";

// Import OpenAI service (server-side only)
import {
  analyzeLicensePortfolio,
  analyzeVistoriaImage,
  generateNotificationDraft,
  suggestExcelMapping,
} from "./services/openaiService";

const DB_FILE = path.resolve(process.cwd(), "db.json");

function getDefaultState() {
  return {
    projects: MOCK_PROJECTS,
    licenses: MOCK_LICENSES,
    notifications: MOCK_NOTIFICATIONS,
    contracts: MOCK_CONTRACTS,
    clients: CLIENTS,
    meetings: [],
    videos: [],
    reports: [],
    auditLog: [],
    checklistTemplates: {
      [`SEMA-${LicenseType.LP}`]: getChecklistTemplate(LicenseType.LP, 'SEMA'),
      [`SEMA-${LicenseType.LI}`]: getChecklistTemplate(LicenseType.LI, 'SEMA'),
      [`SEMA-${LicenseType.LAS}`]: getChecklistTemplate(LicenseType.LAS, 'SEMA'),
      [`SEMA-${LicenseType.LO}`]: getChecklistTemplate(LicenseType.LO, 'SEMA'),
      [`IAT-${LicenseType.LP}`]: getChecklistTemplate(LicenseType.LP, 'IAT'),
      [`IAT-${LicenseType.LI}`]: getChecklistTemplate(LicenseType.LI, 'IAT'),
      [`IAT-${LicenseType.LAS}`]: getChecklistTemplate(LicenseType.LAS, 'IAT'),
      [`IAT-${LicenseType.LO}`]: getChecklistTemplate(LicenseType.LO, 'IAT'),
    },
    users: [
      { id: '1', name: 'Admin Baccarim', email: 'admin@baccarim.com.br', role: 'admin', password: 'admin123', createdAt: 'Jan 2026' },
      { id: '2', name: 'A.yoshii', email: 'ayos@baccarim.com.br', role: 'client', clientNames: ['A.yoshii'], password: 'ayos123', createdAt: 'Jan 2026' }
    ],
    appConfig: {}
  };
}

async function loadState() {
  console.log("[Supabase] Loading state from Supabase...");
  try {
    const dbState = await loadStateFromSupabase();

    // If the database is empty (first run), seed with mock data
    if (dbState.projects.length === 0 && dbState.users.length === 0) {
      console.log("[Supabase] Database is empty. Seeding with default data...");
      const defaultState = getDefaultState();

      // Seed all collections in parallel
      await Promise.all([
        upsertUsers(defaultState.users),
        upsertClients(defaultState.clients),
        upsertProjects(defaultState.projects),
        upsertLicenses(defaultState.licenses),
        upsertNotifications(defaultState.notifications),
        upsertContracts(defaultState.contracts),
      ]);

      console.log("[Supabase] Default data seeded successfully.");
      return defaultState;
    }

    // Merge DB state with default checklist templates if templates are empty
    if (Object.keys(dbState.checklistTemplates).length === 0) {
      const defaultState = getDefaultState();
      dbState.checklistTemplates = defaultState.checklistTemplates;
    }

    console.log("[Supabase] State loaded successfully.");
    if (!dbState.appConfig) dbState.appConfig = {};
    return dbState;
  } catch (e) {
    console.error("[Supabase] Error loading state, falling back to default state:", e);
    // Fallback: try to load from db.json if it exists
    if (fs.existsSync(DB_FILE)) {
      try {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        console.log("[Fallback] Loaded state from db.json");
        return JSON.parse(data);
      } catch (e2) {
        console.error("[Fallback] Error loading db.json:", e2);
      }
    }
    return getDefaultState();
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 5e8 // 500MB for very large base64 files and reports
  });

  const PORT = parseInt(process.env.PORT || '3000', 10);
  let state: any = await loadState();

  app.use(cors());
  app.use(express.json({ limit: '800mb' }));

  // API to get initial state
  app.get("/api/state", (req, res) => {
    res.json(state);
  });

  app.get("/api/server-stats", (req, res) => {
    const stats = {
      projects: state.projects?.length || 0,
      licenses: state.licenses?.length || 0,
      notifications: state.notifications?.length || 0,
      reports: state.reports?.length || 0,
      dbSize: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0,
      uptime: process.uptime(),
      lastUpdate: new Date()
    };
    res.json(stats);
  });

  app.get("/api/app-icon.png", (req, res) => {
    const icon = state.appConfig?.appIcon;
    if (icon && icon.startsWith('data:image')) {
      try {
        const parts = icon.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const base64Data = parts[1];
        const img = Buffer.from(base64Data, 'base64');
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': img.length,
          'Cache-Control': 'no-cache'
        });
        res.end(img);
        return;
      } catch (e) {
        console.error("Error serving app icon:", e);
      }
    }
    // Fallback to default icon
    res.redirect('https://cdn-icons-png.flaticon.com/512/2991/2991163.png');
  });

  app.get("/manifest.json", (req, res) => {
    res.json({
      "short_name": "Baccarim",
      "name": "Baccarim Systems - Baccarim Engenharia",
      "description": "Controle de licenças e notificações ambientais.",
      "icons": [
        {
          "src": "/api/app-icon.png",
          "type": "image/png",
          "sizes": "192x192",
          "purpose": "any maskable"
        },
        {
          "src": "/api/app-icon.png",
          "type": "image/png",
          "sizes": "512x512",
          "purpose": "any maskable"
        }
      ],
      "start_url": "/",
      "id": "baccarim-systems-v1",
      "display": "standalone",
      "theme_color": "#0f172a",
      "background_color": "#f8fafc",
      "scope": "/"
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // AI ROUTES (OpenAI)
  // ──────────────────────────────────────────────────────────────────────

  app.post("/api/openai/analyze-portfolio", async (req, res) => {
    try {
      const { licenses, notifications } = req.body;
      const result = await analyzeLicensePortfolio(licenses || [], notifications || []);
      res.json({ result });
    } catch (e: any) {
      console.error("OpenAI analyze-portfolio error:", e);
      res.status(500).json({ error: e.message || "Erro ao analisar portfólio" });
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
      res.status(500).json({ error: e.message || "Erro ao analisar imagem" });
    }
  });

  app.post("/api/openai/notification-draft", async (req, res) => {
    try {
      const { agency, description, clientName } = req.body;
      const result = await generateNotificationDraft(agency, description, clientName);
      res.json({ result });
    } catch (e: any) {
      console.error("OpenAI notification-draft error:", e);
      res.status(500).json({ error: e.message || "Erro ao gerar rascunho" });
    }
  });

  app.post("/api/openai/suggest-mapping", async (req, res) => {
    try {
      const { headers } = req.body;
      const result = await suggestExcelMapping(headers || []);
      res.json({ result });
    } catch (e: any) {
      console.error("OpenAI suggest-mapping error:", e);
      res.status(500).json({ error: e.message || "Erro ao sugerir mapeamento" });
    }
  });

  app.post("/api/restore", async (req, res) => {
    console.log("Restore request received. Body size approx:", JSON.stringify(req.body).length);
    try {
      const newState = req.body;
      if (!newState || typeof newState !== 'object') {
        console.error("Restore failed: Invalid body type", typeof newState);
        return res.status(400).json({ error: "Invalid backup file" });
      }

      console.log("Restoring state. Keys in backup:", Object.keys(newState));

      // Fully replace state with backup content to ensure it matches exactly
      state = {
        ...newState,
        projects: newState.projects || [],
        licenses: newState.licenses || [],
        notifications: newState.notifications || [],
        reports: newState.reports || [],
        users: newState.users || [],
        clients: newState.clients || [],
        checklistTemplates: newState.checklistTemplates || state.checklistTemplates,
        auditLog: newState.auditLog || []
      };

      // Broadcast to all clients to force update
      io.emit("state:init", state);
      console.log("Broadcasted state:init to all clients.");

      res.json({ success: true, message: "Backup restaurado localmente! Sincronizando com a nuvem em segundo plano." });

      // Persist to Supabase Sequentially in background to avoid overwhelming DB connection and locking requests
      (async () => {
        try {
          await saveKeyToSupabase('users', state.users);
          await saveKeyToSupabase('clients', state.clients);
          await saveKeyToSupabase('checklistTemplates', state.checklistTemplates);
          await saveKeyToSupabase('projects', state.projects);
          await saveKeyToSupabase('licenses', state.licenses);
          await saveKeyToSupabase('notifications', state.notifications);
          await saveKeyToSupabase('contracts', state.contracts);
          await saveKeyToSupabase('meetings', state.meetings);
          await saveKeyToSupabase('videos', state.videos);
          await saveKeyToSupabase('reports', state.reports);
          console.log("State restored to Supabase in background.");
        } catch (e) {
          console.error("Error during background restore sync:", e);
        }
      })();
    } catch (e) {
      console.error("Error restoring backup:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // PUSH NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────
  app.get("/api/vapidPublicKey", (req, res) => {
    res.send(publicVapidKey);
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { userId, subscription } = req.body;
      const user = state.users.find((u: any) => u.id === userId);
      if (user) {
        if (!user.pushSubscriptions) user.pushSubscriptions = [];
        // Avoid duplicate subscriptions
        const exists = user.pushSubscriptions.find((s: any) => s.endpoint === subscription.endpoint);
        if (!exists) {
          user.pushSubscriptions.push(subscription);
          // Broadcast and save
          io.emit("state:changed", { key: 'users', value: state.users });
          await saveKeyToSupabase('users', state.users);
        }
      }
      res.status(201).json({});
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Helper to send push notifications to relevant users
  function sendPushToRelevantUsers(notif: any, titleOverride?: string) {
    const usersToNotify = state.users.filter((u: any) => 
      u.role === 'admin' || u.role === 'engineer' || (u.clientNames && u.clientNames.includes(notif.clientName))
    );

    const payload = JSON.stringify({
      title: titleOverride || 'Aviso de Notificação',
      body: `"${notif.title}" (${notif.clientName}) - Prazo: ${notif.deadline}`,
      url: '/notifications'
    });

    usersToNotify.forEach((user: any) => {
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        user.pushSubscriptions.forEach((sub: any) => {
          webpush.sendNotification(sub, payload).catch(err => {
            console.error('Error sending push notification to user', user.name, err);
          });
        });
      }
    });
  }

  // Daily Check for Deadlines exactly 1 week away
  setInterval(() => {
    try {
      if (!state.notifications || state.notifications.length === 0) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + 7);
      
      const targetDateStr = targetDate.toLocaleDateString('pt-BR'); // "dd/mm/yyyy"

      state.notifications.forEach((notif: any) => {
        if (notif.status === 'Open' && notif.deadline === targetDateStr) {
          sendPushToRelevantUsers(notif, 'Prazo Fatal em 1 Semana!');
        }
      });
    } catch (e) {
      console.error("Error running push notification job:", e);
    }
  }, 1000 * 60 * 60); // Run every hour

  const saveTimeouts: Record<string, NodeJS.Timeout> = {};
  const presence: Record<string, any> = {};

  // Socket.io for real-time updates
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send current state to new client
    socket.emit("state:init", state);
    socket.emit("presence:update", Object.values(presence));

    socket.on("presence:join", (user: any) => {
      if (!user || !user.id) return;
      presence[socket.id] = { ...user, socketId: socket.id, lastSeen: new Date().toISOString() };
      io.emit("presence:update", Object.values(presence));
      console.log(`User joined: ${user.name} (${socket.id})`);
    });

    socket.on("presence:leave", () => {
      console.log("User left presence explicitly:", socket.id);
      if (presence[socket.id]) {
        delete presence[socket.id];
        io.emit("presence:update", Object.values(presence));
      }
    });

    socket.on("state:update", (update: { key: string, value: any, user?: any }) => {
      if (!update.key || update.value === undefined) return;

      if (update.key === 'appConfig') {
        console.log('[Socket] appConfig update received', { hasIcon: !!update.value?.appIcon });
      } else {
        console.log("State update received for key:", update.key);
      }
      if (update.key === 'notifications' && Array.isArray(update.value)) {
        const oldNotifs = state.notifications || [];
        const newNotifs = update.value;
        if (newNotifs.length > oldNotifs.length) {
          // Identify newly added notification(s)
          const addedNotifs = newNotifs.filter((n: any) => !oldNotifs.some((old: any) => old.id === n.id));
          addedNotifs.forEach((notif: any) => {
            console.log(`[Push] New notification detected: ${notif.title}. Triggering immediate push.`);
            sendPushToRelevantUsers(notif, 'Nova Notificação Registrada');
          });
        }
      }

      // ─── SYNC PROTECTION ───
      // Prevent a client from wiping out a collection if the server has data.
      // Legitimate deletions should use 'state:delete'.
      if (Array.isArray(update.value) && update.value.length === 0 && Array.isArray(state[update.key]) && state[update.key].length > 0) {
        console.warn(`[Protection] Ignored state:update for "${update.key}" because it would wipe out ${state[update.key].length} items. Possible sync-wipe race condition.`);
        return;
      }

      state[update.key] = update.value;

      // Record audit log if user info is provided
      if (update.user) {
        const auditEntry = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: update.user.id,
          userName: update.user.name,
          action: 'UPDATE',
          details: `Alterou ${update.key}`,
          timestamp: new Date().toISOString()
        };
        state.auditLog = [auditEntry, ...(state.auditLog || [])].slice(0, 100);
        io.emit("state:changed", { key: 'auditLog', value: state.auditLog });

        // Persist audit entry to Supabase immediately (no debounce)
        insertAuditEntry(auditEntry).catch(e => console.error("Failed to save audit entry:", e));
      }

      // Supabase writes (immediate for appConfig, debounced for others)
      if (update.key === 'appConfig') {
        saveKeyToSupabase(update.key, update.value)
          .then(() => console.log(`[Supabase] Saved appConfig immediately`))
          .catch(e => console.error(`[Supabase] Failed to save appConfig immediately:`, e));
      } else {
        if (saveTimeouts[update.key]) clearTimeout(saveTimeouts[update.key]);
        saveTimeouts[update.key] = setTimeout(async () => {
          try {
            await saveKeyToSupabase(update.key, update.value);
            console.log(`[Supabase] Saved key "${update.key}"`);
          } catch (e) {
            console.error(`[Supabase] Failed to save key "${update.key}":`, e);
          }
        }, 2000);
      }

      // Broadcast update to all other clients (Skip tables handled by Supabase Realtime)
      const realtimeTables = ['projects', 'licenses', 'notifications'];
      if (!realtimeTables.includes(update.key)) {
        socket.broadcast.emit("state:changed", update);
      }

    });

    socket.on("state:delete", async (data: { key: string, id: string, user?: any }) => {
      if (!data.key || !data.id) return;
      console.log(`[Socket] Deleting ${data.key}:${data.id}`);

      // Update local server state
      if (Array.isArray(state[data.key])) {
        state[data.key] = state[data.key].filter((item: any) => item.id !== data.id);
      }

      // Persist to Supabase
      try {
        await deleteKeyFromSupabase(data.key, data.id);
        console.log(`[Supabase] Deleted ${data.key}:${data.id}`);
      } catch (e) {
        console.error(`[Supabase] Failed to delete ${data.key}:${data.id}:`, e);
      }

      // Record audit log if user info is provided
      if (data.user) {
        const auditEntry = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: data.user.id,
          userName: data.user.name,
          action: 'DELETE',
          details: `Excluiu ${data.key}: ${data.id}`,
          timestamp: new Date().toISOString()
        };
        state.auditLog = [auditEntry, ...(state.auditLog || [])].slice(0, 100);
        io.emit("state:changed", { key: 'auditLog', value: state.auditLog });
        insertAuditEntry(auditEntry).catch(e => console.error("Failed to save audit entry:", e));
      }

      // Broadcast the deletion to all other clients (Skip tables handled by Supabase Realtime)
      const realtimeTables = ['projects', 'licenses', 'notifications'];
      if (!realtimeTables.includes(data.key)) {
        socket.broadcast.emit("state:deleted", { key: data.key, id: data.id });
      }

    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (presence[socket.id]) {
        delete presence[socket.id];
        io.emit("presence:update", Object.values(presence));
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      console.log("Starting Vite in middleware mode...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware integrated.");
    } catch (e) {
      console.error("Failed to start Vite server:", e);
    }
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    console.log(`[Server] Static assets directory: ${distPath}`);
    if (!fs.existsSync(distPath)) {
      console.error(`[Server] ERROR: dist directory does not exist! Build might have failed.`);
    } else {
      const indexPath = path.resolve(distPath, "index.html");
      console.log(`[Server] index.html exists: ${fs.existsSync(indexPath)}`);
      const assetsPath = path.resolve(distPath, "assets");
      if (fs.existsSync(assetsPath)) {
        const assetFiles = fs.readdirSync(assetsPath);
        console.log(`[Server] Assets in dist/assets (${assetFiles.length} files):`, assetFiles.join(', '));
      } else {
        console.error(`[Server] ERROR: dist/assets directory does not exist!`);
      }
    }

    // Serve static files but do NOT cache index.html so browsers always get the latest build
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MOCK_LICENSES, MOCK_NOTIFICATIONS, MOCK_PROJECTS, MOCK_MEETINGS, MOCK_VIDEOS, MOCK_CONTRACTS, CLIENTS, getChecklistTemplate, PROJECT_CATEGORIES } from './constants';
import { EnvironmentalLicense, LicenseStatus, Notification, User, Project, Contract, Meeting, ProductionVideo, LicenseType, ChecklistItem, PhotoReport, AppConfig } from './types';
import { AppLogo } from './components/AppLogo';
import StatCard from './components/StatCard';
import SmartAnalysis from './components/SmartAnalysis';
import AgendaView from './components/AgendaView';
import ClientsView from './components/ClientsView';
import FinanceView from './components/FinanceView';
import LoginView from './components/LoginView';
import ProfileView from './components/ProfileView';
import AppSettingsView from './components/AppSettingsView';
import NotificationsView from './components/NotificationsView';
import UsersView from './components/UsersView';
import MapView from './components/MapView';
import PhotoReportView from './components/PhotoReportView';
import ServerManagementView from './components/ServerManagementView';
import LoadingScreen from './components/LoadingScreen';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ProjectStatusSummary from './components/ProjectStatusSummary';
import { supabase, mapProjectFromDb, mapLicenseFromDb, mapNotificationFromDb } from './services/supabaseService';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('baccarim_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [loginError, setLoginError] = useState<string | undefined>();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [storageError, setStorageError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('map');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('baccarim_theme') as 'light' | 'dark') || 'dark';
    } catch (e) { return 'dark'; }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Refs to track last known server state to prevent sync loops
  const lastServerState = useRef<Record<string, string>>({});

  // State
  const [users, setUsers] = useState<(User & { password?: string })[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [licenses, setLicenses] = useState<EnvironmentalLicense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [reports, setReports] = useState<PhotoReport[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<Record<string, ChecklistItem[]>>({});
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [videos, setVideos] = useState<ProductionVideo[]>([]);
  const [projectCategories, setProjectCategories] = useState<string[]>([]);
  const [presence, setPresence] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({});
  const [clientLogos, setClientLogos] = useState<Record<string, string>>({});

  // Track which collections have been successfully loaded from the server
  // to prevent syncing an empty local state back to the server.
  const loadedKeysRef = useRef<Set<string>>(new Set());
  const isInitialLoadDone = useRef(false);
  const syncTimeoutRef = useRef<Record<string, any>>({});
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  // Theme effect
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('baccarim_theme', theme);
  }, [theme]);

  // Socket connection and initial sync
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('presence:update', (data: any) => setPresence(data));

    newSocket.on('state:init', (state: any) => {
      console.log("Initial state received from server");
      if (!state || typeof state !== 'object') {
        console.error("Invalid state received from server, skipping init.");
        isInitialLoadDone.current = true;
        return;
      }
      // Clear all pending syncs to prevent overwriting the new state with old local data
      Object.values(syncTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
      syncTimeoutRef.current = {};

      Object.keys(state).forEach(key => {
        lastServerState.current[key] = JSON.stringify(state[key]);
        loadedKeysRef.current.add(key);
      });

      if (Array.isArray(state.users) && state.users.length > 0) setUsers(state.users);
      if (Array.isArray(state.clients) && state.clients.length > 0) setClients(state.clients);
      if (Array.isArray(state.projects) && state.projects.length > 0) setProjects(state.projects);
      if (Array.isArray(state.licenses) && state.licenses.length > 0) setLicenses(state.licenses);
      if (Array.isArray(state.notifications) && state.notifications.length > 0) setNotifications(state.notifications);
      if (Array.isArray(state.contracts) && state.contracts.length > 0) setContracts(state.contracts);
      if (Array.isArray(state.reports) && state.reports.length > 0) setReports(state.reports);
      if (state.checklistTemplates && typeof state.checklistTemplates === 'object') setChecklistTemplates(state.checklistTemplates);
      if (Array.isArray(state.meetings) && state.meetings.length > 0) setMeetings(state.meetings);
      if (Array.isArray(state.videos) && state.videos.length > 0) setVideos(state.videos);
      if (Array.isArray(state.projectCategories) && state.projectCategories.length > 0) {
        setProjectCategories(state.projectCategories);
      } else {
        setProjectCategories(PROJECT_CATEGORIES);
      }
      if (Array.isArray(state.auditLog)) setAuditLog(state.auditLog);
      if (state.appConfig && typeof state.appConfig === 'object') setAppConfig(state.appConfig);
      if (state.clientLogos && typeof state.clientLogos === 'object') {
        const logoKeys = Object.keys(state.clientLogos);
        console.log(`[Socket] Received ${logoKeys.length} client logos. Keys:`, logoKeys);
        setClientLogos(state.clientLogos);
      } else {
        console.warn('[Socket] No client logos received in state:init or invalid type:', typeof state.clientLogos);
      }
      
      console.log("State initialization complete. Loaded keys:", Array.from(loadedKeysRef.current));
      isInitialLoadDone.current = true;
    });

    newSocket.on('state:changed', (update: { key: string, value: any }) => {
      // Clear pending sync for this specific key to prevent race conditions
      if (syncTimeoutRef.current[update.key]) {
        clearTimeout(syncTimeoutRef.current[update.key]);
        delete syncTimeoutRef.current[update.key];
      }

      lastServerState.current[update.key] = JSON.stringify(update.value);
      loadedKeysRef.current.add(update.key);

      switch (update.key) {
        case 'users': setUsers(update.value); break;
        case 'clients': setClients([...update.value].sort((a, b) => a.localeCompare(b))); break;
        case 'projects': setProjects(update.value); break;
        case 'licenses': setLicenses(update.value); break;
        case 'notifications': setNotifications(update.value); break;
        case 'contracts': setContracts(update.value); break;
        case 'reports': setReports(update.value); break;
        case 'checklistTemplates': setChecklistTemplates(update.value); break;
        case 'meetings': setMeetings(update.value); break;
        case 'videos': setVideos(update.value); break;
        case 'projectCategories': setProjectCategories(update.value); break;
        case 'auditLog': setAuditLog(update.value); break;
        case 'appConfig': setAppConfig(update.value); break;
        case 'clientLogos': setClientLogos(update.value); break;
      }
    });

    newSocket.on('state:deleted', (data: { key: string, id: string }) => {
      console.log(`Deleção recebida do servidor: ${data.key}:${data.id}`);
      switch (data.key) {
        case 'users': setUsers(prev => prev.filter(u => u.id !== data.id)); break;
        case 'projects': setProjects(prev => prev.filter(p => p.id !== data.id)); break;
        case 'licenses': setLicenses(prev => prev.filter(l => l.id !== data.id)); break;
        case 'notifications': setNotifications(prev => prev.filter(n => n.id !== data.id)); break;
        case 'contracts': setContracts(prev => prev.filter(c => c.id !== data.id)); break;
        case 'reports': setReports(prev => prev.filter(r => r.id !== data.id)); break;
        case 'meetings': setMeetings(prev => prev.filter(m => m.id !== data.id)); break;
        case 'videos': setVideos(prev => prev.filter(v => v.id !== data.id)); break;
      }
    });

    // ──────────────────────────────────────────────────────────────────────
    // SUPABASE REALTIME SUBSCRIPTIONS
    // ──────────────────────────────────────────────────────────────────────
    const projectsChannel = supabase.channel('public:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        console.log('[Realtime] Project change detected:', payload.eventType);
        if (payload.eventType === 'INSERT') {
          const newProject = mapProjectFromDb(payload.new);
          setProjects(prev => {
            if (prev.some(p => p.id === newProject.id)) return prev;
            return [newProject, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedProject = mapProjectFromDb(payload.new);
          setProjects((prev: Project[]) => {
            const newState = prev.map(p => p.id === updatedProject.id ? updatedProject : p);
            lastServerState.current['projects'] = JSON.stringify(newState);
            return newState;
          });
        } else if (payload.eventType === 'DELETE') {
          setProjects((prev: Project[]) => {
            const newState = prev.filter(p => p.id !== payload.old.id);
            lastServerState.current['projects'] = JSON.stringify(newState);
            return newState;
          });
        }


      })
      .subscribe();

    const licensesChannel = supabase.channel('public:licenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, (payload) => {
        console.log('[Realtime] License change detected:', payload.eventType);
        if (payload.eventType === 'INSERT') {
          const newLicense = mapLicenseFromDb(payload.new);
          setLicenses(prev => {
            if (prev.some(l => l.id === newLicense.id)) return prev;
            return [newLicense, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedLicense = mapLicenseFromDb(payload.new);
          setLicenses((prev: EnvironmentalLicense[]) => {
            const newState = prev.map(l => l.id === updatedLicense.id ? updatedLicense : l);
            lastServerState.current['licenses'] = JSON.stringify(newState);
            return newState;
          });
        } else if (payload.eventType === 'DELETE') {
          setLicenses((prev: EnvironmentalLicense[]) => {
            const newState = prev.filter(l => l.id !== payload.old.id);
            lastServerState.current['licenses'] = JSON.stringify(newState);
            return newState;
          });
        }


      })
      .subscribe();

    const notificationsChannel = supabase.channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        console.log('[Realtime] Notification change detected:', payload.eventType);
        if (payload.eventType === 'INSERT') {
          const newNotif = mapNotificationFromDb(payload.new);
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotif = mapNotificationFromDb(payload.new);
          setNotifications((prev: Notification[]) => {
            const newState = prev.map(n => n.id === updatedNotif.id ? updatedNotif : n);
            lastServerState.current['notifications'] = JSON.stringify(newState);
            return newState;
          });
        } else if (payload.eventType === 'DELETE') {
          setNotifications((prev: Notification[]) => {
            const newState = prev.filter(n => n.id !== payload.old.id);
            lastServerState.current['notifications'] = JSON.stringify(newState);
            return newState;
          });
        }


      })
      .subscribe();

    return () => {
      newSocket.disconnect();
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(licensesChannel);
      supabase.removeChannel(notificationsChannel);
    };

  }, [currentUser]); // Run only on login/logout


  useEffect(() => {
    socketRef.current = socket;
    isConnectedRef.current = isConnected;
  }, [socket, isConnected]);

  const emitUpdate = useCallback((key: string, value: any) => {
    if (!socketRef.current || !isConnectedRef.current) return;

    // Clear existing timeout for this key
    if (syncTimeoutRef.current[key]) {
      clearTimeout(syncTimeoutRef.current[key]);
    }

    // Debounce the sync to prevent hammering the server and sync loops
    syncTimeoutRef.current[key] = setTimeout(() => {
      // CRITICAL: Do not sync back if we haven't successfully loaded this key from the server yet.
      // This prevents wiping the server state with empty local state during initialization.
      if (!loadedKeysRef.current.has(key)) {
        console.warn(`Attempted to sync ${key} before it was loaded. Sync blocked.`);
        return;
      }

      const stringified = JSON.stringify(value);
      if (lastServerState.current[key] === stringified) return;

      console.log(`Syncing ${key} to server...`);
      setIsSyncing(true);
      lastServerState.current[key] = stringified;
      socketRef.current?.emit('state:update', { key, value, user: currentUser });

      // Reset syncing indicator after a short delay
      setTimeout(() => setIsSyncing(false), 1000);
    }, 500); // 500ms debounce
  }, [currentUser]); // Depend only on currentUser identity

  const emitDelete = useCallback((key: string, id: string) => {
    if (!socketRef.current || !isConnectedRef.current) return;
    console.log(`Emitting delete for ${key}:${id}`);
    socketRef.current?.emit('state:delete', { key, id, user: currentUser });
  }, [currentUser]);



  // Join presence when logged in
  useEffect(() => {
    if (socket && isConnected && currentUser) {
      socket.emit('presence:join', currentUser);
    }
  }, [socket, isConnected, currentUser]);

  // Sync local state changes to server
  useEffect(() => {
    if (isInitialLoadDone.current) emitUpdate('users', users);
  }, [users, emitUpdate]);

  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('projects', projects); }, [projects, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('licenses', licenses); }, [licenses, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('notifications', notifications); }, [notifications, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('contracts', contracts); }, [contracts, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('clients', clients); }, [clients, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('meetings', meetings); }, [meetings, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('videos', videos); }, [videos, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current) emitUpdate('reports', reports); }, [reports, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current && projectCategories.length > 0) emitUpdate('projectCategories', projectCategories); }, [projectCategories, emitUpdate]);
  useEffect(() => { if (isInitialLoadDone.current && Object.keys(checklistTemplates).length > 0) emitUpdate('checklistTemplates', checklistTemplates); }, [checklistTemplates, emitUpdate]);
  useEffect(() => { 
    if (isInitialLoadDone.current) {
      console.log('App: Syncing appConfig change...', { hasIcon: !!appConfig.appIcon });
      emitUpdate('appConfig', appConfig); 
    }
  }, [appConfig, emitUpdate]);
  useEffect(() => { 
    if (isInitialLoadDone.current) {
      console.log(`[Sync] Emitting clientLogos update. Total logos: ${Object.keys(clientLogos).length}`);
      emitUpdate('clientLogos', clientLogos); 
    }
  }, [clientLogos, emitUpdate]);

  useEffect(() => {
    // Ensure loading screen lasts at least 1.5 seconds for branding
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);



  // Handle PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Update favicon and manifest dynamically with cache busting
  useEffect(() => {
    const version = appConfig.appIcon ? appConfig.appIcon.length : 'default';
    const iconUrl = appConfig.appIcon || 'https://cdn-icons-png.flaticon.com/512/2991/2991163.png';
    const serverIconUrl = `/api/app-icon.png?v=${version}`;
    
    // Update favicon using the direct base64 for instant feedback, but fallback to server URL
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconUrl;

    // Update apple-touch-icon (OS prefers server URLs sometimes)
    let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = serverIconUrl;

    // Update manifest link with version to force re-fetch
    let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = `/manifest.json?v=${version}`;

    console.log('App: Favicon and Manifest updated with version', version);
  }, [appConfig.appIcon]);

  // Ordem das abas para navegação por swipe (filtrada por permissões)
  const tabOrder = useMemo(() => {
    const base = ['dashboard', 'map', 'notifications', 'clients', 'agenda', 'reports', 'finance'];
    if (currentUser?.role === 'admin' || currentUser?.role === 'engineer') base.push('config');
    if (currentUser?.role === 'admin') {
      base.push('users');
      base.push('server');
    }
    base.push('profile');
    return base;
  }, [currentUser]);

  const touchStartRef = useRef<number | null>(null);

  const [adminClientFilter, setAdminClientFilter] = useState<string | null>(null);

  const handleLogin = (userLogin: string, pass: string) => {
    const loginLower = userLogin.toLowerCase().trim();
    setLoginError(undefined);

    const foundUser = users.find(u => {
      const emailLower = (u.email || '').toLowerCase().trim();
      const nameLower = (u.name || '').toLowerCase().trim();
      const emailPrefix = emailLower.split('@')[0];

      const loginMatches = (
        emailLower === loginLower ||
        nameLower === loginLower ||
        emailPrefix === loginLower
      );

      return loginMatches && (u.password === pass);
    });


    if (foundUser) {
      const { password, ...userData } = foundUser;
      localStorage.setItem('baccarim_user', JSON.stringify(userData));
      setCurrentUser(userData);
      setActiveTab('dashboard');
    } else {
      setLoginError('Credenciais inválidas. Verifique seu usuário e senha.');
    }
  };

  const confirmLogout = () => {
    if (socket) socket.emit('presence:leave');
    localStorage.removeItem('baccarim_user');
    setCurrentUser(null);
    setAdminClientFilter(null);
    setActiveTab('dashboard');
    setLoginError(undefined);
    setShowLogoutConfirm(false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    localStorage.setItem('baccarim_user', JSON.stringify(updatedUser));
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleUpdateLicense = (updatedLicense: EnvironmentalLicense) => {
    setLicenses(prev => prev.map(l => l.id === updatedLicense.id ? updatedLicense : l));
  };

  const handleUpdateNotification = (updatedNotif: Notification) => {
    setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
  };

  const handleUpdateReport = (updatedReport: PhotoReport) => {
    setReports(prev => {
      const exists = prev.find(r => r.id === updatedReport.id);
      if (exists) {
        return prev.map(r => r.id === updatedReport.id ? updatedReport : r);
      }
      return [updatedReport, ...prev];
    });
  };

  const handleUpdateContract = (updatedContract: Contract) => {
    setContracts(prev => {
      const exists = prev.find(c => c.id === updatedContract.id);
      if (exists) {
        return prev.map(c => c.id === updatedContract.id ? updatedContract : c);
      }
      return [updatedContract, ...prev];
    });
  };

  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    emitDelete('reports', id);
  };

  const handleDeleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    emitDelete('contracts', id);
  };

  const handleAddNotification = (newNotif: Notification) => {
    setNotifications(prev => [newNotif, ...prev]);
  };


  const handleUpdateClientLogo = useCallback((clientName: string, logoBase64: string) => {
    setClientLogos(prev => ({ ...prev, [clientName]: logoBase64 }));
  }, []);

  const handleDeleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    emitDelete('notifications', id);
  }, [emitDelete]);

  const handleDeleteLicense = useCallback((id: string) => {
    setLicenses(prev => prev.filter(l => l.id !== id));
    emitDelete('licenses', id);
  }, [emitDelete]);

  const handleAddClient = (clientName: string) => {
    if (!clients.includes(clientName)) {
      setClients(prev => [...prev, clientName].sort((a, b) => a.localeCompare(b)));
    }
  };

  const handleAddProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    const newLicense: EnvironmentalLicense = {
      id: `l-${newProject.id}-${Date.now()}`,
      name: `${newProject.name} - ${newProject.currentPhase?.split(' (')[0] || 'LP'}`,
      clientName: newProject.clientName,
      type: newProject.currentPhase || LicenseType.LP,
      agency: newProject.specs.orgaoResponsavel || 'SEMA',
      issueDate: 'Pendente',
      expiryDate: 'Pendente',
      status: LicenseStatus.PENDING,
      processNumber: newProject.specs.numeroProtocolo || 'Em Requerimento',
      documentation: [],
      detailedStatus: 'Aguardando Protocolo'
    };
    setLicenses(prev => [newLicense, ...prev]);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Excluir este empreendimento?')) {
      // Find dependent items to delete them too
      const projectLicenses = licenses.filter(l => l.id.includes(projectId));
      const projectNotifications = notifications.filter(n => n.projectId === projectId);
      const projectReports = reports.filter(r => r.projectId === projectId);
      const projectContracts = contracts.filter(c => c.projectId === projectId);

      // Locally filter
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setLicenses(prev => prev.filter(l => !l.id.includes(projectId)));
      setNotifications(prev => prev.filter(n => n.projectId !== projectId));
      setReports(prev => prev.filter(r => r.projectId !== projectId));
      setContracts(prev => prev.filter(c => c.projectId !== projectId));

      // Emit deletions
      emitDelete('projects', projectId);
      projectLicenses.forEach(l => emitDelete('licenses', l.id));
      projectNotifications.forEach(n => emitDelete('notifications', n.id));
      projectReports.forEach(r => emitDelete('reports', r.id));
      projectContracts.forEach(c => emitDelete('contracts', c.id));
    }
  };

  const currentClientFocus = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'client') {
      return currentUser.clientNames && currentUser.clientNames.length > 0 ? currentUser.clientNames : null;
    }
    return adminClientFilter ? [adminClientFilter] : null;
  }, [currentUser, adminClientFilter]);

  const filteredLicenses = useMemo(() => {
    if (!currentClientFocus) return licenses;
    return licenses.filter(l => currentClientFocus.includes(l.clientName));
  }, [currentClientFocus, licenses]);

  const filteredNotifications = useMemo(() => {
    if (!currentClientFocus) return notifications;
    return notifications.filter(n => currentClientFocus.includes(n.clientName));
  }, [currentClientFocus, notifications]);

  const filteredProjects = useMemo(() => {
    if (!currentClientFocus) return projects;
    return projects.filter(p => currentClientFocus.includes(p.clientName));
  }, [currentClientFocus, projects]);

  const projectsForMap = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'engineer') return projects;
    return projects.filter(p => currentUser.clientNames?.includes(p.clientName));
  }, [currentUser, projects]);

  const filteredContracts = useMemo(() => {
    if (!currentClientFocus) return contracts;
    return contracts.filter(c => currentClientFocus.includes(c.clientName));
  }, [currentClientFocus, contracts]);

  const filteredReports = useMemo(() => {
    if (!currentClientFocus) return reports;
    return reports.filter(r => currentClientFocus.includes(r.clientName));
  }, [currentClientFocus, reports]);

  const filteredClientsList = useMemo(() => {
    if (!currentUser) return [];
    const list = (currentUser.role === 'admin' || currentUser.role === 'engineer') ? clients : (currentUser.clientNames || []);
    return [...list].sort((a, b) => a.localeCompare(b));
  }, [currentUser, clients]);

  const chartDataStatus = useMemo(() => {
    const active = filteredLicenses.filter(l => l.status === LicenseStatus.ACTIVE).length;
    const expiring = filteredLicenses.filter(l => l.status === LicenseStatus.EXPIRING).length;
    const expired = filteredLicenses.filter(l => l.status === LicenseStatus.EXPIRED).length;
    return [
      { name: 'Ativas', value: active, color: '#00B08E' },
      { name: 'Vencendo', value: expiring, color: '#3FA9F5' },
      { name: 'Vencidas', value: expired, color: '#EF4444' }
    ];
  }, [filteredLicenses]);

  const chartDataCompliance = useMemo(() => {
    const phases = [LicenseType.LP, LicenseType.LI, LicenseType.LAS, LicenseType.LO];
    return phases.map(phase => {
      const phaseProjects = filteredProjects.filter(p => p.currentPhase === phase);
      const avgProgress = phaseProjects.length > 0
        ? Math.round(phaseProjects.reduce((acc, curr) => acc + curr.progress, 0) / phaseProjects.length)
        : 0;
      return {
        name: phase.split(' (')[0],
        progresso: avgProgress
      };
    });
  }, [filteredProjects]);

  const stats = useMemo(() => {
    const iatNotifs = filteredNotifications.filter(n => n.agency === 'IAT' && n.status === 'Open').length;
    const semaNotifs = filteredNotifications.filter(n => n.agency === 'SEMA' && n.status === 'Open').length;
    const liInProgress = filteredLicenses.filter(l => l.type === LicenseType.LI && l.status === LicenseStatus.ACTIVE).length;
    return {
      total: filteredLicenses.length,
      liActive: liInProgress,
      iatNotifs,
      semaNotifs,
      expired: filteredLicenses.filter(l => l.status === LicenseStatus.EXPIRED).length,
      notifs: filteredNotifications.filter(n => n.status === 'Open').length
    };
  }, [filteredLicenses, filteredNotifications]);


  // Lógica de Swipe para trocar abas
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTab === 'map' || activeTab === 'reports' || activeTab === 'finance') return;
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    const currentIndex = tabOrder.indexOf(activeTab);

    // Swipe para esquerda (aba seguinte)
    if (diff > 80 && currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
    // Swipe para direita (aba anterior)
    else if (diff < -80 && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }

    touchStartRef.current = null;
  };

  if (isLoading) return <LoadingScreen />;
  if (!currentUser) return <LoginView onLogin={handleLogin} error={loginError} appIcon={appConfig.appIcon} />;

  return (
    <div className="min-h-screen bg-baccarim-dark flex flex-col md:flex-row font-sans relative overflow-x-hidden text-baccarim-text">
      {storageError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-rose-600 text-baccarim-text px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-4 animate-in slide-in-from-top-10">
          <i className="fas fa-database text-xl"></i>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Limite de Armazenamento Atingido</p>
            <p className="text-[9px] font-bold opacity-80 mt-1">Remova relatórios antigos para salvar novos dados.</p>
          </div>
          <button onClick={() => setStorageError(false)} className="ml-4 opacity-50 hover:opacity-100"><i className="fas fa-times"></i></button>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border border-baccarim-border-hover">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="fas fa-power-off"></i>
            </div>
            <h3 className="text-xl font-black text-baccarim-text mb-2">Deseja sair?</h3>
            <p className="text-xs text-baccarim-text-muted mb-8 leading-relaxed">
              Sua sessão será encerrada e você precisará se identificar novamente para acessar o portal.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-baccarim-active transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={confirmLogout}
                className="py-4 bg-red-500 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all"
              >
                Sair Agora
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-80 bg-baccarim-dark text-baccarim-text flex-col sticky top-0 h-screen p-8 border-r border-baccarim-border overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center mb-16 px-4">
          <AppLogo className="w-16 h-16 mb-6" customIcon={appConfig.appIcon} />
          <div className="text-center">
            <h1 className="text-3xl font-black text-baccarim-text tracking-tighter leading-none">Baccarim</h1>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className="h-[1px] w-4 bg-gradient-to-r from-transparent to-baccarim-blue/40"></div>
              <span className="text-[9px] text-baccarim-blue/60 uppercase font-black tracking-[0.3em] whitespace-nowrap">Systems Cloud</span>
              <div className="h-[1px] w-4 bg-gradient-to-l from-transparent to-baccarim-blue/40"></div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
            <i className="fas fa-chart-pie w-5"></i>
            <span className="text-sm font-bold">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'map' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
            <i className="fas fa-map-location-dot w-5"></i>
            <span className="text-sm font-bold">Mapa de Obras</span>
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'notifications' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
            <div className="flex items-center space-x-4">
              <i className="fas fa-bell w-5"></i>
              <span className="text-sm font-bold">Notificações</span>
            </div>
            {stats.notifs > 0 && <span className="w-5 h-5 bg-baccarim-rose text-baccarim-text text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">{stats.notifs}</span>}
          </button>
          <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'clients' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
            <i className="fas fa-building-circle-check w-5"></i>
            <span className="text-sm font-bold">{currentUser.role === 'client' ? 'Meus Projetos' : 'Clientes'}</span>
          </button>
          <button onClick={() => setActiveTab('agenda')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'agenda' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
            <i className="fas fa-calendar-day w-5"></i>
            <span className="text-sm font-bold">Agenda Técnica</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'reports' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
            <i className="fas fa-camera-retro w-5"></i>
            <span className="text-sm font-bold">Relatórios Fotog.</span>
          </button>
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'finance' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
            <i className="fas fa-file-invoice-dollar w-5"></i>
            <span className="text-sm font-bold">Financeiro</span>
          </button>
          {(currentUser.role === 'admin' || currentUser.role === 'engineer') && (
            <button onClick={() => setActiveTab('config')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'config' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-sliders w-5"></i>
              <span className="text-sm font-bold">Config. Checklists</span>
            </button>
          )}
          {currentUser.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
                <i className="fas fa-users-gear w-5"></i>
                <span className="text-sm font-bold">Gestão de Contas</span>
              </button>
              <button onClick={() => setActiveTab('server')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'server' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
                <i className="fas fa-server w-5"></i>
                <span className="text-sm font-bold">Servidor & Nuvem</span>
              </button>
            </>
          )}
        </nav>

        <div className="mt-auto pt-8 border-t border-baccarim-border">
          <div className="bg-baccarim-hover rounded-3xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-baccarim-text-muted">Sincronização</span>
              <div className="flex items-center space-x-3">
                {isSyncing && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-baccarim-blue rounded-full animate-bounce"></div>
                    <span className="text-[7px] font-black uppercase tracking-widest text-baccarim-blue">Salvando...</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-baccarim-green shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isConnected ? 'text-baccarim-green' : 'text-red-500'}`}>
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="flex items-center space-x-4 cursor-pointer hover:bg-baccarim-hover p-2 rounded-xl transition-all"
              onClick={() => setActiveTab('profile')}
            >
              <div className="w-10 h-10 rounded-xl bg-baccarim-blue/10 border border-baccarim-border flex items-center justify-center text-baccarim-text font-black text-xs shadow-lg">
                {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-baccarim-text truncate">{currentUser.name}</p>
                <p className="text-[9px] font-bold text-baccarim-text-muted uppercase tracking-widest">
                  {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'engineer' ? 'Engenheiro' : 'Cliente Estratégico'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="flex items-center justify-center space-x-2 p-2 rounded-xl bg-baccarim-blue text-white hover:bg-baccarim-green transition-all text-[9px] font-black uppercase tracking-widest"
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                <span>{theme === 'light' ? 'Escuro' : 'Claro'}</span>
              </button>
              <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center justify-center space-x-2 p-2 rounded-xl bg-red-500/10 text-red-400 hover:text-baccarim-text hover:bg-red-500 transition-all text-[9px] font-black uppercase tracking-widest">
                <i className="fas fa-power-off"></i>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 px-4 pt-24 pb-48 md:p-14 md:pt-14 ${activeTab === 'map' ? 'h-screen flex flex-col overflow-hidden !pt-0 !px-0 !pb-0' : 'overflow-y-auto'}`}
      >
        {/* Mobile Header */}
        <header className={`md:hidden fixed top-0 left-0 right-0 h-20 bg-baccarim-dark/80 backdrop-blur-xl border-b border-baccarim-border z-[100] px-6 flex items-center justify-between transition-transform duration-300 ${activeTab === 'map' ? '-translate-y-full' : 'translate-y-0'}`}>
          <div className="flex items-center space-x-4">
            <AppLogo className="w-10 h-10" customIcon={appConfig.appIcon} />
            <div>
              <h2 className="text-lg font-black leading-none tracking-tight">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'map' && 'Mapa de Obras'}
                {activeTab === 'notifications' && 'Notificações'}
                {activeTab === 'clients' && (currentUser.role === 'client' ? 'Meus Projetos' : 'Clientes')}
                {activeTab === 'agenda' && 'Agenda Técnica'}
                {activeTab === 'reports' && 'Relatórios'}
                {activeTab === 'finance' && 'Financeiro'}
                {activeTab === 'config' && 'Checklists'}
                {activeTab === 'users' && 'Usuários'}
                {activeTab === 'server' && 'Servidor'}
                {activeTab === 'profile' && 'Meu Perfil'}
              </h2>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-[7px] text-baccarim-blue uppercase font-black tracking-[0.2em]">Systems Cloud</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-10 h-10 rounded-xl bg-baccarim-hover flex items-center justify-center text-baccarim-text transition-all"
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-10 h-10 rounded-xl bg-baccarim-active flex items-center justify-center text-baccarim-text font-black text-xs border border-baccarim-border shadow-lg"
            >
              {currentUser.name[0].toUpperCase()}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                {(currentUser.role === 'admin' || currentUser.role === 'engineer') ? (
                  <div className="relative group max-w-sm">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-baccarim-blue">
                      <i className="fas fa-building-user text-xs"></i>
                    </div>
                    <select
                      value={adminClientFilter || ''}
                      onChange={(e) => setAdminClientFilter(e.target.value || null)}
                      className="w-full pl-12 pr-10 py-4 bg-baccarim-card border border-baccarim-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-baccarim-text outline-none focus:ring-4 focus:ring-baccarim-blue/10 focus:border-baccarim-blue transition-all appearance-none cursor-pointer group-hover:border-baccarim-border-hover shadow-xl"
                    >
                      <option value="" className="bg-baccarim-dark">Todos os Clientes (Visão Global)</option>
                      {[...clients].sort((a, b) => a.localeCompare(b)).map(client => (
                        <option key={client} value={client} className="bg-baccarim-dark">{client}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-baccarim-text-muted">
                      <i className="fas fa-chevron-down text-[10px]"></i>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                    <StatCard title="Licenças Ativas" value={stats.total} icon="fa-file-shield" color="bg-baccarim-navy" />
                    <StatCard title="Pendências IAT" value={stats.iatNotifs} icon="fa-envelope-open-text" color="bg-baccarim-blue" />
                    <StatCard title="Pendências SEMA" value={stats.semaNotifs} icon="fa-building-shield" color="bg-baccarim-green" />
                    <StatCard title="Prazos Vencidos" value={stats.expired} icon="fa-triangle-exclamation" color="bg-red-500" />

                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsPresentationMode(!isPresentationMode)}
                  className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center space-x-3 shadow-xl ${
                    isPresentationMode ? 'bg-baccarim-blue text-baccarim-text ring-4 ring-baccarim-blue/20' : 'bg-baccarim-card text-baccarim-text-muted hover:bg-baccarim-hover border border-baccarim-border'
                  }`}
                >
                  <i className={`fas ${isPresentationMode ? 'fa-tv' : 'fa-chart-line'} text-sm`}></i>
                  <span>{isPresentationMode ? 'Sair da Apresentação' : 'Modo Apresentação'}</span>
                </button>
              </div>
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'engineer') && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
                <StatCard title="Licenças Ativas" value={stats.total} icon="fa-file-shield" color="bg-baccarim-navy" />
                <StatCard title="Pendências IAT" value={stats.iatNotifs} icon="fa-envelope-open-text" color="bg-baccarim-blue" />
                <StatCard title="Pendências SEMA" value={stats.semaNotifs} icon="fa-building-shield" color="bg-baccarim-green" />
                <StatCard title="Prazos Vencidos" value={stats.expired} icon="fa-triangle-exclamation" color="bg-red-500" />

              </div>
            )}

            {deferredPrompt && !isPresentationMode && (
              <div className="bg-gradient-to-r from-baccarim-blue to-baccarim-green rounded-[2.5rem] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-6 border border-white/20">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-inner">
                    <img src={appConfig.appIcon || 'https://cdn-icons-png.flaticon.com/512/2991/2991163.png'} alt="App Icon" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-none mb-1">Baixe nosso Aplicativo!</h3>
                    <p className="text-sm font-bold text-white/80">Instale a Baccarim Systems no seu dispositivo para acesso rápido e offline.</p>
                  </div>
                </div>
                <button 
                  onClick={handleInstallClick}
                  className="w-full md:w-auto px-8 py-4 bg-white text-baccarim-blue rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-zinc-100 transition-all shadow-xl whitespace-nowrap"
                >
                  <i className="fas fa-download mr-2"></i>
                  Instalar App
                </button>
              </div>
            )}

            {isPresentationMode ? (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-black text-baccarim-text tracking-tighter">Status Geral dos Empreendimentos</h2>
                  <p className="text-xs text-baccarim-text-muted font-bold uppercase tracking-[0.3em] mt-2">Visão Executiva para Apresentação</p>
                </div>
                <ProjectStatusSummary
                  projects={filteredProjects}
                  licenses={licenses}
                  notifications={notifications}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-baccarim-card p-8 rounded-[2.5rem] shadow-2xl border border-baccarim-border h-[380px] flex flex-col">
                <h3 className="text-xs font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Status Ambiental</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartDataStatus} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {chartDataStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#001A3A', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-baccarim-card p-8 rounded-[2.5rem] shadow-2xl border border-baccarim-border h-[380px] flex flex-col">
                <h3 className="text-xs font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Média de Conformidade por Fase</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataCompliance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} unit="%" />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#001A3A', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                      <Bar dataKey="progresso" fill="#3FA9F5" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2"><SmartAnalysis licenses={filteredLicenses} notifications={filteredNotifications} /></div>
              <div className="bg-baccarim-card rounded-[3rem] p-10 shadow-xl border border-baccarim-border flex flex-col items-center justify-center text-center">
                <AppLogo className="w-16 h-16 mb-4" customIcon={appConfig.appIcon} />
                <h3 className="mt-4 text-lg font-black text-baccarim-text">{currentClientFocus || 'Visão Geral'}</h3>
                <button onClick={() => setActiveTab('reports')} className="mt-6 w-full py-4 bg-baccarim-blue text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg hover:bg-baccarim-green transition-all">Novo Relatório Fotográfico</button>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <MapView 
            projects={projectsForMap} 
            clients={filteredClientsList}
            onSelectProject={(id) => {
              const proj = projects.find(p => p.id === id);
              if (proj) {
                setAdminClientFilter(proj.clientName);
                setActiveTab('clients');
              }
            }} 
          />
        )}
        {activeTab === 'notifications' && <NotificationsView notifications={filteredNotifications} clients={filteredClientsList} projects={filteredProjects} onAddNotification={handleAddNotification} onUpdateNotification={handleUpdateNotification} onDeleteNotification={handleDeleteNotification} />}
        {activeTab === 'clients' && <ClientsView userRole={currentUser.role} clients={filteredClientsList} licenses={filteredLicenses} notifications={filteredNotifications} projects={filteredProjects} checklistTemplates={checklistTemplates} projectCategories={projectCategories} onUpdateProject={handleUpdateProject} onAddProject={handleAddProject} onAddClient={handleAddClient} onDeleteProject={handleDeleteProject} onSelectClient={(n) => setAdminClientFilter(n)} onDeleteClient={(client) => {
          if (window.confirm(`Excluir o cliente ${client} e todos os seus dados?`)) {
            setClients(prev => prev.filter(c => c !== client));
            emitDelete('clients', client);
          }
        }} onAddNotification={handleAddNotification} clientLogos={clientLogos} onUpdateClientLogo={handleUpdateClientLogo} />}
        {activeTab === 'agenda' && <AgendaView currentUser={currentUser} clients={filteredClientsList} projects={filteredProjects} licenses={filteredLicenses} notifications={filteredNotifications} onAddNotification={handleAddNotification} onUpdateNotification={handleUpdateNotification} onUpdateLicense={handleUpdateLicense} onDeleteNotification={handleDeleteNotification} onDeleteLicense={handleDeleteLicense} />}
        {activeTab === 'finance' && <FinanceView clients={filteredClientsList} contracts={filteredContracts} onUpdateContract={handleUpdateContract} onDeleteContract={handleDeleteContract} />}
        {activeTab === 'reports' && <PhotoReportView projects={filteredProjects} reports={filteredReports} onUpdateReport={handleUpdateReport} onDeleteReport={handleDeleteReport} />}
        {activeTab === 'users' && currentUser.role === 'admin' && (
          <UsersView
            users={users}
            clients={clients}
            onAddUser={(newUser) => setUsers(prev => [...prev, newUser])}
            onDeleteUser={(id) => {
              setUsers(prev => prev.filter(u => u.id !== id));
              emitDelete('users', id);
            }}
          />
        )}
        {activeTab === 'config' && (currentUser.role === 'admin' || currentUser.role === 'engineer') && (
          <AppSettingsView
            templates={checklistTemplates}
            onUpdateTemplates={setChecklistTemplates}
            projectCategories={projectCategories}
            onUpdateProjectCategories={setProjectCategories}
            appConfig={appConfig}
            onUpdateAppConfig={setAppConfig}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            user={currentUser}
            onUpdateUser={handleUpdateUser}
            allData={{
              projects,
              licenses,
              notifications,
              contracts,
              meetings,
              videos,
              reports,
              checklistTemplates
            }}
          />
        )}
        {activeTab === 'server' && currentUser.role === 'admin' && (
          <ServerManagementView
            auditLog={auditLog}
            presence={presence}
          />
        )}
      </main>

      {/* Navegação Mobile GTRATÓRIA (Carrossel com Snap) */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-baccarim-card/90 backdrop-blur-2xl border border-baccarim-border/50 pb-safe z-[150] shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-[2rem]">
        <div className="flex items-center overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth py-3 px-2">
          <div className="flex space-x-1 min-w-max">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-baccarim-navy text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-chart-pie text-lg"></i>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Dash</span>
            </button>
            <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'map' ? 'bg-baccarim-blue text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-map-location-dot text-lg"></i>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Mapa</span>
            </button>
            <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'notifications' ? 'bg-baccarim-rose text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <div className="relative">
                <i className="fas fa-bell text-lg"></i>
                {stats.notifs > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white text-baccarim-rose text-[6px] font-black rounded-full flex items-center justify-center border border-baccarim-rose">{stats.notifs}</span>}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Notif</span>
            </button>
            <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'clients' ? 'bg-baccarim-green text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-building-circle-check text-lg"></i>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Obras</span>
            </button>
            <button onClick={() => setActiveTab('agenda')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'agenda' ? 'bg-baccarim-amber text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-calendar-day text-lg"></i>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Prazos</span>
            </button>
            <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'reports' ? 'bg-baccarim-sky text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-camera-retro text-lg"></i>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Laudos</span>
            </button>
            <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'finance' ? 'bg-baccarim-indigo text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-file-invoice-dollar text-lg"></i>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Finance</span>
            </button>
            {(currentUser.role === 'admin' || currentUser.role === 'engineer') && (
              <button onClick={() => setActiveTab('config')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'config' ? 'bg-baccarim-active text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
                <i className="fas fa-sliders text-lg"></i>
                <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Check</span>
              </button>
            )}
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setActiveTab('users')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'users' ? 'bg-baccarim-active text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
                  <i className="fas fa-users-gear text-lg"></i>
                  <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Contas</span>
                </button>
                <button onClick={() => setActiveTab('server')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'server' ? 'bg-baccarim-active text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
                  <i className="fas fa-server text-lg"></i>
                  <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Nuvem</span>
                </button>
              </>
            )}
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center min-w-[65px] snap-center py-3 px-2 rounded-2xl transition-all duration-300 ${activeTab === 'profile' ? 'bg-baccarim-active text-baccarim-text shadow-xl scale-105' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}>
              <i className="fas fa-user-gear text-lg"></i>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">Perfil</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default App;

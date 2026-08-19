
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { downloadFile } from '../utils/fileUtils';
import { exportAllDataAsZip } from '../utils/zipUtils';

// VAPID public key (safe to expose — private key stays on server)
const VAPID_PUBLIC_KEY = 'BFpvQ56vvUjnZVB-BsjsLtJyObMMGnuR672bTBIDQl9laRUDtx8-2IfrKONOoq1PUtqxkh-x-i4bV8Va8B5ua-o';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

interface ProfileViewProps {
  user: User;
  onUpdateUser: (user: User) => void;
  allData?: any;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, allData }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    receiveNotifications: true,
    compactView: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Captura o evento de instalação do PWA
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    // Verifica se já está instalado (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') { setIsInstalled(true); setInstallPrompt(null); }
    } else {
      // iOS Safari — mostrar instrução manual
      alert('Para instalar no iPhone/iPad:\n1. Toque no ícone de compartilhar (□↑)\n2. Selecione "Adicionar à Tela de Início"');
    }
  };

  useEffect(() => {
    const checkPushSubscription = async () => {
      if (!('serviceWorker' in navigator && 'PushManager' in window)) {
        setPushStatus('error');
        return;
      }
      if (window.Notification.permission === 'denied') {
        setPushStatus('error');
        return;
      }
      if (window.Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              setPushStatus('success');
              // Proactively send to server to ensure it is synchronized!
              fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, subscription })
              }).catch(e => console.error("Error auto-syncing push subscription:", e));
              return;
            }
          }
        } catch (e) {
          console.error("Error checking push subscription on mount:", e);
        }
      }
      setPushStatus('idle');
    };
    checkPushSubscription();
  }, []);

  const [isLightMode, setIsLightMode] = useState(() => {
    return document.body.classList.contains('light-theme');
  });

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    if (newMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('baccarim_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('baccarim_theme', 'dark');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser({
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleExportData = () => {
    if (!allData) return;
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFile = {
      fileName: `baccarim_backup_${new Date().toISOString().split('T')[0]}.json`,
      fileData: dataUri,
      fileDate: new Date().toLocaleDateString('pt-BR')
    };
    
    downloadFile(exportFile);
  };

  const handleExportZip = async () => {
    if (!allData) return;
    setIsSaving(true);
    try {
      await exportAllDataAsZip(allData);
    } catch (error) {
      console.error("Erro ao exportar ZIP:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      setPushStatus('error');
      alert('Seu navegador não suporta notificações push. Use Chrome ou Edge.');
      return;
    }

    setPushStatus('loading');
    try {
      // Garante que o SW está registrado
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Pede permissão
      let permission = window.Notification.permission;
      if (permission === 'denied') {
        alert('Notificações bloqueadas. Vá nas configurações do navegador e permita notificações para este site.');
        setPushStatus('error');
        return;
      }
      if (permission === 'default' || permission !== 'granted') {
        permission = await window.Notification.requestPermission();
      }
      if (permission !== 'granted') {
        setPushStatus('error');
        return;
      }

      try {
        // Verifica se já tem subscrição
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          // Cria nova subscrição usando a VAPID key pública hardcoded
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }
        // Envia ao backend (não bloqueia se falhar)
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, subscription })
        }).catch(e => console.warn('Push subscribe sync error (non-fatal):', e));
      } catch (pushErr) {
        console.warn('Erro ao assinar push server. Notificações locais funcionarão.', pushErr);
      }

      // Dispara uma notificação de teste para provar que funciona
      if (registration && registration.showNotification) {
        await registration.showNotification('Baccarim Systems', {
          body: '✅ Notificações ativadas! Você receberá alertas de prazos aqui.',
          icon: 'https://cdn-icons-png.flaticon.com/512/2991/2991163.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/2991/2991163.png',
          vibrate: [100, 50, 100],
        });
      }

      setPushStatus('success');
    } catch (err: any) {
      console.error('Push setup error:', err);
      setPushStatus('error');
      alert(`Erro ao ativar notificações: ${err?.message || err}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {showToast && (
        <div className="fixed top-10 right-10 z-[200] bg-baccarim-green text-white px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-8">
          <div className="flex items-center space-x-3">
            <i className="fas fa-check-circle"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil Atualizado com Sucesso</span>
          </div>
        </div>
      )}

      {/* Header do Perfil Moderno */}
      <div className="relative bg-[#0b1120] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden border border-white/5">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-24 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-10">
          {/* Avatar Section */}
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
            <div className="relative w-28 h-28 md:w-36 md:h-36 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20 flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl">
              {userInitials}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-100">Online</span>
            </div>
          </div>

          {/* User Info Section */}
          <div className="flex-1 text-center md:text-left flex flex-col justify-center h-full pt-2">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 mb-4">
              {user.name}
            </h2>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              <span className="flex items-center space-x-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-lg">
                <i className="fas fa-user-shield text-blue-400 text-xs"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                  {user.role === 'admin' ? 'Administrador do Sistema' : user.role === 'engineer' ? 'Engenheiro' : 'Cliente Estratégico'}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
              <span className="bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 text-gray-300">
                Membro desde {user.createdAt || 'Jan 2024'}
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                Conta Ativa
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {[
                { label: 'Projetos', count: allData?.projects?.length || 0, icon: 'fa-building' },
                { label: 'Notificações', count: allData?.notifications?.filter((n:any)=>!n.read)?.length || 0, icon: 'fa-bell' },
                { label: 'Contratos', count: allData?.contracts?.length || 0, icon: 'fa-file-signature' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 flex flex-col items-start min-w-[110px] hover:bg-white/10 transition-colors cursor-default">
                  <div className="flex items-center space-x-2 mb-1 opacity-70">
                    <i className={`fas ${stat.icon} text-[10px]`}></i>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <span className="text-xl font-black">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Dados */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-baccarim-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-baccarim-border">
            <h3 className="text-xl font-black text-baccarim-text mb-8">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Empresas Vinculadas</label>
                <div className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text-muted min-h-[52px] flex flex-wrap gap-2">
                  {user.clientNames && user.clientNames.length > 0 ? (
                    user.clientNames.map(cn => (
                      <span key={cn} className="bg-baccarim-card px-2 py-1 rounded-md border border-baccarim-border text-[9px] uppercase tracking-widest">{cn}</span>
                    ))
                  ) : (
                    'Baccarim Engenharia'
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-baccarim-border">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full md:w-auto px-12 py-4 bg-baccarim-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Configurações de UI */}
          <div className="bg-baccarim-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-baccarim-border">
            <h3 className="text-xl font-black text-baccarim-text mb-8">Preferências do Sistema</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-baccarim-hover rounded-2xl border border-baccarim-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-baccarim-blue/10 text-baccarim-blue flex items-center justify-center">
                    <i className="fas fa-bell"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-baccarim-text">Notificações por E-mail</p>
                    <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">Alertas de vencimento e mensagens</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFormData({...formData, receiveNotifications: !formData.receiveNotifications})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.receiveNotifications ? 'bg-baccarim-green' : 'bg-baccarim-hover'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-baccarim-card rounded-full transition-all ${formData.receiveNotifications ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-baccarim-hover rounded-2xl border border-baccarim-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-baccarim-active text-baccarim-text flex items-center justify-center">
                    <i className="fas fa-table-list"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-baccarim-text">Visualização Compacta</p>
                    <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">Otimizar espaço em tabelas</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, compactView: !formData.compactView})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.compactView ? 'bg-baccarim-green' : 'bg-baccarim-hover'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-baccarim-card rounded-full transition-all ${formData.compactView ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-baccarim-hover rounded-2xl border border-baccarim-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-baccarim-blue/10 text-baccarim-blue flex items-center justify-center">
                    <i className="fas fa-mobile-screen-button"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-baccarim-text">Avisos no Celular</p>
                    <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">Receber Push de Prazos</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushStatus === 'loading' || pushStatus === 'success'}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    pushStatus === 'success' ? 'bg-baccarim-green/20 text-baccarim-green border border-baccarim-green/30' : 
                    pushStatus === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                    pushStatus === 'loading' ? 'bg-baccarim-hover text-baccarim-text-muted cursor-wait border border-baccarim-border' :
                    'bg-baccarim-blue text-white hover:bg-baccarim-green shadow-xl shadow-baccarim-blue/20'
                  }`}
                >
                  {pushStatus === 'success' ? 'Ativado ✓' : pushStatus === 'error' ? 'Erro / Bloqueado' : pushStatus === 'loading' ? 'Ativando...' : 'Habilitar'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-baccarim-hover rounded-2xl border border-baccarim-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-baccarim-active text-baccarim-text flex items-center justify-center">
                    <i className={`fas ${isLightMode ? 'fa-sun text-baccarim-amber' : 'fa-moon text-indigo-400'}`}></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-baccarim-text">Tema Claro</p>
                    <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">Alternar modo de cores</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-all relative ${isLightMode ? 'bg-baccarim-green' : 'bg-baccarim-hover'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-baccarim-card rounded-full transition-all ${isLightMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar do Perfil */}
        <div className="space-y-8">
          <div className="bg-baccarim-card rounded-[2.5rem] p-8 text-baccarim-text shadow-2xl relative overflow-hidden border border-baccarim-border">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-baccarim-green/10 rounded-full -mb-10 -mr-10 blur-2xl"></div>
            <h4 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Nível de Acesso</h4>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-baccarim-hover border border-baccarim-border-hover flex items-center justify-center text-xl">
                  <i className={`fas ${user.role === 'admin' ? 'fa-shield-halved text-baccarim-blue' : user.role === 'engineer' ? 'fa-helmet-safety text-baccarim-amber' : 'fa-building-user text-baccarim-green'}`}></i>
                </div>
                <div>
                  <p className="text-sm font-black text-baccarim-text">
                    {user.role === 'admin' ? 'Administrador' : user.role === 'engineer' ? 'Engenheiro' : 'Cliente'}
                  </p>
                  <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">
                    Acesso {user.role === 'admin' ? 'Total' : user.role === 'engineer' ? 'Técnico' : 'Restrito'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-baccarim-text-muted leading-relaxed">
                {user.role === 'admin' 
                  ? 'Você possui privilégios de edição completa de licenças, contratos e checklists em todos os projetos.' 
                  : user.role === 'engineer'
                  ? 'Você possui acesso técnico para gerenciar projetos, checklists e laudos fotográficos.'
                  : 'Você possui visualização técnica dos seus empreendimentos e notificações.'}
              </p>
            </div>
          </div>

          <div className="bg-baccarim-card rounded-[2.5rem] p-8 border border-baccarim-border shadow-2xl text-center">
            <h4 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Segurança da Conta</h4>
            <div className="w-20 h-20 bg-baccarim-green/10 text-baccarim-green rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fas fa-lock"></i>
            </div>
            <p className="text-xs font-bold text-baccarim-text">Sua conta é protegida</p>
            <p className="text-[10px] text-baccarim-text-muted mt-2">Último login: {new Date().toLocaleDateString('pt-BR')}</p>
            <button className="mt-6 w-full py-3 border border-baccarim-border-hover rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-baccarim-hover transition-all text-baccarim-text-muted">
              Alterar Senha
            </button>
          </div>

          {(user.role === 'admin' || user.role === 'engineer') && (
            <div className="bg-baccarim-card rounded-[2.5rem] p-8 border border-baccarim-border shadow-2xl text-center">
              <h4 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Backup do Sistema</h4>
              <div className="w-20 h-20 bg-baccarim-blue/5 text-baccarim-blue rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-file-export"></i>
              </div>
              <p className="text-xs font-bold text-baccarim-text">Exportar Base de Dados</p>
              <p className="text-[10px] text-baccarim-text-muted mt-2">Baixe todos os registros (JSON)</p>
              <div className="grid grid-cols-1 gap-3 mt-6">
                <button 
                  onClick={handleExportData}
                  className="w-full py-4 bg-baccarim-hover text-baccarim-text rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-baccarim-active transition-all"
                >
                  Download JSON
                </button>
                <button 
                  onClick={handleExportZip}
                  disabled={isSaving}
                  className="w-full py-4 bg-baccarim-blue text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-baccarim-green transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <div className="w-3 h-3 border-2 border-baccarim-border/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <i className="fas fa-file-zipper"></i>
                  )}
                  <span>Download Tudo (ZIP)</span>
                </button>
              </div>
            </div>
          )}

          {/* Instalar App */}
          <div className="bg-gradient-to-br from-baccarim-navy to-baccarim-blue rounded-[2.5rem] p-8 border border-baccarim-border-hover shadow-2xl text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-3xl border border-white/20">
                <i className="fas fa-mobile-screen-button"></i>
              </div>
              <p className="text-sm font-black">Instalar no Celular</p>
              <p className="text-[10px] text-white/60 mt-2 mb-6">Acesse como app, sem abrir o navegador</p>
              {isInstalled ? (
                <div className="py-3 px-4 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-baccarim-green border border-baccarim-green/30">
                  <i className="fas fa-check mr-2"></i>App Instalado ✓
                </div>
              ) : (
                <button
                  onClick={handleInstallApp}
                  className="w-full py-4 bg-white text-baccarim-navy rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-baccarim-green hover:text-white transition-all"
                >
                  <i className="fas fa-download mr-2"></i>Baixar App
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

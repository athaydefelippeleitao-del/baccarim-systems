
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        {/* Formulário de Dados e Preferências */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Informações Pessoais - Dark Glass Card */}
          <form onSubmit={handleSubmit} className="bg-[#0b1120] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden group">
            {/* Efeitos de Luz no Fundo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[80px] -ml-40 -mb-40 pointer-events-none group-hover:bg-teal-500/10 transition-colors duration-1000"></div>
            
            <h3 className="text-xl font-black text-white mb-8 flex items-center space-x-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/10">
                <i className="fas fa-id-card text-white text-lg"></i>
              </div>
              <span className="tracking-tight">Informações Pessoais</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest ml-2">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-semibold text-white outline-none focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-white/20 shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest ml-2">E-mail Corporativo</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-semibold text-white outline-none focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-white/20 shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest ml-2">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-semibold text-white outline-none focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-white/20 shadow-inner"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest ml-2">Empresas Vinculadas</label>
                <div className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-semibold text-white/50 min-h-[56px] flex flex-wrap gap-2 items-center shadow-inner hover:border-white/20 transition-all">
                  {user.clientNames && user.clientNames.length > 0 ? (
                    user.clientNames.map(cn => (
                      <span key={cn} className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-wider shadow-sm text-white">{cn}</span>
                    ))
                  ) : (
                    <span>Baccarim Engenharia</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex justify-end relative z-10">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center space-x-3 border border-white/10"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle text-lg"></i>
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Preferências do Sistema - Dark Glass Card */}
          <div className="bg-[#0b1120] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
            <h3 className="text-xl font-black text-white mb-8 flex items-center space-x-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg border border-white/10">
                <i className="fas fa-sliders text-white text-lg"></i>
              </div>
              <span className="tracking-tight">Preferências do Sistema</span>
            </h3>
            
            <div className="space-y-4 relative z-10">
              {/* Notificações */}
              <div 
                onClick={() => setFormData({...formData, receiveNotifications: !formData.receiveNotifications})}
                className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <i className="fas fa-bell text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Notificações por E-mail</p>
                    <p className="text-[10px] text-blue-200/50 font-semibold uppercase tracking-wider mt-1">Alertas de vencimento e mensagens</p>
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${formData.receiveNotifications ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}>
                  <div className={`absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.receiveNotifications ? 'left-[33px]' : 'left-[3px]'}`}></div>
                </div>
              </div>

              {/* Visão Compacta */}
              <div 
                onClick={() => setFormData({...formData, compactView: !formData.compactView})}
                className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner border border-indigo-500/30 group-hover:scale-110 transition-transform">
                    <i className="fas fa-table-list text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Visualização Compacta</p>
                    <p className="text-[10px] text-blue-200/50 font-semibold uppercase tracking-wider mt-1">Otimizar espaço em tabelas</p>
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${formData.compactView ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}>
                  <div className={`absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.compactView ? 'left-[33px]' : 'left-[3px]'}`}></div>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner border border-amber-500/30 group-hover:scale-110 transition-transform">
                    <i className="fas fa-mobile-screen-button text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Avisos no Celular</p>
                    <p className="text-[10px] text-blue-200/50 font-semibold uppercase tracking-wider mt-1">Receber Push de Prazos</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushStatus === 'loading' || pushStatus === 'success'}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                    pushStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 
                    pushStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    pushStatus === 'loading' ? 'bg-white/5 text-white/50 cursor-wait border border-white/10' :
                    'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  {pushStatus === 'success' ? 'Ativado ✓' : pushStatus === 'error' ? 'Bloqueado' : pushStatus === 'loading' ? 'Ativando...' : 'Habilitar'}
                </button>
              </div>

              {/* Tema Claro/Escuro */}
              <div 
                onClick={toggleTheme}
                className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center shadow-inner border border-violet-500/30 group-hover:scale-110 transition-transform">
                    <i className={`fas ${isLightMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Tema Global: {isLightMode ? 'Claro' : 'Escuro'}</p>
                    <p className="text-[10px] text-blue-200/50 font-semibold uppercase tracking-wider mt-1">Alternar cor de fundo do app</p>
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${isLightMode ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}>
                  <div className={`absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isLightMode ? 'left-[33px]' : 'left-[3px]'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar do Perfil - Dark Glass Cards */}
        <div className="space-y-6">
          
          {/* Nível de Acesso */}
          <div className="bg-[#0b1120] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/10 group hover:border-white/20 transition-all">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
            <h4 className="text-[10px] font-bold text-blue-200/50 uppercase tracking-widest mb-6 flex items-center">
              <i className="fas fa-sitemap mr-2"></i>Nível de Acesso
            </h4>
            <div className="flex items-start space-x-5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform">
                <i className={`fas ${user.role === 'admin' ? 'fa-shield-halved text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]' : user.role === 'engineer' ? 'fa-helmet-safety text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'fa-building-user text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'}`}></i>
              </div>
              <div>
                <p className="text-base font-black text-white">
                  {user.role === 'admin' ? 'Administrador' : user.role === 'engineer' ? 'Engenheiro' : 'Cliente'}
                </p>
                <p className="text-[10px] text-blue-200/60 font-bold uppercase tracking-widest mt-1">
                  Acesso {user.role === 'admin' ? 'Total' : user.role === 'engineer' ? 'Técnico' : 'Restrito'}
                </p>
              </div>
            </div>
            <div className="mt-8 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-blue-100/70 leading-relaxed font-medium">
              {user.role === 'admin' 
                ? 'Privilégios de edição completa de licenças, contratos e checklists em todos os projetos.' 
                : user.role === 'engineer'
                ? 'Acesso técnico para gerenciar projetos, checklists e laudos fotográficos.'
                : 'Visualização técnica dos seus empreendimentos e notificações.'}
            </div>
          </div>

          {/* Segurança */}
          <div className="bg-[#0b1120] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-center relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
            <h4 className="text-[10px] font-bold text-blue-200/50 uppercase tracking-widest mb-6 relative z-10">Segurança da Conta</h4>
            
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform relative z-10">
              <i className="fas fa-lock"></i>
            </div>
            
            <p className="text-base font-black text-white relative z-10">Proteção Ativa</p>
            <p className="text-[10px] text-blue-200/60 mt-1 uppercase tracking-widest font-bold relative z-10">Login: {new Date().toLocaleDateString('pt-BR')}</p>
            
            <button className="mt-6 w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-sm relative z-10">
              Alterar Senha
            </button>
          </div>

          {/* Backup */}
          {(user.role === 'admin' || user.role === 'engineer') && (
            <div className="bg-[#0b1120] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-center group hover:border-white/20 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
              
              <h4 className="text-[10px] font-bold text-blue-200/50 uppercase tracking-widest mb-6 relative z-10">Backup Local</h4>
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform relative z-10">
                <i className="fas fa-database"></i>
              </div>
              
              <p className="text-base font-black text-white relative z-10">Exportar Dados</p>
              <p className="text-[10px] text-blue-200/60 mt-1 uppercase tracking-widest font-bold relative z-10">Cópia offline segura</p>
              
              <div className="grid grid-cols-1 gap-3 mt-6 relative z-10">
                <button 
                  onClick={handleExportData}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  Download JSON
                </button>
                <button 
                  onClick={handleExportZip}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 border border-blue-400/30"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <i className="fas fa-file-zipper text-sm"></i>
                  )}
                  <span>Baixar Arquivos (ZIP)</span>
                </button>
              </div>
            </div>
          )}

          {/* Instalar App (Modern Gradient Card) */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 rounded-[2.5rem] p-8 border border-white/20 shadow-[0_10px_40px_rgba(124,58,237,0.3)] text-center text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-10 -mb-10 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                <i className="fas fa-mobile-screen-button drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"></i>
              </div>
              <p className="text-xl font-black">Instalar no Celular</p>
              <p className="text-[10px] text-fuchsia-100 mt-2 mb-8 uppercase tracking-widest font-bold">Experiência nativa offline</p>
              
              {isInstalled ? (
                <div className="py-4 px-4 bg-white/20 backdrop-blur-md rounded-xl text-[11px] font-black uppercase tracking-widest text-white border border-white/40 shadow-inner">
                  <i className="fas fa-check-circle mr-2 text-emerald-300"></i>App Instalado
                </div>
              ) : (
                <button
                  onClick={handleInstallApp}
                  className="w-full py-4 bg-white text-purple-900 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all flex justify-center items-center"
                >
                  <i className="fas fa-download mr-2 text-sm"></i>Baixar PWA
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

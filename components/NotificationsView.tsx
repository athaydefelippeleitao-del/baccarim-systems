import React, { useState, useMemo, useCallback } from 'react';
import { Notification, NotificationSeverity, Attachment, Project, User } from '../types';
import { generateNotificationDraft, createNotificationFromText } from '../services/openaiClient';
import { downloadFile, convertPdfToImages } from '../utils/fileUtils';
import { getNotificationFiles } from '../services/supabaseService';

interface NotificationsViewProps {
  currentUser: User;
  notifications: Notification[];
  clients: string[];
  projects: Project[];
  onAddNotification: (notif: Notification) => void;
  onUpdateNotification: (notif: Notification) => void;
  onDeleteNotification: (id: string) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ currentUser, notifications, clients, projects, onAddNotification, onUpdateNotification, onDeleteNotification }) => {
  const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('Open');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Notificação' | 'Licença'>('All');
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiCreating, setAiCreating] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiDragOver, setAiDragOver] = useState(false);
  const [aiToast, setAiToast] = useState<string | null>(null);
  const aiFileInputRef = React.useRef<HTMLInputElement>(null);
  const aiDirectFileRef = React.useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [pushSendingId, setPushSendingId] = useState<string | null>(null);
  const [pushSentIds, setPushSentIds] = useState<Record<string, boolean>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Track which notifications have had their files loaded from Supabase
  const [loadedFiles, setLoadedFiles] = useState<Record<string, Attachment[]>>({});
  const [loadingFilesId, setLoadingFilesId] = useState<string | null>(null);

  const [newNotifForm, setNewNotifForm] = useState({
    title: '',
    clientName: clients[0] || '',
    projectId: '',
    agency: 'SEMA',
    severity: 'Média' as NotificationSeverity,
    category: 'Notificação' as 'Notificação' | 'Licença',
    deadline: '',
    description: ''
  });

  const availableProjectsForClient = useMemo(() => {
    const normalize = (s: string) => s.trim().toLowerCase();
    return projects.filter(p => normalize(p.clientName) === normalize(newNotifForm.clientName));
  }, [projects, newNotifForm.clientName]);

  // Auto-select first project when client changes
  React.useEffect(() => {
    if (availableProjectsForClient.length > 0) {
      setNewNotifForm(prev => ({ ...prev, projectId: availableProjectsForClient[0].id }));
    } else {
      setNewNotifForm(prev => ({ ...prev, projectId: '' }));
    }
  }, [availableProjectsForClient]);

  const filtered = useMemo(() => {
    const parseDeadline = (d: string) => {
      // Format: DD/MM/YYYY
      if (!d) return Infinity;
      const parts = d.split('/');
      if (parts.length !== 3) return Infinity;
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    };
    return notifications
      .filter(n => filter === 'All' || n.status === filter)
      .filter(n => {
        if (categoryFilter === 'All') {
          // 'Todos' mostra tudo (Notificações e Licenças)
          return true;
        }
        if (categoryFilter === 'Notificação') {
          return n.category === 'Notificação' || !n.category;
        }
        return n.category === 'Licença';
      })
      .sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
  }, [notifications, filter, categoryFilter]);

  const stats = useMemo(() => ({
    open: notifications.filter(n => n.status === 'Open').length,
    high: notifications.filter(n => n.status === 'Open' && n.severity === 'Alta').length,
    resolved: notifications.filter(n => n.status === 'Resolved').length
  }), [notifications]);

  const handleToggleStatus = (notif: Notification) => {
    onUpdateNotification({
      ...notif,
      status: notif.status === 'Open' ? 'Resolved' : 'Open'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, notif: Notification) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supabase has a request size limit. Base64 adds ~33% overhead.
    // Limit files to 3MB to prevent silent backend failures.
    if (file.size > 3 * 1024 * 1024) {
      alert(`O arquivo "${file.name}" é muito grande! Por favor, anexe arquivos de até 3MB. (Seu arquivo tem ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = {
        fileName: file.name,
        fileData: base64Data,
        fileDate: dateStr
      };

      const currentFiles = loadedFiles[notif.id] !== undefined ? loadedFiles[notif.id] : (notif.attachedFiles || []);
      const updatedFiles = [...currentFiles, newAttachment];

      // Update both local loaded files and main state
      setLoadedFiles(prev => ({ ...prev, [notif.id]: updatedFiles }));
      
      onUpdateNotification({
        ...notif,
        attachedFiles: updatedFiles
      });
      
      setActiveUploadId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Lazy-load files for a notification then trigger file picker
  const handleAddFileClick = useCallback(async (notif: Notification) => {
    setActiveUploadId(notif.id);
    // If files not yet loaded for this notif, fetch from DB
    if (!(notif.id in loadedFiles)) {
      setLoadingFilesId(notif.id);
      const files = await getNotificationFiles(notif.id);
      setLoadedFiles(prev => ({ ...prev, [notif.id]: files }));
      // Merge loaded files into the notification state
      if (files.length > 0 && (notif.attachedFiles || []).length === 0) {
        onUpdateNotification({ ...notif, attachedFiles: files });
      }
      setLoadingFilesId(null);
    }
    fileInputRef.current?.click();
  }, [loadedFiles, onUpdateNotification]);

  const handleRemoveAttachment = (notif: Notification, fileIndex: number) => {
    const currentFiles = notif.attachedFiles || [];
    const updatedFiles = currentFiles.filter((_, idx) => idx !== fileIndex);
    
    setLoadedFiles(prev => ({ ...prev, [notif.id]: updatedFiles }));
    
    onUpdateNotification({
      ...notif,
      attachedFiles: updatedFiles
    });
  };

  const handleCreateOrUpdateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedDeadline = newNotifForm.deadline;
    if (newNotifForm.deadline.includes('-')) {
      formattedDeadline = newNotifForm.deadline.split('-').reverse().join('/');
    }

    if (editingNotifId) {
      const existingNotif = notifications.find(n => n.id === editingNotifId);
      if (existingNotif) {
        onUpdateNotification({
          ...existingNotif,
          title: newNotifForm.title,
          clientName: newNotifForm.clientName,
          projectId: newNotifForm.projectId,
          agency: newNotifForm.agency,
          severity: newNotifForm.severity,
          category: newNotifForm.category,
          deadline: formattedDeadline,
          description: newNotifForm.description
        });
      }
    } else {
      const newNotif: Notification = {
        id: `n-${Date.now()}`,
        title: newNotifForm.title,
        clientName: newNotifForm.clientName,
        projectId: newNotifForm.projectId,
        agency: newNotifForm.agency,
        severity: newNotifForm.severity,
        category: newNotifForm.category,
        deadline: formattedDeadline,
        description: newNotifForm.description,
        dateReceived: new Date().toLocaleDateString('pt-BR'),
        status: 'Open',
        attachedFiles: []
      };
      onAddNotification(newNotif);
    }

    setShowAddModal(false);
    setEditingNotifId(null);
    setNewNotifForm({
      title: '',
      clientName: clients[0] || '',
      projectId: '',
      agency: 'SEMA',
      severity: 'Média',
      category: 'Notificação',
      deadline: '',
      description: ''
    });
  };

  const handleEditClick = (notif: Notification) => {
    let formattedDeadline = '';
    if (notif.deadline) {
      // Convert DD/MM/YYYY to YYYY-MM-DD
      const parts = notif.deadline.split('/');
      if (parts.length === 3) formattedDeadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    setNewNotifForm({
      title: notif.title,
      clientName: notif.clientName,
      projectId: notif.projectId || '',
      agency: notif.agency,
      severity: notif.severity,
      category: notif.category || 'Notificação',
      deadline: formattedDeadline,
      description: notif.description
    });
    setEditingNotifId(notif.id);
    setShowAddModal(true);
  };

  const generateAiDraft = async (notif: Notification) => {
    setAiLoadingId(notif.id);
    try {
      const draft = await generateNotificationDraft(notif.agency, notif.description, notif.clientName);
      onUpdateNotification({ ...notif, responseDraft: draft });
    } catch (e) {
      console.error("AI Generation failed", e);
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleAiCreate = async (file: File) => {
    if (!file) return;
    setAiCreating(true);
    setAiToast(`Analisando "${file.name}"...`);
    try {
      const originalBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      let dataUrisForAi: string[] = [];
      if (file.type === 'application/pdf') {
        dataUrisForAi = await convertPdfToImages(file, 4);
      } else {
        dataUrisForAi = [originalBase64];
      }

      const projectsForAI = projects.map(p => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName,
        razaoSocial: p.razaoSocial,
        cnpj: p.cnpj,
        processNumber: p.specs?.numeroProtocolo || '',
      }));

      const res = await fetch('/api/openai/analyze-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUris: dataUrisForAi, projects: projectsForAI }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const result = json.result || {};

      const matchedProject = result.matchedProjectId
        ? projects.find(p => p.id === result.matchedProjectId)
        : null;

      // Format deadline from YYYY-MM-DD to DD/MM/YYYY
      let formattedDeadline = '';
      
      let dateObj: Date | null = null;
      if (result.explicitDeadline) {
        const parts = result.explicitDeadline.split('-');
        if (parts.length === 3) dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else if (result.issueDate) {
        const parts = result.issueDate.split('-');
        if (parts.length === 3) {
          dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          
          if (result.category === 'Licença' && result.validityMonths) {
            // Use regex to safely extract just the number, in case AI returned "72 meses"
            const match = String(result.validityMonths).match(/\d+/);
            const months = match ? Number(match[0]) : 0;
            if (months > 0) {
              dateObj.setMonth(dateObj.getMonth() + months);
              dateObj.setDate(dateObj.getDate() - 120);
            }
          } else if (result.category === 'Notificação' && result.deadlineDays) {
            const match = String(result.deadlineDays).match(/\d+/);
            const days = match ? Number(match[0]) : 0;
            if (days > 0) {
              dateObj.setDate(dateObj.getDate() + days);
            }
          }
        }
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        formattedDeadline = `${d}/${m}/${y}`;
      }

      // Create the attachment object with the original file, NOT the image converted for AI
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = {
        fileName: file.name,
        fileData: originalBase64,
        fileDate: dateStr
      };

      const newNotif: Notification = {
        id: `n-${Date.now()}`,
        title: result.title || 'Notificação sem título',
        clientName: matchedProject?.clientName || result.matchedClientName || '',
        projectId: matchedProject?.id || '',
        agency: result.agency || 'SEMA',
        severity: (['Alta', 'Média', 'Baixa'].includes(result.severity) ? result.severity : 'Média') as NotificationSeverity,
        category: (result.category === 'Licença' ? 'Licença' : 'Notificação') as 'Notificação' | 'Licença',
        deadline: formattedDeadline || '',
        description: result.description || '',
        dateReceived: new Date().toLocaleDateString('pt-BR'),
        status: 'Open',
        attachedFiles: [newAttachment]
      };

      onAddNotification(newNotif);
      setAiToast('✓ Notificação criada com sucesso!');
      setTimeout(() => setAiToast(null), 3000);
      setAiMode(false);
      setAiFile(null);
      setShowAddModal(false);
    } catch (e) {
      console.error('AI create failed', e);
      setAiToast(null);
      alert('Erro ao processar com IA. Tente novamente.');
    } finally {
      setAiCreating(false);
      // Reset file input
      if (aiDirectFileRef.current) aiDirectFileRef.current.value = '';
      if (aiFileInputRef.current) aiFileInputRef.current.value = '';
    }
  };

  const triggerManualPush = async (notifId: string) => {
    setPushSendingId(notifId);
    try {
      const notif = notifications.find(n => n.id === notifId);
      
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          title: 'Alerta de Prazo',
          message: `Lembrete: Notificação "${notif?.title || 'Pendência'}" pendente.`
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar push via servidor');
      }
      
      if (data.count === 0) {
        alert('Nenhum aparelho registrado. Ative as notificações no perfil (botão azul) pelo celular primeiro!');
      } else {
        setPushSentIds(prev => ({ ...prev, [notifId]: true }));
        setTimeout(() => {
          setPushSentIds(prev => ({ ...prev, [notifId]: false }));
        }, 3000);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao solicitar notificação ao servidor.');
    } finally {
      setPushSendingId(null);
    }
  };

  const getSeverityColor = (sev: NotificationSeverity) => {
    switch (sev) {
      case 'Alta': return 'bg-baccarim-rose';
      case 'Média': return 'bg-baccarim-amber';
      case 'Baixa': return 'bg-baccarim-green';
      default: return 'bg-baccarim-text-muted';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* AI Toast Overlay */}
      {aiToast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-300 ${aiToast.startsWith('✓') ? 'bg-baccarim-green' : 'bg-baccarim-blue'}`}>
          {aiToast.startsWith('✓') ? (
            <i className="fas fa-check-circle text-lg"></i>
          ) : (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
          <span>{aiToast}</span>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const notif = notifications.find(n => n.id === activeUploadId);
          if (notif) handleFileUpload(e, notif);
        }}
      />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-baccarim-blue text-[10px] font-black uppercase tracking-[0.3em] mb-1">
            <i className="fas fa-bell text-[10px]"></i>
            <span>Gestão Ambiental</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Centro de Notificações</h2>
          <p className="text-slate-400 text-sm font-medium mt-0.5">Controle de exigências e complementações da SEMA/IAT.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {(['All', 'Notificação', 'Licença'] as const).map(f => (
              <button
                key={f}
                onClick={() => setCategoryFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === f ? 'bg-baccarim-amber text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'All' ? 'Todos' : f === 'Notificação' ? 'Notificações' : 'Licenças'}
              </button>
            ))}
          </div>
          <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {(['All', 'Open', 'Resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-baccarim-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'All' ? 'Todas' : f === 'Open' ? 'Pendentes' : 'Resolvidas'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAiMode(false); setEditingNotifId(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-baccarim-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
          >
            <i className="fas fa-plus"></i> Nova Notificação
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-base shadow-sm shrink-0">
            <i className="fas fa-bolt"></i>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Urgência Alta</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{stats.high}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-base shadow-sm shrink-0">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pendentes</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{stats.open}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-base shadow-sm shrink-0">
            <i className="fas fa-check-double"></i>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Resolvidas</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{stats.resolved}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(notif => (
          <div key={notif.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${notif.status === 'Resolved' ? 'opacity-55 grayscale-[0.4] border-slate-100' : 'border-slate-100 hover:border-slate-200'}`}>
            {/* Left severity bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${getSeverityColor(notif.severity)}`}></div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-5 p-5 pl-6">
              {/* Main content */}
              <div className="flex-1 space-y-3 min-w-0">
                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-[8px] font-black uppercase text-slate-500 border border-slate-100 tracking-wider">{notif.agency}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase text-white tracking-wider ${getSeverityColor(notif.severity)}`}>
                    {notif.severity === 'Alta' ? '🔴' : notif.severity === 'Média' ? '🟡' : '🟢'} {notif.severity}
                  </span>
                  {notif.category && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-[8px] font-black uppercase text-slate-500 border border-slate-100 tracking-wider">{notif.category}</span>
                  )}
                  <span className="ml-auto text-[9px] font-bold text-slate-300">{notif.dateReceived}</span>
                </div>

                {/* Title & client */}
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight group-hover:text-baccarim-blue transition-colors leading-snug">{notif.title}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{notif.clientName}</p>
                    {notif.projectId && (
                      <>
                        <span className="text-slate-200">•</span>
                        <p className="text-[9px] font-bold text-baccarim-blue uppercase tracking-wider">
                          {projects.find(p => p.id === notif.projectId)?.name || 'Projeto Vinc.'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {notif.description && (
                  <div className="bg-slate-50/70 px-3.5 py-2.5 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic truncate">"{notif.description}"</p>
                  </div>
                )}

                {/* Anexos */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider">Anexos:</span>
                  <button
                    onClick={() => handleAddFileClick(notif)}
                    disabled={loadingFilesId === notif.id}
                    className="text-[9px] font-bold text-baccarim-blue hover:bg-blue-50 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingFilesId === notif.id ? '⏳...' : '+ Arquivo'}
                  </button>
                  {notif.attachedFiles !== undefined ? (
                    <>
                      {notif.attachedFiles.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg animate-in slide-in-from-left-2">
                          <i className="fas fa-file-pdf text-rose-400 text-[9px]"></i>
                          <button
                            onClick={() => downloadFile(file)}
                            className="text-[8px] font-bold text-slate-600 hover:text-baccarim-blue truncate max-w-[100px]"
                          >
                            {file.fileName}
                          </button>
                          <button
                            onClick={() => handleRemoveAttachment(notif, fIdx)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <i className="fas fa-times text-[8px]"></i>
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <button
                      onClick={async () => {
                        setLoadingFilesId(notif.id);
                        import('../services/supabaseService').then(async (s) => {
                          const files = await s.getNotificationFiles(notif.id);
                          setLoadedFiles(prev => ({ ...prev, [notif.id]: files }));
                          onUpdateNotification({ ...notif, attachedFiles: files });
                          setLoadingFilesId(null);
                        });
                      }}
                      disabled={loadingFilesId === notif.id}
                      className="text-[8px] font-bold text-amber-500 hover:bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <i className="fas fa-cloud-download-alt"></i> {loadingFilesId === notif.id ? 'Carregando...' : 'Ver Anexos'}
                    </button>
                  )}
                </div>

                {/* AI Draft */}
                {notif.responseDraft && (
                  <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 space-y-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[8px] font-black text-baccarim-blue uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fas fa-robot text-[10px]"></i> Sugestão IA
                      </h4>
                      <button onClick={() => onUpdateNotification({ ...notif, responseDraft: undefined })} className="text-slate-300 hover:text-red-500 transition-colors text-xs"><i className="fas fa-times"></i></button>
                    </div>
                    <div className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium max-h-24 overflow-y-auto custom-scrollbar">
                      {notif.responseDraft}
                    </div>
                    <button className="text-[8px] font-black text-white bg-baccarim-blue px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-baccarim-green transition-all">Copiar</button>
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <div className="lg:w-52 space-y-2.5 shrink-0">
                {/* Deadline */}
                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Prazo Fatal</p>
                  <p className={`text-lg font-black leading-none ${notif.status === 'Open' ? 'text-rose-500' : 'text-slate-400'}`}>{notif.deadline || '—'}</p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleToggleStatus(notif)}
                  className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${notif.status === 'Open' ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                >
                  {notif.status === 'Open' ? <><i className="fas fa-check mr-1.5"></i>Marcar Resolvida</> : <><i className="fas fa-redo mr-1.5"></i>Reabrir</>}
                </button>

                {!notif.responseDraft && notif.status === 'Open' && (
                  <button
                    onClick={() => generateAiDraft(notif)}
                    disabled={aiLoadingId === notif.id}
                    className="w-full py-2.5 bg-baccarim-blue text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                  >
                    {aiLoadingId === notif.id ? (
                      <><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div><span>Analisando...</span></>
                    ) : (
                      <><i className="fas fa-wand-magic-sparkles text-[9px]"></i><span>Análise IA</span></>
                    )}
                  </button>
                )}

                {notif.status === 'Open' && (
                  <button
                    onClick={() => triggerManualPush(notif.id)}
                    disabled={pushSendingId === notif.id}
                    className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      pushSentIds[notif.id]
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 text-white hover:bg-amber-500 shadow-sm shadow-amber-200'
                    }`}
                  >
                    {pushSendingId === notif.id ? (
                      <><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div><span>Enviando...</span></>
                    ) : pushSentIds[notif.id] ? (
                      <><i className="fas fa-check-double"></i><span>Enviada!</span></>
                    ) : (
                      <><i className="fas fa-paper-plane"></i><span>Push Celular</span></>
                    )}
                  </button>
                )}

                <div className="flex gap-1.5 pt-1">
                  <button onClick={() => handleEditClick(notif)} className="flex-1 py-2 text-baccarim-blue hover:bg-blue-50 text-[8px] font-black uppercase tracking-wider transition-all rounded-xl border border-slate-100 hover:border-blue-100">
                    <i className="fas fa-pencil mr-1"></i>Editar
                  </button>
                  <button onClick={() => onDeleteNotification(notif.id)} className="flex-1 py-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 text-[8px] font-black uppercase tracking-wider transition-all rounded-xl border border-slate-100 hover:border-rose-100">
                    <i className="fas fa-trash mr-1"></i>Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <i className="fas fa-clipboard-check text-3xl text-slate-200 mb-3"></i>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tudo limpo! Nenhuma notificação pendente.</p>
          </div>
        )}
      </div>

      {/* Modal Nova Notificação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 relative overflow-y-auto max-h-[90vh] border border-baccarim-border-hover pb-safe">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-baccarim-text">{editingNotifId ? 'Editar Registro' : 'Nova Notificação SEMA/IAT'}</h3>
            </div>

            {/* AI MODE: File Upload */}
            {aiMode && !editingNotifId && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <input
                  ref={aiFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setAiFile(f); handleAiCreate(f); } }}
                />
                <div className="bg-gradient-to-br from-baccarim-blue/10 to-purple-500/10 border border-baccarim-blue/30 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-baccarim-blue/20 text-baccarim-blue flex items-center justify-center">
                      <i className="fas fa-robot text-lg"></i>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-baccarim-blue uppercase tracking-widest">Criação Automática com IA</p>
                      <p className="text-[10px] text-baccarim-text-muted">Anexe o arquivo — a IA preenche tudo automaticamente</p>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => !aiCreating && aiFileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setAiDragOver(true); }}
                    onDragLeave={() => setAiDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setAiDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) { setAiFile(f); handleAiCreate(f); }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all ${
                      aiCreating
                        ? 'border-baccarim-blue bg-baccarim-blue/10 cursor-wait'
                        : aiDragOver
                          ? 'border-baccarim-blue bg-baccarim-blue/10 scale-[1.01] cursor-copy'
                          : 'border-baccarim-blue/40 hover:border-baccarim-blue hover:bg-baccarim-blue/5 cursor-pointer'
                    }`}
                  >
                    {aiCreating ? (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-baccarim-blue/20 text-baccarim-blue flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-baccarim-blue/30 border-t-baccarim-blue rounded-full animate-spin"></div>
                        </div>
                        <p className="text-[12px] font-black text-baccarim-blue text-center animate-pulse">Analisando documento com IA...</p>
                        <p className="text-[10px] text-baccarim-text-muted">{aiFile?.name}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-baccarim-blue/10 text-baccarim-blue flex items-center justify-center">
                          <i className="fas fa-cloud-arrow-up text-2xl"></i>
                        </div>
                        <p className="text-[12px] font-black text-baccarim-text-muted text-center">Arraste ou clique para anexar</p>
                        <p className="text-[10px] text-baccarim-text-muted/60">PDF, PNG, JPG — a IA preenche os campos sozinha</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateOrUpdateNotification} className="space-y-6 pb-20">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Título da Exigência</label>
                <input
                  required
                  value={newNotifForm.title}
                  onChange={e => setNewNotifForm({ ...newNotifForm, title: e.target.value })}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text"
                  placeholder="Ex: Complementação Técnica LI"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Cliente</label>
                  <select
                    required
                    value={newNotifForm.clientName}
                    onChange={e => setNewNotifForm({ ...newNotifForm, clientName: e.target.value })}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text appearance-none"
                  >
                    {clients.map(c => <option key={c} value={c} className="bg-baccarim-card">{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Empreendimento (Projeto)</label>
                  <select
                    required
                    value={newNotifForm.projectId}
                    onChange={e => setNewNotifForm({ ...newNotifForm, projectId: e.target.value })}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text appearance-none"
                  >
                    <option value="" disabled>Selecione um projeto</option>
                    {availableProjectsForClient.map(p => (
                      <option key={p.id} value={p.id} className="bg-baccarim-card">{p.name}</option>
                    ))}
                    {availableProjectsForClient.length === 0 && (
                      <option value="" disabled className="bg-baccarim-card italic">Nenhum projeto encontrado</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Órgão</label>
                  <input
                    required
                    value={newNotifForm.agency}
                    onChange={e => setNewNotifForm({ ...newNotifForm, agency: e.target.value })}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Prazo Fatal</label>
                  <input
                    type="date"
                    required
                    value={newNotifForm.deadline}
                    onChange={e => setNewNotifForm({ ...newNotifForm, deadline: e.target.value })}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Severidade</label>
                  <div className="flex gap-2">
                    {(['Baixa', 'Média', 'Alta'] as NotificationSeverity[]).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setNewNotifForm({ ...newNotifForm, severity: sev })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newNotifForm.severity === sev
                          ? `${getSeverityColor(sev)} text-baccarim-text border-transparent shadow-lg`
                          : 'bg-baccarim-hover text-baccarim-text-muted border-baccarim-border'
                          }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Categoria</label>
                  <div className="flex gap-2">
                    {(['Notificação', 'Licença'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewNotifForm({ ...newNotifForm, category: cat })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newNotifForm.category === cat
                          ? 'bg-baccarim-blue text-white border-transparent shadow-lg'
                          : 'bg-baccarim-hover text-baccarim-text-muted border-baccarim-border'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Descrição Detalhada</label>
                <textarea
                  required
                  value={newNotifForm.description}
                  onChange={e => setNewNotifForm({ ...newNotifForm, description: e.target.value })}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text h-24 resize-none"
                  placeholder="Descreva o que foi solicitado pelo órgão..."
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-baccarim-blue text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-green transition-all">{editingNotifId ? 'Salvar Alterações' : 'Registrar Notificação'}</button>
                <button type="button" onClick={() => { setShowAddModal(false); setEditingNotifId(null); }} className="px-8 bg-baccarim-hover text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-active transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;


import React, { useState, useMemo } from 'react';
import { Notification, NotificationSeverity, Attachment, Project } from '../types';
import { generateNotificationDraft } from '../services/openaiClient';
import { downloadFile } from '../utils/fileUtils';

interface NotificationsViewProps {
  notifications: Notification[];
  clients: string[];
  projects: Project[];
  onAddNotification: (notif: Notification) => void;
  onUpdateNotification: (notif: Notification) => void;
  onDeleteNotification: (id: string) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, clients, projects, onAddNotification, onUpdateNotification, onDeleteNotification }) => {
  const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('Open');
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [newNotifForm, setNewNotifForm] = useState({
    title: '',
    clientName: clients[0] || '',
    projectId: '',
    agency: 'SEMA',
    severity: 'Média' as NotificationSeverity,
    deadline: '',
    description: ''
  });

  const availableProjectsForClient = useMemo(() => {
    return projects.filter(p => p.clientName === newNotifForm.clientName);
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
    return notifications.filter(n => filter === 'All' || n.status === filter);
  }, [notifications, filter]);

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = {
        fileName: file.name,
        fileData: base64Data,
        fileDate: dateStr
      };

      onUpdateNotification({
        ...notif,
        attachedFiles: [...(notif.attachedFiles || []), newAttachment]
      });
      setActiveUploadId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (notif: Notification, fileName: string) => {
    onUpdateNotification({
      ...notif,
      attachedFiles: notif.attachedFiles?.filter(f => f.fileName !== fileName)
    });
  };

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDeadline = newNotifForm.deadline.split('-').reverse().join('/');

    const newNotif: Notification = {
      id: `n-${Date.now()}`,
      title: newNotifForm.title,
      clientName: newNotifForm.clientName,
      projectId: newNotifForm.projectId,
      agency: newNotifForm.agency,
      severity: newNotifForm.severity,
      deadline: formattedDeadline,
      description: newNotifForm.description,
      dateReceived: new Date().toLocaleDateString('pt-BR'),
      status: 'Open',
      attachedFiles: []
    };

    onAddNotification(newNotif);
    setShowAddModal(false);
    setNewNotifForm({
      title: '',
      clientName: clients[0] || '',
      projectId: '',
      agency: 'SEMA',
      severity: 'Média',
      deadline: '',
      description: ''
    });
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
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const notif = notifications.find(n => n.id === activeUploadId);
          if (notif) handleFileUpload(e, notif);
        }}
      />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-baccarim-text tracking-tight">Centro de Notificações</h2>
          <p className="text-baccarim-text-muted font-medium">Controle de exigências e complementações da SEMA/IAT.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex bg-baccarim-hover p-1 rounded-2xl shadow-sm border border-baccarim-border-hover">
            {(['All', 'Open', 'Resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-baccarim-blue text-baccarim-text shadow-md' : 'text-baccarim-text-muted hover:text-baccarim-text hover:bg-baccarim-hover'}`}
              >
                {f === 'All' ? 'Todas' : f === 'Open' ? 'Pendentes' : 'Resolvidas'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-8 py-3.5 bg-baccarim-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-green/20 hover:-translate-y-1 transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Nova Notificação
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-baccarim-card p-6 rounded-[2rem] border border-baccarim-border flex items-center space-x-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-baccarim-rose/10 text-baccarim-rose flex items-center justify-center text-xl shadow-sm"><i className="fas fa-bolt"></i></div>
          <div>
            <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Urgência Alta</p>
            <p className="text-xl font-black text-baccarim-text">{stats.high}</p>
          </div>
        </div>
        <div className="bg-baccarim-card p-6 rounded-[2rem] border border-baccarim-border flex items-center space-x-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-baccarim-amber/10 text-baccarim-amber flex items-center justify-center text-xl shadow-sm"><i className="fas fa-hourglass-half"></i></div>
          <div>
            <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Total Pendentes</p>
            <p className="text-xl font-black text-baccarim-text">{stats.open}</p>
          </div>
        </div>
        <div className="bg-baccarim-card p-6 rounded-[2rem] border border-baccarim-border flex items-center space-x-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-baccarim-green/10 text-baccarim-green flex items-center justify-center text-xl shadow-sm"><i className="fas fa-check-double"></i></div>
          <div>
            <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Resolvidas (Ciclo)</p>
            <p className="text-xl font-black text-baccarim-text">{stats.resolved}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map(notif => (
          <div key={notif.id} className={`bg-baccarim-card rounded-[2.5rem] border p-8 shadow-2xl transition-all hover:shadow-baccarim-blue/5 relative overflow-hidden group ${notif.status === 'Resolved' ? 'opacity-60 grayscale-[0.5]' : 'border-baccarim-border'}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${getSeverityColor(notif.severity)}`}></div>

            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-baccarim-hover px-3 py-1 rounded-lg text-[8px] font-black uppercase text-baccarim-text-muted">{notif.agency}</span>
                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase text-baccarim-text ${getSeverityColor(notif.severity)}`}>Severidade {notif.severity}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-baccarim-text tracking-tight group-hover:text-baccarim-blue transition-colors">{notif.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <p className="text-[9px] font-black text-baccarim-text opacity-70 uppercase tracking-widest">{notif.clientName}</p>
                    <span className="text-[9px] text-baccarim-text opacity-30">•</span>
                    {notif.projectId && (
                      <>
                        <p className="text-[9px] font-black text-baccarim-blue uppercase tracking-widest">
                          {projects.find(p => p.id === notif.projectId)?.name || 'Projeto Vinc.'}
                        </p>
                        <span className="text-[9px] text-baccarim-text opacity-30">•</span>
                      </>
                    )}
                    <p className="text-[9px] font-black text-baccarim-text opacity-70 uppercase tracking-widest">Recebida em {notif.dateReceived}</p>
                  </div>
                </div>
                <div className="bg-baccarim-hover p-5 rounded-2xl border border-baccarim-border">
                  <p className="text-xs text-baccarim-text-muted font-medium leading-relaxed italic">"{notif.description}"</p>
                </div>

                {/* Anexos da Notificação */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Documentos Anexos</h4>
                    <button
                      onClick={() => { setActiveUploadId(notif.id); fileInputRef.current?.click(); }}
                      className="text-[9px] font-black text-baccarim-blue hover:underline uppercase tracking-widest"
                    >
                      + Adicionar Arquivo
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notif.attachedFiles?.map((file, fIdx) => (
                      <div key={fIdx} className="flex items-center space-x-2 bg-baccarim-hover border border-baccarim-border px-3 py-1.5 rounded-xl shadow-sm animate-in slide-in-from-left-2">
                        <i className="fas fa-file-pdf text-baccarim-rose text-[10px]"></i>
                        <button
                          onClick={() => downloadFile(file)}
                          className="text-[9px] font-bold text-baccarim-text hover:text-baccarim-blue truncate max-w-[120px]"
                        >
                          {file.fileName}
                        </button>
                        <button
                          onClick={() => handleRemoveAttachment(notif, file.fileName)}
                          className="text-baccarim-text-muted hover:text-red-500 transition-colors"
                        >
                          <i className="fas fa-times-circle text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                    {(!notif.attachedFiles || notif.attachedFiles.length === 0) && (
                      <p className="text-[9px] text-baccarim-text-muted italic">Nenhum documento anexado.</p>
                    )}
                  </div>
                </div>

                {notif.responseDraft && (
                  <div className="bg-baccarim-blue/5 p-6 rounded-3xl border border-baccarim-blue/10 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-widest flex items-center">
                        <i className="fas fa-robot mr-2"></i> Sugestão de Resposta Gemini
                      </h4>
                      <button onClick={() => onUpdateNotification({ ...notif, responseDraft: undefined })} className="text-baccarim-text-muted hover:text-red-500 transition-colors"><i className="fas fa-times-circle"></i></button>
                    </div>
                    <div className="text-[11px] text-baccarim-text leading-relaxed whitespace-pre-wrap font-medium">
                      {notif.responseDraft}
                    </div>
                    <button className="text-[9px] font-black text-white bg-baccarim-blue px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-baccarim-green transition-all">Copiar Rascunho</button>
                  </div>
                )}
              </div>

              <div className="lg:w-72 space-y-4">
                <div className="bg-baccarim-hover p-5 rounded-2xl border border-baccarim-border text-center">
                  <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest mb-1">Prazo Fatal</p>
                  <p className={`text-lg font-black ${notif.status === 'Open' ? 'text-baccarim-rose' : 'text-baccarim-text-muted'}`}>{notif.deadline}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleToggleStatus(notif)}
                    className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${notif.status === 'Open' ? 'bg-baccarim-green text-white shadow-lg shadow-emerald-500/20' : 'bg-baccarim-hover text-baccarim-text-muted'}`}
                  >
                    {notif.status === 'Open' ? 'Marcar como Resolvida' : 'Reabrir Notificação'}
                  </button>

                  {!notif.responseDraft && notif.status === 'Open' && (
                    <button
                      onClick={() => generateAiDraft(notif)}
                      disabled={aiLoadingId === notif.id}
                      className="w-full py-4 bg-baccarim-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-baccarim-green transition-all flex items-center justify-center space-x-3"
                    >
                      {aiLoadingId === notif.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-baccarim-border/20 border-t-white rounded-full animate-spin"></div>
                          <span>Analisando...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-wand-magic-sparkles"></i>
                          <span>Análise Inteligente</span>
                        </>
                      )}
                    </button>
                  )}

                  <button onClick={() => onDeleteNotification(notif.id)} className="w-full py-3 text-baccarim-text-muted hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">Excluir Registro</button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-baccarim-card rounded-[3rem] border border-dashed border-baccarim-border-hover">
            <i className="fas fa-clipboard-check text-5xl text-baccarim-text/5 mb-4"></i>
            <p className="text-baccarim-text-muted font-bold uppercase tracking-widest text-[10px]">Tudo limpo! Nenhuma notificação pendente.</p>
          </div>
        )}
      </div>

      {/* Modal Nova Notificação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 relative overflow-y-auto max-h-[90vh] border border-baccarim-border-hover pb-safe">
            <h3 className="text-2xl font-black text-baccarim-text mb-8">Nova Notificação SEMA/IAT</h3>
            <form onSubmit={handleCreateNotification} className="space-y-6 pb-20">
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
                <button type="submit" className="flex-1 bg-baccarim-blue text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-green transition-all">Registrar Notificação</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 bg-baccarim-hover text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-active transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;

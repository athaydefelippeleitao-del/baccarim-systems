
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { EnvironmentalLicense, Notification, LicenseStatus, Attachment, LicenseType, User, Project } from '../types';
import { downloadFile } from '../utils/fileUtils';

interface AgendaViewProps {
  currentUser: User;
  clients: string[];
  projects: Project[];
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
  onAddNotification: (notif: Notification) => void;
  onUpdateNotification: (notif: Notification) => void;
  onUpdateLicense: (license: EnvironmentalLicense) => void;
  onDeleteNotification: (id: string) => void;
  onDeleteLicense: (id: string) => void;
}

type ConfirmConfig = {
  type: 'delete' | 'attachment';
  itemType: 'license' | 'notification';
  id: string;
  fileName?: string;
  title: string;
  message: string;
} | null;

const AgendaView: React.FC<AgendaViewProps> = ({ 
  currentUser, clients, projects, licenses, notifications, onAddNotification, onUpdateNotification, onUpdateLicense, onDeleteNotification, onDeleteLicense 
}) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string, type: 'license' | 'notification' } | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', deadline: '', clientName: clients[0] || '', projectId: '', agency: 'SEMA', description: '' });
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>(null);

  const availableProjectsForClient = useMemo(() => {
    return projects.filter(p => p.clientName === taskForm.clientName);
  }, [projects, taskForm.clientName]);

  // Auto-select first project when client changes in form
  useEffect(() => {
    if (!editingItem && availableProjectsForClient.length > 0) {
      setTaskForm(prev => ({ ...prev, projectId: availableProjectsForClient[0].id }));
    }
  }, [availableProjectsForClient, editingItem]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<{ id: string, type: 'license' | 'notification' } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUpload) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = { fileName: file.name, fileData: base64Data, fileDate: dateStr };
      
      if (activeUpload.type === 'notification') {
        const notif = notifications.find(n => n.id === activeUpload.id);
        if (notif) {
          const currentFiles = notif.attachedFiles || [];
          onUpdateNotification({ ...notif, attachedFiles: [...currentFiles, newAttachment] });
        }
      } else {
        const license = licenses.find(l => l.id === activeUpload.id);
        if (license) {
          const currentFiles = license.attachedFiles || [];
          onUpdateLicense({ ...license, attachedFiles: [...currentFiles, newAttachment], lastUpdate: dateStr });
        }
      }
      setActiveUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleViewDocument = (e: React.MouseEvent, file: Attachment) => {
    e.stopPropagation(); e.preventDefault();
    downloadFile(file);
  };

  const requestRemoveAttachment = (e: React.MouseEvent, id: string, type: 'license' | 'notification', fileName: string) => {
    e.stopPropagation(); e.preventDefault();
    setConfirmConfig({
      type: 'attachment',
      itemType: type,
      id: id,
      fileName: fileName,
      title: 'Remover Anexo?',
      message: `Deseja remover o arquivo "${fileName}" deste registro?`
    });
  };

  const requestDeleteItem = (e: React.MouseEvent, id: string, type: 'license' | 'notification') => {
    e.stopPropagation(); e.preventDefault();
    setConfirmConfig({
      type: 'delete',
      itemType: type,
      id: id,
      title: 'Excluir Prazo?',
      message: 'Esta ação removerá o item e todos os seus anexos permanentemente.'
    });
  };

  const handleConfirmAction = () => {
    if (!confirmConfig) return;
    const { type, itemType, id, fileName } = confirmConfig;

    if (type === 'delete') {
      if (itemType === 'license') onDeleteLicense(id);
      else onDeleteNotification(id);
    } else if (type === 'attachment' && fileName) {
      if (itemType === 'notification') {
        const item = notifications.find(n => n.id === id);
        if (item) onUpdateNotification({ ...item, attachedFiles: item.attachedFiles?.filter(f => f.fileName !== fileName) });
      } else {
        const item = licenses.find(l => l.id === id);
        if (item) onUpdateLicense({ ...item, attachedFiles: item.attachedFiles?.filter(f => f.fileName !== fileName) });
      }
    }
    setConfirmConfig(null);
  };

  const handleOpenEdit = (e: React.MouseEvent, id: string, type: 'license' | 'notification') => {
    e.stopPropagation();
    setEditingItem({ id, type });
    if (type === 'notification') {
      const n = notifications.find(item => item.id === id);
      if (n) {
        setTaskForm({
          title: n.title,
          deadline: n.deadline.split('/').reverse().join('-'),
          clientName: n.clientName,
          projectId: n.projectId || '',
          agency: n.agency,
          description: n.description
        });
      }
    } else {
      const l = licenses.find(item => item.id === id);
      if (l) {
        // Try to find the project associated with this license (often project.mainLicenseId or just match by client and name part)
        const associatedProject = projects.find(p => p.mainLicenseId === l.id || (p.clientName === l.clientName && l.name.includes(p.name)));
        
        setTaskForm({
          title: l.name,
          deadline: l.expiryDate === 'Pendente' ? '' : l.expiryDate.split('/').reverse().join('-'),
          clientName: l.clientName,
          projectId: associatedProject?.id || '',
          agency: l.agency,
          description: `Licença do tipo ${l.type}. Protocolo: ${l.processNumber}`
        });
      }
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDate = taskForm.deadline.split('-').reverse().join('/');

    if (editingItem) {
      if (editingItem.type === 'notification') {
        const original = notifications.find(n => n.id === editingItem.id);
        if (original) {
          onUpdateNotification({
            ...original,
            title: taskForm.title,
            deadline: formattedDate,
            clientName: taskForm.clientName,
            projectId: taskForm.projectId,
            agency: taskForm.agency,
            description: taskForm.description
          });
        }
      } else {
        const original = licenses.find(l => l.id === editingItem.id);
        if (original) {
          onUpdateLicense({
            ...original,
            name: taskForm.title,
            expiryDate: formattedDate,
            clientName: taskForm.clientName,
            agency: taskForm.agency
          });
        }
      }
    } else {
      // FIX: Added missing required 'severity' property to the Notification object.
      const newNotif: Notification = {
        id: `n-${Date.now()}`,
        title: taskForm.title,
        clientName: taskForm.clientName,
        projectId: taskForm.projectId,
        description: taskForm.description,
        dateReceived: new Date().toLocaleDateString('pt-BR'),
        deadline: formattedDate,
        status: 'Open',
        agency: taskForm.agency,
        severity: 'Média',
        attachedFiles: []
      };
      onAddNotification(newNotif);
    }
    setShowTaskModal(false);
    setEditingItem(null);
    setTaskForm({ title: '', deadline: '', clientName: clients[0] || '', projectId: '', agency: 'SEMA', description: '' });
  };

  const generateCalendarLink = (event: any) => {
    const parts = event.displayDate.split('/');
    if (parts.length !== 3) return "#";
    const formattedDate = `${parts[2]}${parts[1]}${parts[0]}`;
    
    const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
    const details = `Processo Baccarim Systems\nCliente: ${event.subtitle}\nTipo: ${event.type === 'license' ? 'Vencimento de Licença' : 'Prazo de Notificação'}\nÓrgão: ${event.agency || 'N/A'}\n\nDescrição: ${event.description || ''}`;
    
    const params = new URLSearchParams({
      text: `[BACCARIM] ${event.title}`,
      dates: `${formattedDate}/${formattedDate}`,
      details: details
    });
    
    return `${baseUrl}&${params.toString()}`;
  };

  const events = useMemo(() => {
    const parseDate = (d: string) => (d === 'Pendente' || !d) ? new Date(8640000000000000) : new Date(d.split('/').reverse().join('-'));
    const licenseEvents = licenses.map(l => ({ ...l, date: parseDate(l.expiryDate), type: 'license' as const, title: l.name, subtitle: l.clientName, displayDate: l.expiryDate, description: l.detailedStatus || '' }));
    const notificationEvents = notifications.map(n => ({ ...n, date: parseDate(n.deadline), type: 'notification' as const, title: n.title, subtitle: n.clientName, displayDate: n.deadline }));
    return [...licenseEvents, ...notificationEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [licenses, notifications]);

  return (
    <div className="space-y-8 relative pb-20">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
      
      {/* Diálogo de Confirmação */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 border border-baccarim-border-hover">
            <div className="w-16 h-16 bg-baccarim-rose/10 text-baccarim-rose rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"><i className="fas fa-trash-can"></i></div>
            <h3 className="text-lg font-black text-baccarim-text mb-2">{confirmConfig.title}</h3>
            <p className="text-xs text-baccarim-text-muted mb-8">{confirmConfig.message}</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setConfirmConfig(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] hover:bg-baccarim-active transition-colors">Voltar</button>
              <button onClick={handleConfirmAction} className="py-4 bg-baccarim-rose/10 border border-baccarim-border text-baccarim-text rounded-2xl font-black uppercase text-[10px] shadow-xl">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Prazo / Editar Prazo */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 relative border border-baccarim-border-hover pb-safe overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-baccarim-text mb-8">
              {editingItem ? 'Editar Prazo Técnico' : 'Novo Prazo Técnico'}
            </h3>
            <form onSubmit={handleSaveTask} className="space-y-6 pb-20">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Título do Prazo / Obra</label>
                <input 
                  required 
                  value={taskForm.title} 
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text" 
                  placeholder="Ex: LOTE 137 - Complementação SEMA" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Vencimento / Deadline</label>
                  <input 
                    type="date" 
                    required 
                    value={taskForm.deadline} 
                    onChange={e => setTaskForm({...taskForm, deadline: e.target.value})}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text appearance-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Órgão</label>
                  <input 
                    value={taskForm.agency} 
                    onChange={e => setTaskForm({...taskForm, agency: e.target.value})}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text" 
                    placeholder="SEMA, IAT, etc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Parceiro Relacionado</label>
                  <select 
                    value={taskForm.clientName} 
                    onChange={e => setTaskForm({...taskForm, clientName: e.target.value})}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text appearance-none"
                  >
                    {clients.map(c => <option key={c} value={c} className="bg-baccarim-card">{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Empreendimento</label>
                  <select 
                    value={taskForm.projectId} 
                    onChange={e => setTaskForm({...taskForm, projectId: e.target.value})}
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

              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Descrição do Atendimento</label>
                <textarea 
                  value={taskForm.description} 
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text h-24 resize-none" 
                  placeholder="Descreva o que precisa ser feito..."
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-baccarim-blue/10 border border-baccarim-border text-baccarim-text py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-blue/20 transition-all">
                  {editingItem ? 'Atualizar Prazo' : 'Salvar no Cronograma'}
                </button>
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-8 bg-baccarim-hover text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-active transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-baccarim-text tracking-tight">Agenda Técnica</h2>
          <p className="text-baccarim-text-muted font-medium">Controle de prazos e múltiplos anexos por processo.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { setEditingItem(null); setShowTaskModal(true); }} className="bg-baccarim-blue text-baccarim-text px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-baccarim-green transition-all">
             + NOVO PRAZO
          </button>
        </div>
      </div>

      <div className="relative pt-6">
        <div className="absolute left-6 md:left-10 top-0 bottom-0 w-0.5 bg-baccarim-hover"></div>
        <div className="space-y-12">
          {events.map((event) => {
            const isInvalid = event.date.getTime() > 4000000000000;
            const now = new Date();
            const isPast = !isInvalid && event.date < now;
            
            return (
              <div key={`${event.type}-${event.id}`} className="relative pl-16 md:pl-28 group">
                {/* Indicador de Data na Timeline */}
                <div className={`absolute left-4 md:left-8 top-3 w-4 h-4 rounded-full border-4 border-baccarim-dark shadow-md z-10 transition-transform group-hover:scale-125 ${isPast ? 'bg-baccarim-rose' : isInvalid ? 'bg-baccarim-text-muted' : 'bg-baccarim-blue'}`}></div>
                
                {/* Card do Prazo */}
                <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-l-[8px] md:border-l-[10px] shadow-2xl relative transition-all hover:shadow-baccarim-blue/5 group-hover:-translate-y-1 ${isPast ? 'border-baccarim-rose bg-baccarim-rose/5' : 'border-baccarim-green bg-baccarim-card'}`}>
                  
                  {/* Botões de Ação do Card */}
                  <div className="flex items-center space-x-2 mb-6 md:mb-0 md:absolute md:top-8 md:right-8">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = generateCalendarLink(event);
                          if (url !== "#") window.open(url, '_blank');
                        }}
                        title="Adicionar ao Google Agenda"
                        className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-baccarim-hover text-baccarim-text-muted hover:text-baccarim-blue flex items-center justify-center transition-all hover:bg-baccarim-active hover:shadow-md"
                      >
                        <i className="fab fa-google text-[12px] md:text-sm"></i>
                      </button>
                      
                      <button 
                        onClick={(e) => handleOpenEdit(e, event.id, event.type)}
                        title="Editar Prazo"
                        className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-baccarim-hover text-baccarim-text-muted hover:text-baccarim-text flex items-center justify-center transition-all hover:bg-baccarim-active hover:shadow-md"
                     >
                       <i className="fas fa-pencil-alt text-[10px] md:text-xs"></i>
                     </button>
 
                     <button 
                        onClick={() => { setActiveUpload({ id: event.id, type: event.type }); fileInputRef.current?.click(); }} 
                        title="Anexar Documento"
                        className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-baccarim-hover text-baccarim-text-muted hover:text-baccarim-blue flex items-center justify-center transition-all hover:bg-baccarim-active hover:shadow-md"
                     >
                        <i className="fas fa-paperclip text-[14px] md:text-base"></i>
                     </button>
                     
                     <button 
                        onClick={(e) => requestDeleteItem(e, event.id, event.type)} 
                        title="Excluir Prazo"
                        className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-baccarim-rose/10 text-baccarim-rose hover:bg-baccarim-rose hover:text-baccarim-text flex items-center justify-center transition-all"
                     >
                        <i className="fas fa-trash-can text-xs md:text-sm"></i>
                     </button>
                  </div>

                  <div className="md:pr-32">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${event.type === 'license' ? 'bg-baccarim-blue/10 text-baccarim-blue' : 'bg-baccarim-green/10 text-baccarim-green'}`}>
                        {event.type === 'license' ? 'Licença' : 'Notificação'}
                      </span>
                      {isPast && <span className="text-[8px] font-black text-baccarim-rose uppercase tracking-widest px-2 py-0.5 bg-baccarim-rose/10 rounded-lg">PRAZO VENCIDO</span>}
                    </div>
                    
                    <h4 className="text-xl font-black text-baccarim-text mt-2 tracking-tight group-hover:text-baccarim-blue transition-colors">{event.title}</h4>
                    <p className="text-[11px] font-black text-baccarim-text-muted uppercase tracking-widest mt-1">
                      {event.subtitle}
                      {(event as any).projectId && (
                        <>
                          <span className="mx-2 text-baccarim-text opacity-30">•</span>
                          <span className="text-baccarim-blue">
                            {projects.find(p => p.id === (event as any).projectId)?.name || 'Projeto Vinc.'}
                          </span>
                        </>
                      )}
                      <span className="mx-2 text-baccarim-text opacity-30">•</span>
                      {event.displayDate || 'Sem Data'}
                    </p>
                    
                    {event.description && (
                      <p className="mt-4 text-[11px] text-baccarim-text-muted font-medium leading-relaxed max-w-lg italic">
                        "{event.description}"
                      </p>
                    )}

                    {/* Lista de Anexos */}
                    <div className="mt-6 flex flex-wrap gap-3">
                       {event.attachedFiles?.map((file, fIdx) => (
                         <div key={fIdx} className="flex items-center space-x-2 bg-baccarim-hover px-4 py-2 rounded-2xl shadow-sm border border-baccarim-border animate-in zoom-in-95 group/file hover:bg-baccarim-active hover:border-baccarim-blue transition-all">
                           <i className="fas fa-file-pdf text-baccarim-rose text-xs"></i>
                           <button onClick={(e) => handleViewDocument(e, file)} className="text-[10px] font-black text-baccarim-text hover:text-baccarim-blue transition-colors truncate max-w-[150px]">{file.fileName}</button>
                           <button onClick={(e) => requestRemoveAttachment(e, event.id, event.type, file.fileName)} className="text-baccarim-text-muted hover:text-baccarim-rose opacity-0 group-hover/file:opacity-100 transition-opacity"><i className="fas fa-times-circle"></i></button>
                         </div>
                       ))}
                       {(!event.attachedFiles || event.attachedFiles.length === 0) && (
                         <span className="text-[9px] font-bold text-baccarim-text-muted uppercase tracking-widest">Sem anexos vinculados</span>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgendaView;

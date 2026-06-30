
import React, { useState, useRef } from 'react';
import { Project, ChecklistItem, Attachment, EnvironmentalLicense, Notification } from '../types';
import ProjectProcessReportView from './ProjectProcessReportView';
import { utmToDecimal } from '../utils/geoUtils';
import { downloadFile } from '../utils/fileUtils';
import { exportProjectDocumentsAsZip } from '../utils/zipUtils';
import ProjectExtensionReportView from './ProjectExtensionReportView';
import ProjectMeetingMinutesView from './ProjectMeetingMinutesView';
import ProjectRapReportView from './ProjectRapReportView';

interface ProjectsViewProps {
  projects: Project[];
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
  checklistTemplates: Record<string, ChecklistItem[]>;
  projectCategories: string[];
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddNotification: (notification: Notification) => void;
  appConfig?: any;
}

type UploadTarget = {
  projectId: string;
  itemId?: string;
  target: 'checklist' | 'license' | 'notification'
};

type ConfirmDialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
} | null;

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, licenses, notifications, checklistTemplates, projectCategories, onUpdateProject, onDeleteProject, onAddNotification, appConfig }) => {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [isEditingSpecs, setIsEditingSpecs] = useState<string | null>(null);
  const [activeUpload, setActiveUpload] = useState<UploadTarget | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<string | null>(null);
  const [reportProject, setReportProject] = useState<Project | null>(null);
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null); // projectId
  const [newItem, setNewItem] = useState({ label: '', description: '', category: 'Legal' });
  const [editingCategory, setEditingCategory] = useState<{ projectId: string, category: string } | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [tempProjectName, setTempProjectName] = useState('');
  const [isAddingCustomSpec, setIsAddingCustomSpec] = useState<string | null>(null);
  const [newCustomSpec, setNewCustomSpec] = useState({ label: '', value: '' });
  const [extensionProject, setExtensionProject] = useState<Project | null>(null);
  const [meetingMinutesProject, setMeetingMinutesProject] = useState<Project | null>(null);
  const [rapProject, setRapProject] = useState<Project | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [distributingDocs, setDistributingDocs] = useState<{ projectId: string, progress: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const distributeFileRef = useRef<HTMLInputElement>(null);

  const handleDilacaoPrazo = (project: Project) => {
    setExtensionProject(project);
    
    // Optionally auto-create the notification tracker when the user opens the dialog:
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      title: `Dilação de Prazo: ${project.name}`,
      clientName: project.clientName,
      projectId: project.id,
      description: `Processo de solicitação de dilação de prazo gerado para ${project.name}.`,
      dateReceived: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Open',
      agency: project.checklistAgency || 'SEMA',
      severity: 'Média',
      attachedFiles: []
    };
    onAddNotification(newNotif);
  };

  const resizeImage = (base64Str: string, maxWidth = 1280, maxHeight = 1280): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, project: Project) => {
    const file = e.target.files?.[0];
    if (!file || !activeUpload) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let base64Data = event.target?.result as string;

      // Se for imagem, redimensiona para economizar espaço no db.json
      if (file.type.startsWith('image/')) {
        try {
          base64Data = await resizeImage(base64Data);
        } catch (err) {
          console.error("Erro ao redimensionar imagem:", err);
        }
      }

      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = { fileName: file.name, fileData: base64Data, fileDate: dateStr };

      if (activeUpload.target === 'license') {
        const currentFiles = project.specs.licenseFiles || [];
        onUpdateProject({
          ...project,
          specs: { ...project.specs, licenseFiles: [...currentFiles, newAttachment] }
        });
      } else if (activeUpload.target === 'notification') {
        const currentFiles = project.specs.notificationFiles || [];
        onUpdateProject({
          ...project,
          specs: { ...project.specs, notificationFiles: [...currentFiles, newAttachment] }
        });
      } else if (activeUpload.target === 'checklist' && activeUpload.itemId) {
        const updatedChecklist = project.checklist.map(item => {
          if (item.id === activeUpload.itemId) {
            const currentFiles = item.attachedFiles || [];
            return { ...item, attachedFiles: [...currentFiles, newAttachment], isCompleted: true };
          }
          return item;
        });
        onUpdateProject({ ...project, checklist: updatedChecklist });
      }

      setActiveUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleExportProjectZip = async (project: Project) => {
    setIsZipping(project.id);
    try {
      await exportProjectDocumentsAsZip(project);
    } catch (error) {
      console.error("Erro ao exportar documentos:", error);
    } finally {
      setIsZipping(null);
    }
  };

  const handleAIDistributeDocuments = async (project: Project, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setDistributingDocs({ projectId: project.id, progress: `Analisando 0 de ${files.length} documentos...` });
    
    try {
      const updatedChecklistItems = [...(project.checklist || [])];
      let processedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Convert to base64 for local saving
        const dataUri: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        let pdfText;
        if (file.type === 'application/pdf') {
          try {
            const pdfjsLib = await import('pdfjs-dist');
            const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            pdfText = '';
            // Limitar a extração a 15 páginas para não travar o navegador
            const numPages = Math.min(pdf.numPages, 15);
            for (let p = 1; p <= numPages; p++) {
              const page = await pdf.getPage(p);
              const content = await page.getTextContent();
              const strings = content.items.map((item: any) => item.str);
              pdfText += strings.join(' ') + '\n';
            }
          } catch (err) {
            console.error("Erro ao extrair PDF localmente:", err);
          }
        }

        // Send to API
        const payload: any = {
          fileName: file.name,
          checklistItems: updatedChecklistItems.map(item => ({ id: item.id, label: item.label, description: item.description }))
        };
        
        if (pdfText !== undefined) {
          payload.pdfText = pdfText;
        } else {
          payload.dataUri = dataUri;
        }

        const res = await fetch('/api/openai/distribute-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        let json;
        const text = await res.text();
        try {
          json = JSON.parse(text);
        } catch (err) {
          console.error("Non-JSON response from API:", text);
          throw new Error(`Invalid response from server: ${res.status}`);
        }
        
        console.log(`[AI Distribute] Arquivo: ${file.name}`, json);
        
        if (json.error) {
          console.error("API Error:", json.error);
          throw new Error(json.error);
        }
        
        if (json.result && json.result.matchedChecklistItemId) {
          const matchId = json.result.matchedChecklistItemId;
          const itemIndex = updatedChecklistItems.findIndex(item => item.id === matchId);
          
          if (itemIndex !== -1) {
            // Update checklist item with the file
            const existingFiles = updatedChecklistItems[itemIndex].attachedFiles || [];
            updatedChecklistItems[itemIndex] = {
              ...updatedChecklistItems[itemIndex],
              isCompleted: true,
              attachedFiles: [
                ...existingFiles,
                {
                  fileName: file.name,
                  fileData: dataUri,
                  fileDate: new Date().toLocaleDateString('pt-BR')
                }
              ]
            };
          }
        }
        
        processedCount++;
        setDistributingDocs({ projectId: project.id, progress: `Analisando ${processedCount} de ${files.length} documentos...` });
      }

      // Save project updates
      onUpdateProject({ ...project, checklist: updatedChecklistItems });
      
      setDistributingDocs({ projectId: project.id, progress: `Concluído!` });
      setTimeout(() => setDistributingDocs(null), 3000);

    } catch (error) {
      console.error("Erro na distribuição por IA:", error);
      alert('Erro ao processar documentos com IA. Tente novamente.');
      setDistributingDocs(null);
    } finally {
      if (distributeFileRef.current) distributeFileRef.current.value = '';
    }
  };

  const updateSpecField = (project: Project, field: string, value: string) => {
    let finalValue: any = value;
    if (field === 'lat' || field === 'lng' || field === 'zone') {
      finalValue = value === '' ? undefined : parseFloat(value);
    }

    const updatedSpecs = { ...project.specs, [field]: finalValue };

    // Se mudou coordE, coordN ou zone, tenta converter para lat/lng
    if (field === 'coordE' || field === 'coordN' || field === 'zone') {
      const e = parseFloat(updatedSpecs.coordE?.replace(/[^\d.]/g, '') || '');
      const n = parseFloat(updatedSpecs.coordN?.replace(/[^\d.]/g, '') || '');
      const zone = updatedSpecs.zone || 22;

      if (!isNaN(e) && !isNaN(n)) {
        const converted = utmToDecimal(e, n, zone);
        updatedSpecs.lat = converted.lat;
        updatedSpecs.lng = converted.lng;
      }
    }

    onUpdateProject({
      ...project,
      specs: updatedSpecs
    });
  };

  const handleAddCustomSpec = (project: Project) => {
    if (!newCustomSpec.label) return;
    const customSpec = {
      id: Math.random().toString(36).substr(2, 9),
      label: newCustomSpec.label,
      value: newCustomSpec.value
    };
    const updatedSpecs = {
      ...project.specs,
      customSpecs: [...(project.specs.customSpecs || []), customSpec]
    };
    onUpdateProject({ ...project, specs: updatedSpecs });
    setIsAddingCustomSpec(null);
    setNewCustomSpec({ label: '', value: '' });
  };

  const handleUpdateCustomSpec = (project: Project, specId: string, value: string) => {
    const updatedCustomSpecs = (project.specs.customSpecs || []).map(spec =>
      spec.id === specId ? { ...spec, value } : spec
    );
    onUpdateProject({
      ...project,
      specs: { ...project.specs, customSpecs: updatedCustomSpecs }
    });
  };

  const handleDeleteCustomSpec = (project: Project, specId: string) => {
    const updatedCustomSpecs = (project.specs.customSpecs || []).filter(spec => spec.id !== specId);
    onUpdateProject({
      ...project,
      specs: { ...project.specs, customSpecs: updatedCustomSpecs }
    });
  };

  const toggleChecklistItem = (project: Project, itemId: string) => {
    const updated = project.checklist.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    updateChecklistState(project, updated);
  };

  const updateChecklistItemComment = (project: Project, itemId: string, comment: string) => {
    const updated = project.checklist.map(item =>
      item.id === itemId ? { ...item, comment } : item
    );
    onUpdateProject({ ...project, checklist: updated });
  };

  const updateChecklistState = (project: Project, updatedChecklist: ChecklistItem[]) => {
    const completed = updatedChecklist.filter(i => i.isCompleted).length;
    const total = updatedChecklist.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    onUpdateProject({ ...project, checklist: updatedChecklist, progress });
  };

  const handleAddNewItem = (project: Project) => {
    if (!newItem.label) return;

    const newItemObj: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: newItem.label,
      description: newItem.description,
      category: newItem.category as any,
      isCompleted: false,
      attachedFiles: []
    };

    const updatedChecklist = [...project.checklist, newItemObj];
    updateChecklistState(project, updatedChecklist);
    setIsAddingItem(null);
    setNewItem({ label: '', description: '', category: 'Legal' });
  };

  const handleDeleteProject = (project: Project) => {
    setConfirmDialog({
      isOpen: true,
      title: "Excluir Projeto?",
      message: `Tem certeza que deseja excluir permanentemente o projeto "${project.name}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        onDeleteProject(project.id);
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteCategory = (project: Project, category: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Excluir Categoria?",
      message: `Deseja excluir a categoria "${category}" e TODOS os seus itens?`,
      onConfirm: () => {
        const updatedChecklist = project.checklist.filter(item => item.category !== category);
        onUpdateProject({ ...project, checklist: updatedChecklist });
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteChecklistItem = (project: Project, itemId: string, itemLabel: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Excluir Item?",
      message: `Deseja remover o item "${itemLabel}" do checklist?`,
      onConfirm: () => {
        const updatedChecklist = project.checklist.filter(item => item.id !== itemId);
        updateChecklistState(project, updatedChecklist);
        setConfirmDialog(null);
      }
    });
  };

  const requestRemoveChecklistAttachment = (project: Project, itemId: string, fileName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remover Documento?",
      message: `Tem certeza que deseja remover o documento "${fileName}" do checklist?`,
      onConfirm: () => {
        const updated = project.checklist.map(item =>
          item.id === itemId
            ? { ...item, attachedFiles: item.attachedFiles?.filter(f => f.fileName !== fileName) }
            : item
        );
        onUpdateProject({ ...project, checklist: updated });
        setConfirmDialog(null);
      }
    });
  };

  const handleSwitchPhase = (project: Project, newPhase: string) => {
    const agency = project.checklistAgency || 'SEMA';
    const templateKey = `${agency}-${newPhase}`;

    setConfirmDialog({
      isOpen: true,
      title: "Trocar Tipo de Checklist?",
      message: `Ao mudar para ${newPhase} (${agency}), um novo checklist baseado no template master será carregado. Deseja prosseguir?`,
      onConfirm: () => {
        setIsSyncing(project.id);
        const templateItems = checklistTemplates[templateKey] || [];
        const freshChecklist = templateItems.map(item => ({
          ...item,
          id: `${item.id}-${Math.random().toString(36).substr(2, 5)}`,
          isCompleted: false,
          attachedFiles: [],
          comment: ''
        }));

        onUpdateProject({
          ...project,
          currentPhase: newPhase,
          checklist: freshChecklist,
          progress: 0
        });

        setTimeout(() => setIsSyncing(null), 1500);
        setConfirmDialog(null);
      }
    });
  };

  const handleSwitchAgency = (project: Project, newAgency: 'IAT' | 'SEMA') => {
    if (project.checklistAgency === newAgency) return;

    const phase = project.currentPhase;
    const templateKey = `${newAgency}-${phase}`;

    setConfirmDialog({
      isOpen: true,
      title: "Mudar Órgão Ambiental?",
      message: `Ao mudar para ${newAgency}, o checklist da fase ${phase} será reiniciado com o modelo deste órgão. Deseja prosseguir?`,
      onConfirm: () => {
        setIsSyncing(project.id);
        const templateItems = checklistTemplates[templateKey] || [];
        const freshChecklist = templateItems.map(item => ({
          ...item,
          id: `${item.id}-${Math.random().toString(36).substr(2, 5)}`,
          isCompleted: false,
          attachedFiles: [],
          comment: ''
        }));

        onUpdateProject({
          ...project,
          checklistAgency: newAgency,
          checklist: freshChecklist,
          progress: 0
        });
        setTimeout(() => setIsSyncing(null), 1500);
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const project = projects.find(p => p.id === activeUpload?.projectId);
          if (project) handleFileUpload(e, project);
        }}
      />

      {reportProject && (
        <ProjectProcessReportView
          project={reportProject}
          licenses={licenses}
          notifications={notifications}
          onClose={() => setReportProject(null)}
        />
      )}

      {extensionProject && (
        <ProjectExtensionReportView
          project={extensionProject}
          notifications={notifications}
          onUpdateProject={onUpdateProject}
          appConfig={appConfig}
          onClose={() => setExtensionProject(null)}
        />
      )}

      {meetingMinutesProject && (
        <ProjectMeetingMinutesView
          project={meetingMinutesProject}
          onUpdateProject={onUpdateProject}
          onClose={() => setMeetingMinutesProject(null)}
        />
      )}

      {rapProject && (
        <ProjectRapReportView
          project={rapProject}
          onUpdateProject={onUpdateProject}
          onClose={() => setRapProject(null)}
        />
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border border-baccarim-border-hover">
            <h3 className="text-xl font-black text-baccarim-text mb-2">{confirmDialog.title}</h3>
            <p className="text-xs text-baccarim-text-muted mb-8 leading-relaxed">{confirmDialog.message}</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setConfirmDialog(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] hover:bg-baccarim-active transition-colors">Cancelar</button>
              <button onClick={confirmDialog.onConfirm} className="py-4 bg-baccarim-navy text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {projects.map(project => {
        const isExpanded = expandedProjectId === project.id;
        const isEditing = isEditingSpecs === project.id;

        return (
          <div key={project.id} className="bg-baccarim-card rounded-[2rem] shadow-2xl border border-baccarim-border overflow-hidden transition-all duration-500 mb-6">
            <div
              className="p-6 md:p-8 flex items-center justify-between cursor-pointer hover:bg-baccarim-hover transition-colors"
              onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
            >
              <div className="flex items-center space-x-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg ${isExpanded ? 'bg-baccarim-blue' : 'bg-baccarim-navy'}`}>
                  <i className="fas fa-building"></i>
                </div>
                <div>
                  {editingProjectName === project.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={tempProjectName}
                        onChange={(e) => setTempProjectName(e.target.value)}
                        onBlur={() => {
                          if (tempProjectName.trim() && tempProjectName !== project.name) {
                            onUpdateProject({ ...project, name: tempProjectName.trim() });
                          }
                          setEditingProjectName(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (tempProjectName.trim() && tempProjectName !== project.name) {
                              onUpdateProject({ ...project, name: tempProjectName.trim() });
                            }
                            setEditingProjectName(null);
                          }
                        }}
                        className="bg-baccarim-card border-2 border-baccarim-blue px-2 py-1 -ml-2 rounded-lg text-xl md:text-2xl font-black text-baccarim-text outline-none focus:ring-4 focus:ring-baccarim-blue/30 w-full max-w-[250px]"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/name">
                      <h3 className="text-xl font-black text-baccarim-text tracking-tight">{project.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProjectName(project.id);
                          setTempProjectName(project.name);
                        }}
                        className="opacity-0 group-hover/name:opacity-100 text-baccarim-text-muted hover:text-baccarim-blue transition-all"
                      >
                        <i className="fas fa-pen text-[10px]"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
                        }}
                        className="opacity-0 group-hover/name:opacity-100 text-baccarim-text-muted hover:text-red-500 transition-all"
                      >
                        <i className="fas fa-trash-can text-[10px]"></i>
                      </button>
                    </div>
                  )}
                  <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">{project.clientName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="hidden md:block">
                  <span className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Checklist Ativo</span>
                  <span className="text-[10px] font-black text-baccarim-blue uppercase">{project.currentPhase || 'Não Definido'}</span>
                </div>
                <div className="w-8 h-8 rounded-full border border-baccarim-border flex items-center justify-center text-baccarim-text-muted">
                  <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`}></i>
                </div>
              </div>
            </div>

            {/* NOTIFICAÇÃO ATIVA SEMPRE EXPOSTA */}
            {(() => {
              const activeNotifs = notifications?.filter(n => n.projectId === project.id && n.status === 'Open' && n.category !== 'Licença') || [];
              const activeLicenses = notifications?.filter(n => n.projectId === project.id && n.status === 'Open' && n.category === 'Licença') || [];
              
              return (
                <div className="flex flex-col">
                  {activeNotifs.map(activeNotif => (
                    <div 
                      key={activeNotif.id}
                      className="mx-6 md:mx-8 mb-6 bg-baccarim-rose/5 hover:bg-baccarim-rose/10 transition-all border border-baccarim-rose/20 rounded-[1.5rem] p-4 flex items-center space-x-4 cursor-pointer group shadow-sm hover:shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'notifications' }));
                      }}
                      title="Vá para o Centro de Notificações para gerenciar."
                    >
                      <div className="w-10 h-10 rounded-xl bg-baccarim-rose/10 text-baccarim-rose flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <i className="fas fa-triangle-exclamation text-lg animate-pulse"></i>
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="overflow-hidden">
                          <p className="text-[9px] font-black text-baccarim-rose uppercase tracking-[0.2em] mb-0.5">Atenção: Notificação Ativa</p>
                          <h5 className="text-xs font-bold text-baccarim-text truncate" title={activeNotif.title}>{activeNotif.title}</h5>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-black bg-baccarim-rose/10 text-baccarim-rose px-3 py-1.5 rounded-xl uppercase tracking-widest whitespace-nowrap shadow-sm">
                            Prazo: {activeNotif.deadline}
                          </span>
                          <div className="hidden sm:flex text-[9px] font-black text-baccarim-rose uppercase tracking-widest items-center opacity-0 group-hover:opacity-100 transition-opacity bg-baccarim-rose/5 px-2 py-1 rounded-lg">
                            <span>Ir para Notificações</span>
                            <i className="fas fa-arrow-right ml-2"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeLicenses.map(activeLicense => (
                    <div 
                      key={activeLicense.id}
                      className="mx-6 md:mx-8 mb-6 bg-baccarim-blue/5 hover:bg-baccarim-blue/10 transition-all border border-baccarim-blue/20 rounded-[1.5rem] p-4 flex items-center space-x-4 cursor-pointer group shadow-sm hover:shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'notifications' }));
                      }}
                      title="Vá para o Centro de Notificações para gerenciar licenças."
                    >
                      <div className="w-10 h-10 rounded-xl bg-baccarim-blue/10 text-baccarim-blue flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <i className="fas fa-file-shield text-lg animate-pulse"></i>
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="overflow-hidden">
                          <p className="text-[9px] font-black text-baccarim-blue uppercase tracking-[0.2em] mb-0.5">Licença Pendente / Ativa</p>
                          <h5 className="text-xs font-bold text-baccarim-text truncate" title={activeLicense.title}>{activeLicense.title}</h5>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-black bg-baccarim-blue/10 text-baccarim-blue px-3 py-1.5 rounded-xl uppercase tracking-widest whitespace-nowrap shadow-sm">
                            Prazo: {activeLicense.deadline}
                          </span>
                          <div className="hidden sm:flex text-[9px] font-black text-baccarim-blue uppercase tracking-widest items-center opacity-0 group-hover:opacity-100 transition-opacity bg-baccarim-blue/5 px-2 py-1 rounded-lg">
                            <span>Ir para Notificações</span>
                            <i className="fas fa-arrow-right ml-2"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {isExpanded && (
              <div className="px-6 md:px-10 pb-10 space-y-10 animate-in slide-in-from-top-4 duration-500">

                {/* 1. IDENTIFICAÇÃO TÉCNICA DETALHADA - EXPANDIDA E ESTILIZADA */}
                <div className="bg-baccarim-hover rounded-[2.5rem] p-8 md:p-12 border border-baccarim-border shadow-2xl mt-4">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-10 gap-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-lg bg-baccarim-blue/10 flex items-center justify-center">
                        <i className="fas fa-microchip text-baccarim-blue text-sm"></i>
                      </div>
                      <h4 className="text-[13px] font-black text-baccarim-text uppercase tracking-[0.2em]">Identificação Técnica Detalhada</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Hidden input for AI distribution */}
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={distributeFileRef}
                        onChange={(e) => handleAIDistributeDocuments(project, e.target.files)}
                      />
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); distributeFileRef.current?.click(); }}
                        disabled={distributingDocs?.projectId === project.id}
                        className="text-[9px] font-black px-6 py-3 rounded-xl bg-purple-600 text-white uppercase tracking-widest hover:brightness-110 transition-all flex items-center space-x-2 disabled:opacity-50"
                        title="Anexar múltiplos documentos e distribuir via IA para o checklist"
                      >
                        {distributingDocs?.projectId === project.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>{distributingDocs.progress}</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-wand-magic-sparkles"></i>
                            <span>Distribuir Docs (IA)</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setReportProject(project); }}
                        className="text-[9px] font-black px-6 py-3 rounded-xl bg-baccarim-green text-white uppercase tracking-widest hover:brightness-110 transition-all flex items-center space-x-2"
                      >
                        <i className="fas fa-file-invoice"></i>
                        <span>Relatório do Processo</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportProjectZip(project); }}
                        disabled={isZipping === project.id}
                        className="text-[9px] font-black px-6 py-3 rounded-xl bg-baccarim-blue text-white uppercase tracking-widest hover:bg-baccarim-green transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isZipping === project.id ? (
                          <div className="w-3 h-3 border-2 border-baccarim-border/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <i className="fas fa-file-zipper"></i>
                        )}
                        <span>Baixar Todos Docs</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDilacaoPrazo(project); }}
                        className="text-[9px] font-black px-6 py-3 rounded-xl bg-amber-500 text-white uppercase tracking-widest hover:brightness-110 transition-all flex items-center space-x-2"
                        title="Solicitar Dilação de Prazo"
                      >
                        <i className="fas fa-clock-rotate-left"></i>
                        <span>Dilação de Prazo</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMeetingMinutesProject(project); }}
                        className="text-[9px] font-black px-6 py-3 rounded-xl bg-baccarim-navy text-white uppercase tracking-widest hover:bg-baccarim-blue transition-all flex items-center space-x-2"
                        title="Gerar Ata de Reunião"
                      >
                        <i className="fas fa-handshake"></i>
                        <span>Ata de Reunião</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRapProject(project); }}
                        className="text-[9px] font-black px-6 py-3 rounded-xl bg-emerald-700 text-white uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center space-x-2"
                        title="Relatório Ambiental Preliminar"
                      >
                        <i className="fas fa-leaf"></i>
                        <span>RAP</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsEditingSpecs(isEditing ? null : project.id); }}
                        className={`text-[9px] font-black px-8 py-3 rounded-xl border uppercase tracking-widest transition-all ${isEditing ? 'bg-baccarim-blue text-white border-baccarim-blue shadow-lg' : 'bg-baccarim-hover text-baccarim-text border-baccarim-border-hover hover:bg-baccarim-active'}`}
                      >
                        {isEditing ? 'SALVAR DADOS' : 'EDITAR DADOS'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project); }}
                        className="text-[9px] font-black px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center space-x-2"
                        title="Excluir este processo permanentemente"
                      >
                        <i className="fas fa-trash-can"></i>
                        <span>Excluir Processo</span>
                      </button>

                    </div>
                  </div>
                  <div className="space-y-12">
                    {/* I - IDENTIFICAÇÃO DO REQUERENTE */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-baccarim-border pb-3">
                        <span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">I</span>
                        <h5 className="text-[11px] font-black text-baccarim-text uppercase tracking-widest">Identificação do Requerente</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">01 Razão Social / Nome</label>
                          {isEditing ? <input value={project.specs.razaoSocial} onChange={(e) => updateSpecField(project, 'razaoSocial', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.razaoSocial || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">02 CNPJ / CPF</label>
                          {isEditing ? <input value={project.specs.cnpjCpf} onChange={(e) => updateSpecField(project, 'cnpjCpf', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.cnpjCpf || '-'}</p>}
                        </div>
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">03 Endereço</label>
                          {isEditing ? <input value={project.specs.applicantAddress} onChange={(e) => updateSpecField(project, 'applicantAddress', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.applicantAddress || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">04 Bairro</label>
                          {isEditing ? <input value={project.specs.applicantBairro} onChange={(e) => updateSpecField(project, 'applicantBairro', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.applicantBairro || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">05 Município / UF</label>
                          {isEditing ? <input value={project.specs.applicantCity} onChange={(e) => updateSpecField(project, 'applicantCity', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.applicantCity || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">06 CEP</label>
                          {isEditing ? <input value={project.specs.applicantCep} onChange={(e) => updateSpecField(project, 'applicantCep', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.applicantCep || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">07 Telefone Fixo</label>
                          {isEditing ? <input value={project.specs.applicantPhone} onChange={(e) => updateSpecField(project, 'applicantPhone', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.applicantPhone || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">08 Telefone Celular</label>
                          {isEditing ? <input value={project.specs.applicantMobile} onChange={(e) => updateSpecField(project, 'applicantMobile', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.applicantMobile || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">09 Email</label>
                          {isEditing ? <input value={project.specs.applicantEmail} onChange={(e) => updateSpecField(project, 'applicantEmail', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.applicantEmail || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">10 Nome para Contato</label>
                          {isEditing ? <input value={project.specs.contactName} onChange={(e) => updateSpecField(project, 'contactName', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.contactName || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">11 Cargo</label>
                          {isEditing ? <input value={project.specs.contactRole} onChange={(e) => updateSpecField(project, 'contactRole', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.contactRole || '-'}</p>}
                        </div>
                      </div>
                    </div>

                    {/* II - CARACTERÍSTICAS DO EMPREENDIMENTO */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-baccarim-border pb-3">
                        <span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">II</span>
                        <h5 className="text-[11px] font-black text-baccarim-text uppercase tracking-widest">Características do Empreendimento</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1.5 lg:col-span-3">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">12 Tipo</label>
                          {isEditing ? (
                            <div className="flex flex-col gap-2 mt-2">
                              {projectCategories.map((category) => (
                                <label key={category} className="flex items-center gap-3 text-xs text-baccarim-text cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`projectCategory-${project.id}`}
                                    checked={project.specs.projectCategory === category}
                                    onChange={() => updateSpecField(project, 'projectCategory', category)}
                                    className="w-4 h-4 accent-baccarim-blue shrink-0"
                                  />
                                  {category}
                                </label>
                              ))}
                              {projectCategories.length === 0 && (
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Nenhum tipo cadastrado nas configurações.</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[14px] font-black text-baccarim-text">
                              {project.specs.projectCategory || '-'}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">13 Endereço (Lote, Data, etc.)</label>
                          {isEditing ? <input value={project.specs.projectAddress} onChange={(e) => updateSpecField(project, 'projectAddress', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.projectAddress || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">14 Bairro / Gleba</label>
                          {isEditing ? <input value={project.specs.projectBairro} onChange={(e) => updateSpecField(project, 'projectBairro', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.projectBairro || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">15 Município / UF</label>
                          {isEditing ? <input value={project.specs.projectCity} onChange={(e) => updateSpecField(project, 'projectCity', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.projectCity || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">16 Inscrição Imobiliária</label>
                          {isEditing ? <input value={project.specs.realEstateId} onChange={(e) => updateSpecField(project, 'realEstateId', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.realEstateId || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">17 Área Total (M²)</label>
                          {isEditing ? <input value={project.specs.areaTotal} onChange={(e) => updateSpecField(project, 'areaTotal', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.areaTotal || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">18 Área Construída / Loteável (M²)</label>
                          {isEditing ? <input value={project.specs.areaConstruida} onChange={(e) => updateSpecField(project, 'areaConstruida', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.areaConstruida || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">19 Número de Unidades</label>
                          {isEditing ? <input value={project.specs.numUnits} onChange={(e) => updateSpecField(project, 'numUnits', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.numUnits || '-'}</p>}
                        </div>
                      </div>
                    </div>

                    {/* III - DADOS TÉCNICOS ADICIONAIS */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-baccarim-border pb-3">
                        <span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">III</span>
                        <h5 className="text-[11px] font-black text-baccarim-text uppercase tracking-widest">Dados Técnicos Adicionais</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Matrícula</label>
                          {isEditing ? <input value={project.specs.matricula} onChange={(e) => updateSpecField(project, 'matricula', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.matricula || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Área APP</label>
                          {isEditing ? <input value={project.specs.areaAPP} onChange={(e) => updateSpecField(project, 'areaAPP', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.areaAPP || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Responsável Técnico</label>
                          {isEditing ? <input value={project.specs.responsavelTecnico} onChange={(e) => updateSpecField(project, 'responsavelTecnico', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.responsavelTecnico || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Órgão Responsável</label>
                          {isEditing ? <input value={project.specs.orgaoResponsavel} onChange={(e) => updateSpecField(project, 'orgaoResponsavel', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.orgaoResponsavel || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">UTM (E)</label>
                          {isEditing ? <input value={project.specs.coordE} onChange={(e) => updateSpecField(project, 'coordE', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.coordE || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">UTM (N)</label>
                          {isEditing ? <input value={project.specs.coordN} onChange={(e) => updateSpecField(project, 'coordN', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.coordN || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Zona UTM</label>
                          {isEditing ? (
                            <select value={project.specs.zone || 22} onChange={(e) => updateSpecField(project, 'zone', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue appearance-none">
                              {[21, 22, 23, 24, 25].map(z => <option key={z} value={z} className="bg-baccarim-card">{z}S</option>)}
                            </select>
                          ) : <p className="text-[14px] font-black text-baccarim-text">{project.specs.zone || 22}S</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Protocolo / SEI</label>
                          {isEditing ? <input value={project.specs.numeroProtocolo} onChange={(e) => updateSpecField(project, 'numeroProtocolo', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.numeroProtocolo || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Data do Protocolo</label>
                          {isEditing ? <input value={project.specs.dataProtocolo} onChange={(e) => updateSpecField(project, 'dataProtocolo', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" placeholder="DD/MM/AAAA" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.dataProtocolo || '-'}</p>}
                        </div>
                      </div>
                    </div>

                    {/* IV - CAMPOS PERSONALIZADOS */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-baccarim-border pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">IV</span>
                          <h5 className="text-[11px] font-black text-baccarim-text uppercase tracking-widest">Campos Personalizados</h5>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => setIsAddingCustomSpec(project.id)}
                            className="text-[9px] font-black text-baccarim-blue hover:text-baccarim-green transition-colors flex items-center gap-2"
                          >
                            <i className="fas fa-plus-circle"></i>
                            ADICIONAR CAMPO
                          </button>
                        )}
                      </div>

                      {isAddingCustomSpec === project.id && (
                        <div className="bg-baccarim-navy/30 p-6 rounded-2xl border border-baccarim-blue/30 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Nome do Campo</label>
                              <input
                                value={newCustomSpec.label}
                                onChange={(e) => setNewCustomSpec({ ...newCustomSpec, label: e.target.value })}
                                placeholder="Ex: Inscrição Estadual"
                                className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Valor Inicial</label>
                              <input
                                value={newCustomSpec.value}
                                onChange={(e) => setNewCustomSpec({ ...newCustomSpec, value: e.target.value })}
                                placeholder="Valor..."
                                className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setIsAddingCustomSpec(null)}
                              className="px-4 py-2 text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest hover:text-baccarim-text"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleAddCustomSpec(project)}
                              className="px-6 py-2 bg-baccarim-blue text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg"
                            >
                              Confirmar
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {project.specs.customSpecs?.map((spec) => (
                          <div key={spec.id} className="space-y-1.5 group/spec">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">{spec.label}</label>
                              {isEditing && (
                                <button
                                  onClick={() => handleDeleteCustomSpec(project, spec.id)}
                                  className="opacity-0 group-hover/spec:opacity-100 text-baccarim-text-muted hover:text-red-500 transition-all"
                                >
                                  <i className="fas fa-trash text-[8px]"></i>
                                </button>
                              )}
                            </div>
                            {isEditing ? (
                              <input
                                value={spec.value}
                                onChange={(e) => handleUpdateCustomSpec(project, spec.id, e.target.value)}
                                className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue"
                              />
                            ) : (
                              <p className="text-[14px] font-black text-baccarim-text">{spec.value || '-'}</p>
                            )}
                          </div>
                        ))}
                        {(!project.specs.customSpecs || project.specs.customSpecs.length === 0) && !isAddingCustomSpec && (
                          <div className="lg:col-span-4 py-8 text-center border-2 border-dashed border-baccarim-border rounded-3xl">
                            <p className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Nenhum campo personalizado adicionado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CHECKLIST DINÂMICO */}
                <div className="space-y-8">
                  {isAddingItem === project.id && (
                    <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                      <div className="bg-baccarim-card w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-baccarim-border animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 border-b border-baccarim-border flex justify-between items-center">
                          <h3 className="text-xl font-black text-baccarim-text uppercase tracking-tight">Novo Item de Checklist</h3>
                          <button onClick={() => setIsAddingItem(null)} className="text-baccarim-text-muted hover:text-baccarim-text"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="p-10 space-y-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Título do Item</label>
                            <input
                              value={newItem.label}
                              onChange={e => setNewItem({ ...newItem, label: e.target.value })}
                              className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-sm font-bold text-baccarim-text outline-none focus:border-baccarim-blue transition-all"
                              placeholder="Ex: Matrícula atualizada"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Descrição (Opcional)</label>
                            <textarea
                              value={newItem.description}
                              onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                              className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-sm font-bold text-baccarim-text outline-none focus:border-baccarim-blue transition-all h-24 resize-none"
                              placeholder="Detalhes adicionais..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Categoria</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Legal', 'Técnica', 'Ambiental', 'Complementação Vigente'].map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => setNewItem({ ...newItem, category: cat })}
                                  className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newItem.category === cat ? 'bg-baccarim-blue border-baccarim-blue text-white' : 'bg-baccarim-hover border-baccarim-border text-baccarim-text-muted hover:border-baccarim-blue'
                                    }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddNewItem(project)}
                            className="w-full bg-baccarim-navy text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-baccarim-blue transition-all mt-4"
                          >
                            Adicionar ao Checklist
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-baccarim-hover p-6 rounded-[2rem] border border-baccarim-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-baccarim-navy flex items-center justify-center text-white shadow-lg">
                        <i className="fas fa-layer-group"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Checklist em Uso</p>
                        <h4 className="text-sm font-black text-baccarim-text uppercase">
                          {project.currentPhase || 'Selecione uma fase'}
                          <span className="ml-2 text-baccarim-blue">({project.checklistAgency || 'SEMA'})</span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsAddingItem(project.id); }}
                        className="px-6 py-3 bg-baccarim-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-baccarim-navy transition-all flex items-center space-x-2"
                      >
                        <i className="fas fa-plus"></i>
                        <span>Novo Item</span>
                      </button>
                      <div className="flex bg-baccarim-hover p-1 rounded-2xl shadow-sm border border-baccarim-border gap-1">
                        {['SEMA', 'IAT'].map(agency => {
                          const isActive = (project.checklistAgency || 'SEMA') === agency;
                          return (
                            <button
                              key={agency}
                              onClick={() => handleSwitchAgency(project, agency as 'IAT' | 'SEMA')}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-baccarim-blue text-white shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'
                                }`}
                            >
                              {agency}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap bg-baccarim-hover p-1 rounded-2xl shadow-sm border border-baccarim-border gap-1">
                        {Object.keys(checklistTemplates)
                          .filter(key => key.startsWith(project.checklistAgency || 'SEMA'))
                          .map(phaseKey => {
                            const phaseName = phaseKey.replace(`${project.checklistAgency || 'SEMA'}-`, '');
                            const isActive = project.currentPhase === phaseName;
                            return (
                              <button
                                key={phaseKey}
                                onClick={() => handleSwitchPhase(project, phaseName)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-baccarim-green text-white shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'
                                  }`}
                              >
                                {phaseName}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {Array.from(new Set(project.checklist.map(i => i.category))).map(cat => (
                      <div key={cat} className="space-y-6">
                        <div className="flex items-center justify-between border-b border-baccarim-border pb-3 group/cat">
                          {editingCategory?.projectId === project.id && editingCategory?.category === cat ? (
                            <input
                              autoFocus
                              value={tempCategoryName}
                              onChange={(e) => setTempCategoryName(e.target.value)}
                              onBlur={() => {
                                if (tempCategoryName.trim() && tempCategoryName !== cat) {
                                  const updatedChecklist = project.checklist.map(item =>
                                    item.category === cat ? { ...item, category: tempCategoryName.trim() } : item
                                  );
                                  onUpdateProject({ ...project, checklist: updatedChecklist });
                                }
                                setEditingCategory(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (tempCategoryName.trim() && tempCategoryName !== cat) {
                                    const updatedChecklist = project.checklist.map(item =>
                                      item.category === cat ? { ...item, category: tempCategoryName.trim() } : item
                                    );
                                    onUpdateProject({ ...project, checklist: updatedChecklist });
                                  }
                                  setEditingCategory(null);
                                }
                              }}
                              className="bg-baccarim-navy border border-baccarim-blue p-1 rounded text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em] outline-none w-full"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <h5 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em]">{cat}</h5>
                              <button
                                onClick={() => {
                                  setEditingCategory({ projectId: project.id, category: cat });
                                  setTempCategoryName(cat);
                                }}
                                className="opacity-0 group-hover/cat:opacity-100 text-baccarim-text-muted hover:text-baccarim-blue transition-all"
                              >
                                <i className="fas fa-pen text-[8px]"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(project, cat)}
                                className="opacity-0 group-hover/cat:opacity-100 text-baccarim-text-muted hover:text-red-500 transition-all"
                              >
                                <i className="fas fa-trash-can text-[8px]"></i>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          {project.checklist.filter(i => i.category === cat).map(item => (
                            <div key={item.id} className={`bg-baccarim-hover rounded-[2rem] border p-5 shadow-sm transition-all ${item.isCompleted ? 'border-emerald-500/20 bg-baccarim-green/5' : 'border-baccarim-border'}`}>
                              <div className="flex items-start justify-between mb-4 group/item">
                                <div className="flex items-start space-x-3">
                                  <button onClick={() => toggleChecklistItem(project, item.id)} className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${item.isCompleted ? 'bg-baccarim-green border-baccarim-green text-white' : 'border-baccarim-border-hover bg-baccarim-hover'}`}><i className="fas fa-check text-[10px]"></i></button>
                                  <span className={`text-[11px] font-bold leading-tight ${item.isCompleted ? 'text-emerald-400 opacity-60' : 'text-slate-300'}`}>{item.label}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteChecklistItem(project, item.id, item.label)}
                                  className="opacity-0 group-hover/item:opacity-100 text-baccarim-text-muted hover:text-red-500 transition-all"
                                >
                                  <i className="fas fa-trash-can text-[10px]"></i>
                                </button>
                              </div>
                              <div className="space-y-3">
                                <button onClick={() => { setActiveUpload({ projectId: project.id, itemId: item.id, target: 'checklist' }); fileInputRef.current?.click(); }} className="w-full py-2 bg-baccarim-hover text-baccarim-text-muted rounded-xl text-[8px] font-black uppercase tracking-widest border border-baccarim-border hover:bg-baccarim-active transition-all">+ Anexar Documento</button>
                                {item.attachedFiles?.map((file, fIdx) => (
                                  <div key={fIdx} className="flex items-center justify-between bg-baccarim-hover border border-baccarim-border p-2 rounded-xl animate-in slide-in-from-right-2">
                                    <div className="flex items-center space-x-2 truncate"><i className="fas fa-file-pdf text-red-500 text-[10px]"></i><button onClick={() => downloadFile(file)} className="text-[9px] font-bold text-slate-300 truncate max-w-[100px]">{file.fileName}</button></div>
                                    <button onClick={() => requestRemoveChecklistAttachment(project, item.id, file.fileName)} className="text-baccarim-text-muted hover:text-red-500"><i className="fas fa-trash text-[10px]"></i></button>
                                  </div>
                                ))}
                                <textarea value={item.comment || ''} onChange={(e) => updateChecklistItemComment(project, item.id, e.target.value)} placeholder="Observação técnica..." className="w-full bg-baccarim-hover border border-baccarim-border rounded-xl p-3 text-[10px] font-medium text-baccarim-text outline-none h-16 resize-none focus:ring-1 focus:ring-baccarim-blue" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-baccarim-border flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Progresso Doc.</span>
                    <div className="w-48 h-1.5 bg-baccarim-hover rounded-full overflow-hidden"><div className="h-full bg-baccarim-green" style={{ width: `${project.progress}%` }}></div></div>
                    <span className="text-xs font-black text-baccarim-text">{project.progress}%</span>
                  </div>
                  <button onClick={() => setExpandedProjectId(null)} className="px-12 py-4 bg-baccarim-navy text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-baccarim-blue transition-all">Salvar e Fechar</button>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProjectsView;

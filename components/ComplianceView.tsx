
import React, { useState } from 'react';
import { Project, ChecklistItem, Attachment } from '../types';
import { downloadFile } from '../utils/fileUtils';

interface ComplianceViewProps {
  projects: Project[];
  onUpdateProject: (project: Project) => void;
}

const ComplianceView: React.FC<ComplianceViewProps> = ({ projects, onUpdateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [activeUploadItemId, setActiveUploadItemId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', description: '', category: 'Legal' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const toggleItem = (itemId: string) => {
    if (!activeProject) return;
    const updatedChecklist = activeProject.checklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    
    // Calcular novo progresso
    const completed = updatedChecklist.filter(i => i.isCompleted).length;
    const total = updatedChecklist.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    onUpdateProject({ ...activeProject, checklist: updatedChecklist, progress });
  };

  const handleUpdateComment = (itemId: string, comment: string) => {
    if (!activeProject) return;
    const updatedChecklist = activeProject.checklist.map(item => 
      item.id === itemId ? { ...item, comment } : item
    );
    onUpdateProject({ ...activeProject, checklist: updatedChecklist });
  };

  const handleAddItem = () => {
    if (!activeProject || !newItem.label) return;
    
    const newItemObj: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: newItem.label,
      description: newItem.description,
      category: newItem.category as any,
      isCompleted: false,
      attachedFiles: []
    };

    const updatedChecklist = [...activeProject.checklist, newItemObj];
    
    // Recalcular progresso
    const completed = updatedChecklist.filter(i => i.isCompleted).length;
    const total = updatedChecklist.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    onUpdateProject({ ...activeProject, checklist: updatedChecklist, progress });
    setIsAddingItem(false);
    setNewItem({ label: '', description: '', category: 'Legal' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject || !activeUploadItemId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = { 
        fileName: file.name, 
        fileData: base64Data, 
        fileDate: dateStr 
      };

      const updatedChecklist = activeProject.checklist.map(item => {
        if (item.id === activeUploadItemId) {
          const currentFiles = item.attachedFiles || [];
          return { ...item, attachedFiles: [...currentFiles, newAttachment], isCompleted: true };
        }
        return item;
      });

      // Recalcular progresso
      const completed = updatedChecklist.filter(i => i.isCompleted).length;
      const total = updatedChecklist.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      onUpdateProject({ ...activeProject, checklist: updatedChecklist, progress });
      setActiveUploadItemId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (itemId: string, fileName: string) => {
    if (!activeProject) return;
    const updatedChecklist = activeProject.checklist.map(item => {
      if (item.id === itemId) {
        return { ...item, attachedFiles: item.attachedFiles?.filter(f => f.fileName !== fileName) };
      }
      return item;
    });
    onUpdateProject({ ...activeProject, checklist: updatedChecklist });
  };

  const baseCategories = ['Legal', 'Técnica', 'Ambiental', 'Complementação Vigente'];
  const projectCategories = activeProject ? Array.from(new Set(activeProject.checklist.map(i => i.category))) : [];
  const categories = Array.from(new Set([...baseCategories, ...projectCategories]));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload} 
      />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-baccarim-navy tracking-tight">Conformidade & Checklist</h2>
          <p className="text-baccarim-text-muted font-medium">Controle rigoroso de protocolos SEMA baseado nos modelos LP, LI e LAS.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsAddingItem(true)}
            className="bg-baccarim-blue text-baccarim-text px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-baccarim-navy transition-all flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Novo Item</span>
          </button>
          <select 
            value={selectedProjectId || ''} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-baccarim-card border border-slate-100 p-4 rounded-2xl outline-none font-bold text-baccarim-navy shadow-sm"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>)}
          </select>
        </div>
      </div>

      {isAddingItem && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-baccarim-card w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-baccarim-navy uppercase tracking-tight">Novo Item de Checklist</h3>
              <button onClick={() => setIsAddingItem(false)} className="text-slate-300 hover:text-baccarim-navy"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Título do Item</label>
                <input 
                  value={newItem.label} 
                  onChange={e => setNewItem({...newItem, label: e.target.value})}
                  className="w-full bg-baccarim-hover border border-slate-100 p-4 rounded-xl text-sm font-bold outline-none focus:border-baccarim-blue transition-all"
                  placeholder="Ex: Matrícula atualizada"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Descrição (Opcional)</label>
                <textarea 
                  value={newItem.description} 
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                  className="w-full bg-baccarim-hover border border-slate-100 p-4 rounded-xl text-sm font-bold outline-none focus:border-baccarim-blue transition-all h-24 resize-none"
                  placeholder="Detalhes adicionais..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  {baseCategories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setNewItem({...newItem, category: cat})}
                      className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        newItem.category === cat ? 'bg-baccarim-blue border-baccarim-blue text-baccarim-text' : 'bg-baccarim-hover border-slate-100 text-baccarim-text-muted hover:border-baccarim-blue'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <div className="col-span-2 mt-2">
                    <input 
                      placeholder="Outra categoria..."
                      className="w-full bg-baccarim-hover border border-slate-100 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-baccarim-blue"
                      onBlur={(e) => { if(e.target.value) setNewItem({...newItem, category: e.target.value}) }}
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleAddItem}
                className="w-full bg-baccarim-navy text-baccarim-text p-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-baccarim-blue transition-all mt-4"
              >
                Adicionar ao Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {activeProject ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {categories.map(cat => {
              const items = activeProject.checklist.filter(i => i.category === cat);
              if (items.length === 0 && !baseCategories.includes(cat)) return null;

              return (
                <div key={cat} className="bg-baccarim-card rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="px-8 py-6 bg-baccarim-hover border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-baccarim-navy uppercase tracking-widest text-xs">{cat}</h3>
                    <span className="text-[10px] font-black text-baccarim-text-muted">{items.filter(i => i.isCompleted).length}/{items.length} ITENS</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {items.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Nenhum item nesta categoria</p>
                      </div>
                    ) : items.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-6 flex flex-col space-y-4 transition-all hover:bg-baccarim-hover/50 ${item.isCompleted ? 'opacity-80' : ''}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div 
                            onClick={() => toggleItem(item.id)}
                            className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                              item.isCompleted ? 'bg-baccarim-green border-baccarim-green text-baccarim-text' : 'bg-baccarim-card border-slate-200 text-transparent'
                            }`}
                          >
                            <i className="fas fa-check text-[10px]"></i>
                          </div>
                          <div className="flex-1" onClick={() => toggleItem(item.id)}>
                            <p className={`text-sm font-bold cursor-pointer ${item.isCompleted ? 'line-through text-baccarim-text-muted' : 'text-slate-700'}`}>
                              {item.label}
                            </p>
                            {item.description && <p className="text-[10px] text-baccarim-text-muted mt-1">{item.description}</p>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => { setActiveUploadItemId(item.id); fileInputRef.current?.click(); }}
                              className="w-8 h-8 rounded-lg bg-baccarim-hover text-slate-300 hover:text-baccarim-blue flex items-center justify-center transition-all"
                              title="Anexar Arquivo"
                            >
                              <i className="fas fa-paperclip text-xs"></i>
                            </button>
                            {item.attachedFiles && item.attachedFiles.length > 0 && (
                              <div className="flex flex-col space-y-1">
                                {item.attachedFiles.map(file => (
                                  <div key={file.fileName} className="flex items-center space-x-2 bg-baccarim-card border border-slate-100 px-2 py-1 rounded-lg shadow-sm">
                                    <button 
                                      onClick={() => downloadFile(file)}
                                      className="text-[8px] font-black text-baccarim-text-muted hover:text-baccarim-navy truncate max-w-[80px]"
                                    >
                                      {file.fileName}
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveAttachment(item.id, file.fileName)}
                                      className="text-slate-300 hover:text-red-500"
                                    >
                                      <i className="fas fa-times text-[8px]"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="pl-10">
                          <textarea 
                            value={item.comment || ''}
                            onChange={(e) => handleUpdateComment(item.id, e.target.value)}
                            placeholder="Observação técnica..."
                            className="w-full bg-baccarim-hover border border-slate-50 p-3 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:border-baccarim-blue/30 h-16 resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-8">
            <div className="bg-baccarim-navy rounded-[3rem] p-10 text-baccarim-text shadow-xl">
              <h3 className="text-xl font-black mb-2">Status do Protocolo</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-baccarim-blue mb-6">Modelo: {activeProject.checklistAgency || 'SEMA'}</p>
              <div className="relative h-40 w-40 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-baccarim-text/10" />
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={440} 
                    strokeDashoffset={440 - (440 * activeProject.progress) / 100}
                    className="text-baccarim-blue transition-all duration-1000" 
                  />
                </svg>
                <span className="absolute text-3xl font-black">{activeProject.progress}%</span>
              </div>
              <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] mt-6 opacity-60">Pronto para Protocolo</p>
            </div>

            <div className="bg-baccarim-card rounded-[2.5rem] p-8 border border-slate-100 shadow-lg">
              <h4 className="font-black text-baccarim-navy uppercase tracking-widest text-[10px] mb-6">Resumo do Projeto</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-baccarim-text-muted uppercase">Matrícula</span>
                  <span className="text-xs font-black text-baccarim-navy">{activeProject.specs.matricula}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-baccarim-text-muted uppercase">Área Total</span>
                  <span className="text-xs font-black text-baccarim-navy">{activeProject.specs.areaTotal}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-[10px] font-bold text-baccarim-text-muted uppercase">Contato</span>
                  <span className="text-xs font-black text-baccarim-navy">{activeProject.specs.contact}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-40">
           <i className="fas fa-folder-open text-6xl text-slate-200 mb-6"></i>
           <p className="text-baccarim-text-muted font-bold">Selecione um projeto para ver a conformidade.</p>
        </div>
      )}
    </div>
  );
};

export default ComplianceView;


import React, { useState, useRef, useEffect } from 'react';
import { ChecklistItem, AppConfig } from '../types';

interface AppSettingsViewProps {
  templates: Record<string, ChecklistItem[]>;
  onUpdateTemplates: (newTemplates: Record<string, ChecklistItem[]>) => void;
  projectCategories: string[];
  onUpdateProjectCategories: (categories: string[]) => void;
  appConfig: AppConfig;
  onUpdateAppConfig: (config: AppConfig) => void;
}

const AppSettingsView: React.FC<AppSettingsViewProps> = ({ 
  templates, 
  onUpdateTemplates, 
  projectCategories, 
  onUpdateProjectCategories,
  appConfig,
  onUpdateAppConfig
}) => {
  const [selectedAgency, setSelectedAgency] = useState<'SEMA' | 'IAT'>('SEMA');
  const [settingsTab, setSettingsTab] = useState<'branding' | 'checklists' | 'categories'>('branding');
  const filteredTabs = Object.keys(templates).filter(key => key.startsWith(selectedAgency));
  const [activeTab, setActiveTab] = useState<string>(filteredTabs[0] || '');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newItem, setNewItem] = useState({ label: '', description: '', category: 'Legal' as ChecklistItem['category'] });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ id: string, label: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  
  // Local state for branding to allow explicit saving
  const [localAppIcon, setLocalAppIcon] = useState<string | undefined>(appConfig.appIcon);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    setLocalAppIcon(appConfig.appIcon);
  }, [appConfig.appIcon]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 512;
        const MAX_HEIGHT = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality jpeg
      };
    });
  };

  const handleAgencyChange = (agency: 'IAT' | 'SEMA') => {
    setSelectedAgency(agency);
    const newFiltered = Object.keys(templates).filter(key => key.startsWith(agency));
    if (newFiltered.length > 0) {
      setActiveTab(newFiltered[0]);
    } else {
      setActiveTab('');
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        setLocalAppIcon(resized);
        setSaveSuccess(false);
        setCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = () => {
    setIsSaving(true);
    onUpdateAppConfig({
      ...appConfig,
      appIcon: localAppIcon
    });
    
    // Simulate server response wait or check for socket ACK if we had it
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ChecklistItem = {
      id: `tmpl-${Date.now()}`,
      label: newItem.label,
      description: newItem.description,
      category: newItem.category,
      isCompleted: false,
      attachedFiles: []
    };

    const updated = {
      ...templates,
      [activeTab]: [...(templates[activeTab] || []), item]
    };
    onUpdateTemplates(updated);
    setShowAddItemForm(false);
    setNewItem({ label: '', description: '', category: 'Legal' });
  };

  const handleCreateNewType = (e: React.FormEvent) => {
    e.preventDefault();
    const fullKey = `${selectedAgency}-${newTypeName.trim()}`;
    if (newTypeName.trim() && !templates[fullKey]) {
      const updated = {
        ...templates,
        [fullKey]: []
      };
      onUpdateTemplates(updated);
      setActiveTab(fullKey);
      setNewTypeName('');
      setShowNewTypeForm(false);
    }
  };

  const handleAddProjectCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !projectCategories.includes(newCategoryName.trim())) {
      onUpdateProjectCategories([...projectCategories, newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };

  const handleDeleteProjectCategory = (category: string) => {
    onUpdateProjectCategories(projectCategories.filter(c => c !== category));
  };

  const handleUpdateProjectCategory = (index: number, newValue: string) => {
    const updated = [...projectCategories];
    updated[index] = newValue;
    onUpdateProjectCategories(updated);
  };

  const confirmRemoveType = () => {
    if (!typeToDelete) return;
    const newTemplates = { ...templates };
    delete newTemplates[typeToDelete];
    onUpdateTemplates(newTemplates);
    if (activeTab === typeToDelete) {
      setActiveTab(Object.keys(newTemplates)[0] || '');
    }
    setTypeToDelete(null);
  };

  const confirmRemoveItem = () => {
    if (!itemToDelete) return;
    const updated = {
      ...templates,
      [activeTab]: templates[activeTab].filter(i => i.id !== itemToDelete.id)
    };
    onUpdateTemplates(updated);
    setItemToDelete(null);
  };

  const confirmRemoveCategory = () => {
    if (!categoryToDelete) return;
    const updated = {
      ...templates,
      [activeTab]: templates[activeTab].filter(i => i.category !== categoryToDelete)
    };
    onUpdateTemplates(updated);
    setCategoryToDelete(null);
  };

  const updateItemLabel = (id: string, label: string) => {
    const updated = {
      ...templates,
      [activeTab]: templates[activeTab].map(i => i.id === id ? { ...i, label } : i)
    };
    onUpdateTemplates(updated);
  };

  const moveTemplate = (key: string, direction: 'up' | 'down') => {
    const keys = Object.keys(templates);
    const index = keys.indexOf(key);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === keys.length - 1) return;

    const newKeys = [...keys];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newKeys[index], newKeys[newIndex]] = [newKeys[newIndex], newKeys[index]];

    const newTemplates: Record<string, ChecklistItem[]> = {};
    newKeys.forEach(k => {
      newTemplates[k] = templates[k];
    });
    onUpdateTemplates(newTemplates);
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const items = [...templates[activeTab]];
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return;

    // We only move relative to items in the SAME category to maintain grouping
    const category = items[index].category;
    const catIndices = items.map((item, idx) => item.category === category ? idx : -1).filter(idx => idx !== -1);
    const posInCat = catIndices.indexOf(index);

    if (direction === 'up' && posInCat === 0) return;
    if (direction === 'down' && posInCat === catIndices.length - 1) return;

    const swapWithIndex = catIndices[direction === 'up' ? posInCat - 1 : posInCat + 1];
    [items[index], items[swapWithIndex]] = [items[swapWithIndex], items[index]];

    const updated = {
      ...templates,
      [activeTab]: items
    };
    onUpdateTemplates(updated);
  };

  const moveCategory = (category: string, direction: 'up' | 'down') => {
    const items = [...templates[activeTab]];
    const categories = Array.from(new Set(items.map(i => i.category)));
    const index = categories.indexOf(category);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const otherCat = categories[direction === 'up' ? index - 1 : index + 1];
    
    // Group items by category
    const grouped: Record<string, ChecklistItem[]> = {};
    categories.forEach(c => {
      grouped[c] = items.filter(i => i.category === c);
    });

    // Reorder categories
    const newCategories = [...categories];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

    // Rebuild items array
    const newItems: ChecklistItem[] = [];
    newCategories.forEach(c => {
      newItems.push(...grouped[c]);
    });

    const updated = {
      ...templates,
      [activeTab]: newItems
    };
    onUpdateTemplates(updated);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Modais de Exclusão e Confirmação */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 border border-baccarim-border-hover">
            <h3 className="text-xl font-black text-baccarim-text mb-2">Excluir Item?</h3>
            <p className="text-xs text-baccarim-text-muted mb-8 leading-relaxed">Remover "{itemToDelete.label}" do template?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setItemToDelete(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={confirmRemoveItem} className="py-4 bg-red-500 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ... (rest of modals) */}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-baccarim-text tracking-tight">Configurações Mestras</h2>
          <p className="text-baccarim-text-muted font-medium">Gerencie templates, categorias e identidade visual do app.</p>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <button 
              onClick={() => setSettingsTab('branding')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'branding' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
            >
              Personalização
            </button>
            <button 
              onClick={() => setSettingsTab('checklists')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'checklists' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
            >
              Checklists
            </button>
            <button 
              onClick={() => setSettingsTab('categories')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'categories' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
            >
              Tipos de Empreendimento
            </button>
          </div>
        </div>
      </div>

      {settingsTab === 'branding' && (
        <div className="bg-baccarim-card rounded-[3rem] shadow-2xl border border-baccarim-border p-10 md:p-14 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-baccarim-text-muted uppercase tracking-[0.2em]">Ícone do App (Capa de Download)</h3>
                    <button 
                      onClick={() => {
                        setLocalAppIcon(undefined);
                        setSaveSuccess(false);
                      }}
                      className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest flex items-center space-x-2 hover:text-baccarim-blue transition-colors"
                    >
                      <i className="fas fa-undo"></i>
                      <span>Padrão</span>
                    </button>
                 </div>

                 <div 
                   onClick={() => !compressing && fileInputRef.current?.click()}
                   className={`relative aspect-video rounded-[2rem] border-2 border-dashed border-baccarim-border hover:border-baccarim-blue hover:bg-baccarim-blue/5 transition-all cursor-pointer group flex flex-col items-center justify-center p-8 text-center ${compressing ? 'opacity-50 cursor-wait' : ''}`}
                 >
                    {compressing ? (
                      <div className="flex flex-col items-center space-y-4">
                         <i className="fas fa-spinner animate-spin text-3xl text-baccarim-blue"></i>
                         <p className="text-[10px] font-black text-baccarim-text uppercase tracking-widest">Processando Imagem...</p>
                      </div>
                    ) : localAppIcon ? (
                       <div className="space-y-4">
                          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-baccarim-green/20 shadow-2xl mx-auto ring-8 ring-baccarim-green/5">
                             <img src={localAppIcon} alt="App Icon" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-[10px] font-black text-baccarim-text uppercase tracking-widest opacity-60">Toque aqui para trocar a imagem</p>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          <div className="w-20 h-20 bg-baccarim-hover rounded-[2rem] flex items-center justify-center text-3xl text-baccarim-text-muted group-hover:text-baccarim-blue transition-all">
                             <i className="fas fa-image"></i>
                          </div>
                          <div>
                            <p className="text-sm font-black text-baccarim-text">Clique para enviar uma foto</p>
                            <p className="text-[10px] font-bold text-baccarim-text-muted uppercase tracking-widest mt-1">PNG ou JPG sugerido (Proporção 1:1)</p>
                          </div>
                       </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                 </div>

                 <div className="pt-4 flex items-center space-x-4">
                    <button
                      onClick={handleSaveBranding}
                      disabled={isSaving || compressing || (localAppIcon === appConfig.appIcon && localAppIcon !== undefined)}
                      className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center space-x-3 shadow-xl ${
                        saveSuccess 
                          ? 'bg-baccarim-green text-baccarim-text' 
                          : 'bg-baccarim-blue text-baccarim-text hover:shadow-baccarim-blue/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isSaving ? (
                        <i className="fas fa-circle-notch animate-spin text-sm"></i>
                      ) : saveSuccess ? (
                        <i className="fas fa-check text-sm"></i>
                      ) : (
                        <i className="fas fa-floppy-disk text-sm"></i>
                      )}
                      <span>{isSaving ? 'Salvando...' : saveSuccess ? 'Configuração Salva!' : 'Salvar Alterações'}</span>
                    </button>
                 </div>

                 <div className="bg-baccarim-hover border border-baccarim-border p-8 rounded-[2rem] space-y-4">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 rounded-xl bg-baccarim-blue/10 flex items-center justify-center text-baccarim-blue text-lg">
                          <i className="fas fa-circle-info"></i>
                       </div>
                       <h4 className="text-sm font-black text-baccarim-text">Dica de Identidade</h4>
                    </div>
                    <p className="text-xs text-baccarim-text-muted leading-relaxed font-medium">
                       Esta imagem será usada como o ícone da Baccarim Systems na sua tela inicial quando o app for instalado, e também aparecerá no topo do menu lateral para todos os seus engenheiros e clientes.
                    </p>
                 </div>
              </div>

              <div className="flex flex-col items-center">
                 <h4 className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-[0.2em] mb-10 w-full text-center">Preview no Celular</h4>
                 
                 <div className="relative w-[280px] h-[560px] bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-zinc-800 rounded-b-2xl z-20"></div>
                    
                    <div className="h-full w-full bg-gradient-to-b from-baccarim-blue/80 to-purple-600 p-6 flex flex-col justify-center">
                       <div className="grid grid-cols-3 gap-6">
                          {[1,2,3,4,5].map(i => (
                             <div key={i} className="aspect-square bg-white/20 rounded-2xl backdrop-blur-md"></div>
                          ))}
                          <div className="flex flex-col items-center space-y-2 group">
                             <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-lg shadow-black/20 group-scale-110 transition-transform flex items-center justify-center">
                                {localAppIcon ? (
                                   <img src={localAppIcon} alt="Icon" className="w-full h-full object-cover" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center p-2">
                                      <div className="relative w-full h-full">
                                         <div className="absolute inset-0 bg-gradient-to-tr from-baccarim-green to-baccarim-blue rounded-lg rotate-12 scale-75 opacity-20"></div>
                                         <div className="absolute inset-0 bg-baccarim-navy rounded-lg -rotate-12 scale-75 shadow-lg"></div>
                                      </div>
                                   </div>
                                )}
                             </div>
                             <div className="h-1.5 w-12 bg-white/40 rounded-full"></div>
                          </div>
                          {[1,2,3].map(i => (
                             <div key={i+10} className="aspect-square bg-white/20 rounded-2xl backdrop-blur-md"></div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {settingsTab === 'checklists' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex p-1.5 bg-baccarim-hover rounded-2xl w-full md:w-auto">
              <button 
                onClick={() => handleAgencyChange('SEMA')}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedAgency === 'SEMA' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:text-baccarim-text'}`}
              >
                SEMA - MT
              </button>
              <button 
                onClick={() => handleAgencyChange('IAT')}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedAgency === 'IAT' ? 'bg-baccarim-active text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:text-baccarim-text'}`}
              >
                IAT - PR
              </button>
            </div>

            <button 
              onClick={() => setShowNewTypeForm(true)}
              className="py-4 px-8 bg-baccarim-blue text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-baccarim-green transition-all shadow-xl"
            >
              <i className="fas fa-plus mr-2"></i>
              Novo Template de Projeto
            </button>
          </div>

          {showNewTypeForm && (
            <div className="bg-baccarim-card p-8 rounded-[2rem] border-2 border-baccarim-blue animate-in zoom-in-95">
               <form onSubmit={handleCreateNewType} className="flex flex-col md:flex-row gap-4">
                  <input 
                    autoFocus
                    placeholder="Ex: Loteamento, Indústria, Fazenda..." 
                    className="flex-1 bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-sm font-bold text-baccarim-text outline-none"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowNewTypeForm(false)} className="px-6 py-4 bg-baccarim-hover text-baccarim-text-muted rounded-xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button type="submit" className="px-10 py-4 bg-baccarim-blue text-baccarim-text rounded-xl font-black uppercase text-[10px] tracking-widest">Criar Template</button>
                  </div>
               </form>
            </div>
          )}

          <div className="bg-baccarim-card rounded-[3rem] shadow-2xl border border-baccarim-border overflow-hidden">
            <div className="flex overflow-x-auto no-scrollbar border-b border-baccarim-border bg-baccarim-hover/30">
              {filteredTabs.length > 0 ? filteredTabs.map((key, idx) => (
                <div key={key} className="flex items-center min-w-max group/tab">
                  <div className="flex flex-col ml-2 opacity-0 group-hover/tab:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveTemplate(key, 'up'); }}
                      disabled={idx === 0}
                      className="p-1 text-[8px] text-baccarim-text-muted hover:text-baccarim-blue disabled:opacity-20"
                    >
                      <i className="fas fa-chevron-up"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveTemplate(key, 'down'); }}
                      disabled={idx === filteredTabs.length - 1}
                      className="p-1 text-[8px] text-baccarim-text-muted hover:text-baccarim-blue disabled:opacity-20"
                    >
                      <i className="fas fa-chevron-down"></i>
                    </button>
                  </div>
                  <button 
                    onClick={() => setActiveTab(key)}
                    className={`px-6 py-6 text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === key ? 'bg-baccarim-card text-baccarim-blue border-b-2 border-baccarim-blue' : 'text-baccarim-text-muted hover:text-baccarim-text'}`}
                  >
                    <span>{key.split('-')[1]}</span>
                  </button>
                  <button 
                    onClick={() => setTypeToDelete(key)}
                    className="p-2 text-baccarim-text-muted hover:text-red-500 transition-colors opacity-0 group-hover/tab:opacity-100"
                  >
                    <i className="fas fa-trash-can"></i>
                  </button>
                </div>
              )) : (
                <div className="p-10 text-center w-full">
                  <p className="text-sm font-bold text-baccarim-text-muted uppercase tracking-widest italic">Nenhum template cadastrado para esta secretaria.</p>
                </div>
              )}
            </div>

            {activeTab && templates[activeTab] && (
              <div className="p-10 md:p-14">
                <div className="flex items-center justify-between mb-12">
                   <div>
                      <h4 className="text-xl font-black text-baccarim-text">{activeTab.split('-')[1]}</h4>
                      <p className="text-xs font-bold text-baccarim-text-muted uppercase tracking-widest mt-1">Configuração de Itens do Check-list</p>
                   </div>
                   <button 
                     onClick={() => setShowAddItemForm(true)}
                     className="py-4 px-8 bg-baccarim-hover text-baccarim-blue hover:text-white hover:bg-baccarim-blue rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                   >
                     <i className="fas fa-plus mr-2"></i>
                     Adicionar Item
                   </button>
                </div>

                {showAddItemForm && (
                  <div className="mb-12 bg-baccarim-hover/50 p-10 rounded-[2.5rem] border border-baccarim-blue/30 animate-in slide-in-from-top-4">
                    <form onSubmit={handleAddItem} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-4">Nome da Etapa / Documento</label>
                           <input 
                             autoFocus
                             className="w-full bg-baccarim-card border border-baccarim-border p-5 rounded-2xl text-sm font-bold text-baccarim-text focus:border-baccarim-blue outline-none"
                             value={newItem.label}
                             onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                             placeholder="Ex: Protocolo de Anuência..."
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-4">Categoria</label>
                           <select 
                             className="w-full bg-baccarim-card border border-baccarim-border p-5 rounded-2xl text-sm font-bold text-baccarim-text outline-none"
                             value={newItem.category}
                             onChange={(e) => setNewItem({...newItem, category: e.target.value as ChecklistItem['category']})}
                           >
                             <option value="Legal">Documentação Legal</option>
                             <option value="Technical">Etapa Técnica</option>
                             <option value="Environment">Órgão Ambiental</option>
                           </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-4">Instruções Curtas</label>
                         <textarea 
                           className="w-full bg-baccarim-card border border-baccarim-border p-5 rounded-2xl text-sm font-bold text-baccarim-text min-h-[100px] outline-none"
                           value={newItem.description}
                           onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                           placeholder="O que o engenheiro precisa saber sobre este item?"
                         ></textarea>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddItemForm(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-baccarim-text-muted hover:text-baccarim-text">Cancelar</button>
                        <button type="submit" className="px-10 py-4 bg-baccarim-blue text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-baccarim-blue/20">Salvar Item</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-12">
                   {Array.from(new Set(templates[activeTab].map(i => i.category))).map((cat, catIdx, allCats) => {
                     const items = templates[activeTab].filter(i => i.category === cat);
                     if (items.length === 0) return null;
                     
                     const displayTitle = cat === 'Legal' ? 'Documentação Legal' : 
                                        cat === 'Technical' ? 'Etapas Técnicas' : 
                                        cat === 'Environment' ? 'Gestão Ambiental' : cat;

                     return (
                       <div key={cat} className="space-y-6 group/cat">
                         <div className="flex items-center justify-between border-b border-baccarim-blue/10 pb-4">
                            <div className="flex items-center space-x-4">
                               <div className="flex flex-col opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => moveCategory(cat, 'up')}
                                    disabled={catIdx === 0}
                                    className="p-1 text-[8px] text-baccarim-blue disabled:opacity-20 hover:scale-125 transition-transform"
                                  >
                                    <i className="fas fa-angles-up"></i>
                                  </button>
                                  <button 
                                    onClick={() => moveCategory(cat, 'down')}
                                    disabled={catIdx === allCats.length - 1}
                                    className="p-1 text-[8px] text-baccarim-blue disabled:opacity-20 hover:scale-125 transition-transform"
                                  >
                                    <i className="fas fa-angles-down"></i>
                                  </button>
                               </div>
                               <h5 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.3em]">{displayTitle}</h5>
                            </div>
                            <button onClick={() => setCategoryToDelete(cat)} className="text-[8px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors">Excluir Seção</button>
                         </div>
                         <div className="grid grid-cols-1 gap-3">
                           {items.map((item, idx) => (
                             <div key={item.id} className="group flex items-center justify-between p-5 bg-baccarim-hover/30 rounded-2xl border border-baccarim-border hover:border-baccarim-blue/30 transition-all">
                                <div className="flex items-center space-x-4">
                                   <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => moveItem(item.id, 'up')}
                                        disabled={idx === 0}
                                        className="p-1 text-[10px] text-baccarim-text-muted hover:text-baccarim-blue disabled:opacity-20"
                                      >
                                        <i className="fas fa-chevron-up"></i>
                                      </button>
                                      <button 
                                        onClick={() => moveItem(item.id, 'down')}
                                        disabled={idx === items.length - 1}
                                        className="p-1 text-[10px] text-baccarim-text-muted hover:text-baccarim-blue disabled:opacity-20"
                                      >
                                        <i className="fas fa-chevron-down"></i>
                                      </button>
                                   </div>
                                   <div className="flex-1 min-w-0 pr-4">
                                      <input 
                                        className="w-full bg-transparent text-sm font-bold text-baccarim-text outline-none focus:text-baccarim-blue"
                                        value={item.label}
                                        onChange={(e) => updateItemLabel(item.id, e.target.value)}
                                      />
                                      <p className="text-[10px] text-baccarim-text-muted font-medium mt-0.5 truncate">{item.description || 'Sem descrição.'}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => setItemToDelete({ id: item.id, label: item.label })}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-baccarim-text-muted hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <i className="fas fa-trash-can text-xs"></i>
                                </button>
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   })}

                   {!templates[activeTab].length && (
                     <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-baccarim-hover rounded-full flex items-center justify-center mx-auto mb-6 text-2xl text-baccarim-text-muted/30">
                           <i className="fas fa-list-check"></i>
                        </div>
                        <p className="text-sm font-black text-baccarim-text-muted uppercase tracking-widest">Template Vazio</p>
                        <p className="text-xs font-bold text-baccarim-text-muted/50 mt-2">Clique em "Adicionar Item" para montar o check-list deste tipo de projeto.</p>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {settingsTab === 'categories' && (
        <div className="bg-baccarim-card rounded-[3rem] shadow-2xl border border-baccarim-border p-10 md:p-14 animate-in fade-in duration-500">
           <div className="max-w-2xl mx-auto space-y-12">
              <div className="text-center">
                 <h3 className="text-xl font-black text-baccarim-text">Tipos de Empreendimento</h3>
                 <p className="text-xs font-bold text-baccarim-text-muted uppercase tracking-widest mt-2">Gerencie as categorias de projetos da empresa</p>
              </div>

              <form onSubmit={handleAddProjectCategory} className="flex gap-4">
                 <input 
                   placeholder="Novo tipo (ex: Usina Solar, Silo...)" 
                   className="flex-1 bg-baccarim-hover border border-baccarim-border p-5 rounded-2xl text-sm font-bold text-baccarim-text outline-none"
                   value={newCategoryName}
                   onChange={(e) => setNewCategoryName(e.target.value)}
                 />
                 <button type="submit" className="px-10 py-5 bg-baccarim-blue text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-baccarim-blue/20">Adicionar</button>
              </form>

              <div className="grid grid-cols-1 gap-3">
                 {projectCategories.map((cat, idx) => (
                   <div key={idx} className="group flex items-center justify-between p-5 bg-baccarim-hover/30 rounded-2xl border border-baccarim-border hover:border-baccarim-blue/30 transition-all">
                      <div className="flex items-center space-x-4">
                         <div className="w-8 h-8 rounded-lg bg-baccarim-blue/10 flex items-center justify-center text-baccarim-blue text-[10px] font-black">{idx + 1}</div>
                         {editingCategory === cat ? (
                            <input 
                              autoFocus
                              className="bg-transparent border-b border-baccarim-blue text-sm font-bold text-baccarim-text outline-none"
                              value={tempCategoryName}
                              onChange={(e) => setTempCategoryName(e.target.value)}
                              onBlur={() => {
                                handleUpdateProjectCategory(idx, tempCategoryName);
                                setEditingCategory(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateProjectCategory(idx, tempCategoryName);
                                  setEditingCategory(null);
                                }
                              }}
                            />
                         ) : (
                            <span className="text-sm font-bold text-baccarim-text">{cat}</span>
                         )}
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button 
                           onClick={() => {
                             setEditingCategory(cat);
                             setTempCategoryName(cat);
                           }}
                           className="w-9 h-9 rounded-xl flex items-center justify-center text-baccarim-text-muted hover:bg-baccarim-blue hover:text-white transition-all"
                         >
                           <i className="fas fa-pen text-[10px]"></i>
                         </button>
                         <button 
                           onClick={() => handleDeleteProjectCategory(cat)}
                           className="w-9 h-9 rounded-xl flex items-center justify-center text-baccarim-text-muted hover:bg-red-500 hover:text-white transition-all"
                         >
                           <i className="fas fa-trash-can text-[10px]"></i>
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Re-adding the missing modals for removal */}
      {typeToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 border border-baccarim-border-hover">
            <h3 className="text-xl font-black text-baccarim-text mb-2">Excluir Template?</h3>
            <p className="text-xs text-baccarim-text-muted mb-8 leading-relaxed">Isso removerá todo o template "{typeToDelete.split('-')[1]}" e seus itens permanentemente.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setTypeToDelete(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={confirmRemoveType} className="py-4 bg-red-500 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">Excluir Tudo</button>
            </div>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 border border-baccarim-border-hover">
            <h3 className="text-xl font-black text-baccarim-text mb-2">Excluir Seção?</h3>
            <p className="text-xs text-baccarim-text-muted mb-8 leading-relaxed">Remover todos os itens da categoria "{categoryToDelete}" deste template?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCategoryToDelete(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={confirmRemoveCategory} className="py-4 bg-red-500 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">Excluir Itens</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppSettingsView;


import React, { useState } from 'react';
import { ChecklistItem } from '../types';

interface ChecklistSettingsViewProps {
  templates: Record<string, ChecklistItem[]>;
  onUpdateTemplates: (newTemplates: Record<string, ChecklistItem[]>) => void;
  projectCategories: string[];
  onUpdateProjectCategories: (categories: string[]) => void;
}

const ChecklistSettingsView: React.FC<ChecklistSettingsViewProps> = ({ templates, onUpdateTemplates, projectCategories, onUpdateProjectCategories }) => {
  const [selectedAgency, setSelectedAgency] = useState<'SEMA' | 'IAT'>('SEMA');
  const [settingsTab, setSettingsTab] = useState<'checklists' | 'categories'>('checklists');
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

  const handleAgencyChange = (agency: 'IAT' | 'SEMA') => {
    setSelectedAgency(agency);
    const newFiltered = Object.keys(templates).filter(key => key.startsWith(agency));
    if (newFiltered.length > 0) {
      setActiveTab(newFiltered[0]);
    } else {
      setActiveTab('');
    }
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

      {typeToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 border border-baccarim-border-hover">
            <h3 className="text-xl font-black text-baccarim-text mb-2">Excluir Checklist Inteiro?</h3>
            <p className="text-xs text-baccarim-text-muted mb-8 leading-relaxed">Você vai apagar todos os itens do template "{typeToDelete}".</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setTypeToDelete(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={confirmRemoveType} className="py-4 bg-red-500 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">Apagar Tudo</button>
            </div>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 border border-baccarim-border-hover">
            <h3 className="text-xl font-black text-baccarim-text mb-2">Excluir Categoria?</h3>
            <p className="text-xs text-baccarim-text-muted mb-8 leading-relaxed">Deseja excluir a categoria "{categoryToDelete}" e TODOS os seus itens deste template?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCategoryToDelete(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={confirmRemoveCategory} className="py-4 bg-red-500 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-baccarim-text tracking-tight">Configurações Mestras</h2>
          <p className="text-baccarim-text-muted font-medium">Gerencie templates de checklist e tipos de empreendimento.</p>
          
          <div className="flex gap-4 mt-6">
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

        {settingsTab === 'checklists' && (
          <div className="flex flex-col gap-4">
            <div className="flex bg-baccarim-hover p-1 rounded-xl border border-baccarim-border w-fit self-end">
              <button 
                onClick={() => handleAgencyChange('SEMA')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedAgency === 'SEMA' ? 'bg-baccarim-blue text-baccarim-text shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
              >
                SEMA
              </button>
              <button 
                onClick={() => handleAgencyChange('IAT')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedAgency === 'IAT' ? 'bg-baccarim-blue text-baccarim-text shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
              >
                IAT
              </button>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowNewTypeForm(true)}
                className="bg-baccarim-hover border border-baccarim-border-hover text-baccarim-text px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-baccarim-active transition-all"
              >
                + Criar Novo Tipo
              </button>
              <button 
                onClick={() => setShowAddItemForm(true)}
                className="bg-baccarim-green text-baccarim-text px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-green/20 hover:-translate-y-1 transition-all"
              >
                + Adicionar Item ao Atual
              </button>
            </div>
          </div>
        )}
      </div>

      {settingsTab === 'checklists' ? (
        <div className="bg-baccarim-card rounded-[3rem] shadow-2xl border border-baccarim-border overflow-hidden flex flex-col md:flex-row h-[70vh]">
          {/* Sidebar de Abas (Checklists) */}
          <div className="w-full md:w-72 bg-baccarim-hover border-r border-baccarim-border p-6 flex md:flex-col gap-2 overflow-x-auto no-scrollbar">
            {filteredTabs.map(type => (
              <div key={type} className="flex gap-1 group/type">
                <button
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 text-left p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === type ? 'bg-baccarim-blue text-baccarim-text shadow-lg' : 'text-baccarim-text-muted hover:bg-baccarim-hover'
                  }`}
                >
                  {type.replace(`${selectedAgency}-`, '')}
                </button>
                <button 
                  onClick={() => setTypeToDelete(type)}
                  className="w-10 rounded-2xl bg-baccarim-hover border border-baccarim-border text-baccarim-text-muted hover:text-red-500 flex items-center justify-center opacity-0 group-hover/type:opacity-100 transition-opacity"
                >
                  <i className="fas fa-trash-can text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Lista de Itens do Checklist Selecionado */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="flex items-center justify-between mb-8 border-b border-baccarim-border pb-5">
              <div>
                <h3 className="text-xl font-black text-baccarim-text">{activeTab.replace(`${selectedAgency}-`, '')}</h3>
                <p className="text-[10px] text-baccarim-text-muted font-bold uppercase tracking-widest mt-1">
                  {templates[activeTab]?.length || 0} Itens ativos neste modelo ({selectedAgency})
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {Array.from(new Set(templates[activeTab]?.map(i => i.category) || [])).map(cat => {
                const items = templates[activeTab]?.filter(i => i.category === cat) || [];
                if (items.length === 0 && activeTab) return null;
                
                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center justify-between group/cat">
                      {editingCategory === cat ? (
                        <input
                          autoFocus
                          value={tempCategoryName}
                          onChange={(e) => setTempCategoryName(e.target.value)}
                          onBlur={() => {
                            if (tempCategoryName.trim() && tempCategoryName !== cat) {
                              const updated = {
                                ...templates,
                                [activeTab]: templates[activeTab].map(item => 
                                  item.category === cat ? { ...item, category: tempCategoryName.trim() } : item
                                )
                              };
                              onUpdateTemplates(updated);
                            }
                            setEditingCategory(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (tempCategoryName.trim() && tempCategoryName !== cat) {
                                const updated = {
                                  ...templates,
                                  [activeTab]: templates[activeTab].map(item => 
                                    item.category === cat ? { ...item, category: tempCategoryName.trim() } : item
                                  )
                                };
                                onUpdateTemplates(updated);
                              }
                              setEditingCategory(null);
                            }
                          }}
                          className="bg-baccarim-hover border border-baccarim-blue p-1 rounded text-[9px] font-black text-baccarim-blue uppercase tracking-[0.2em] outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-[9px] font-black text-baccarim-blue uppercase tracking-[0.2em]">{cat}</h4>
                          <button 
                            onClick={() => {
                              setEditingCategory(cat);
                              setTempCategoryName(cat);
                            }}
                            className="opacity-0 group-hover/cat:opacity-100 text-baccarim-text-muted hover:text-baccarim-blue transition-all"
                          >
                            <i className="fas fa-pen text-[8px]"></i>
                          </button>
                          <button 
                            onClick={() => setCategoryToDelete(cat)}
                            className="opacity-0 group-hover/cat:opacity-100 text-baccarim-text-muted hover:text-red-500 transition-all"
                          >
                            <i className="fas fa-trash-can text-[8px]"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3">
                      {items.map(item => (
                        <div key={item.id} className="group flex items-center bg-baccarim-hover p-4 rounded-2xl border border-baccarim-border hover:border-baccarim-blue hover:bg-baccarim-active transition-all">
                          <input 
                            value={item.label}
                            onChange={(e) => updateItemLabel(item.id, e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs font-bold text-baccarim-text outline-none"
                          />
                          <button 
                            onClick={() => setItemToDelete({ id: item.id, label: item.label })}
                            className="w-8 h-8 rounded-full text-baccarim-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <i className="fas fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {(!templates[activeTab] || templates[activeTab].length === 0) && (
                <div className="py-20 text-center">
                   <p className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Nenhum item cadastrado para este tipo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-baccarim-card rounded-[3rem] shadow-2xl border border-baccarim-border p-10 md:p-12">
          <div className="flex items-center justify-between mb-10 border-b border-baccarim-border pb-6">
            <div>
              <h3 className="text-xl font-black text-baccarim-text">Tipos de Empreendimento (Campo 12)</h3>
              <p className="text-[10px] text-baccarim-text-muted font-bold uppercase tracking-widest mt-1">
                Gerencie as opções disponíveis para a classificação técnica do empreendimento.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddProjectCategory} className="flex gap-4 mb-10">
            <input 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Novo tipo de empreendimento..."
              className="flex-1 bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue"
            />
            <button 
              type="submit"
              className="bg-baccarim-blue text-baccarim-text px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all"
            >
              Adicionar Opção
            </button>
          </form>

          <div className="grid gap-4">
            {projectCategories.map((category, index) => (
              <div key={index} className="group flex items-center bg-baccarim-hover p-5 rounded-2xl border border-baccarim-border hover:border-baccarim-blue hover:bg-baccarim-active transition-all">
                <div className="w-8 h-8 rounded-lg bg-baccarim-blue/10 text-baccarim-blue flex items-center justify-center font-black text-[10px] mr-4">
                  {index + 1}
                </div>
                <input 
                  value={category}
                  onChange={(e) => handleUpdateProjectCategory(index, e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs font-bold text-baccarim-text outline-none"
                />
                <button 
                  onClick={() => handleDeleteProjectCategory(category)}
                  className="w-10 h-10 rounded-xl text-baccarim-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <i className="fas fa-trash-can text-sm"></i>
                </button>
              </div>
            ))}
            {projectCategories.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-baccarim-border rounded-[2rem]">
                <p className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Nenhuma opção cadastrada.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Criar Novo Tipo */}
      {showNewTypeForm && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 border border-baccarim-border-hover pb-safe">
            <h3 className="text-2xl font-black text-baccarim-text mb-8">Criar Novo Tipo de Checklist</h3>
            <form onSubmit={handleCreateNewType} className="space-y-6 pb-20">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nome do Checklist / Fase</label>
                <input 
                  required 
                  autoFocus
                  value={newTypeName} 
                  onChange={e => setNewTypeName(e.target.value)}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" 
                  placeholder="Ex: Auditoria de Solo" 
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-baccarim-blue text-baccarim-text py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all">Criar Template</button>
                <button type="button" onClick={() => setShowNewTypeForm(false)} className="px-8 bg-baccarim-hover text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-active transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Item */}
      {showAddItemForm && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 border border-baccarim-border-hover pb-safe">
            <h3 className="text-2xl font-black text-baccarim-text mb-2">Novo Item Master</h3>
            <p className="text-[10px] text-baccarim-text-muted font-bold uppercase tracking-widest mb-8">Adicionando em: {activeTab}</p>
            <form onSubmit={handleAddItem} className="space-y-6 pb-20">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Título do Documento / Obrigação</label>
                <input 
                  required 
                  value={newItem.label} 
                  onChange={e => setNewItem({...newItem, label: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" 
                  placeholder="Ex: 40 - Memorial de Cálculo" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Categoria</label>
                <select 
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value as ChecklistItem['category']})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue appearance-none"
                >
                  <option value="Legal" className="bg-baccarim-card">Legal</option>
                  <option value="Técnica" className="bg-baccarim-card">Técnica</option>
                  <option value="Ambiental" className="bg-baccarim-card">Ambiental</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-baccarim-blue text-baccarim-text py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all">Adicionar Item</button>
                <button type="button" onClick={() => setShowAddItemForm(false)} className="px-8 bg-baccarim-hover text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-active transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistSettingsView;

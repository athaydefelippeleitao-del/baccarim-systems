
import React, { useState, useEffect } from 'react';
import { EnvironmentalLicense, LicenseStatus, Project, LicenseType, ChecklistItem, Notification } from '../types';
import ProjectsView from './ProjectsView';
import { utmToDecimal } from '../utils/geoUtils';

interface ClientsViewProps {
  userRole: 'admin' | 'engineer' | 'client';
  clients: string[];
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
  projects: Project[];
  checklistTemplates: Record<string, ChecklistItem[]>;
  projectCategories: string[];
  onUpdateProject: (project: Project) => void;
  onAddProject: (project: Project) => void;
  onAddClient: (clientName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectClient: (clientName: string) => void;
  onDeleteClient: (clientName: string) => void;
  onAddNotification: (notification: Notification) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ userRole, clients, licenses, notifications, projects, checklistTemplates, projectCategories, onUpdateProject, onAddProject, onAddClient, onDeleteProject, onSelectClient, onDeleteClient, onAddNotification }) => {
  const [selectedClientForProjects, setSelectedClientForProjects] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  // Auto-seleção se houver apenas um cliente (usuário cliente)
  useEffect(() => {
    if (userRole === 'client' && clients.length === 1) {
      setSelectedClientForProjects(clients[0]);
    }
  }, [userRole, clients]);

  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    razaoSocial: '',
    cnpj: '',
    location: '',
    currentPhase: LicenseType.LP,
    checklistAgency: 'SEMA' as 'IAT' | 'SEMA',
    specs: {
      areaTotal: '',
      qtdLotes: '',
      areaAPP: '',
      matricula: '',
      projectType: 'Parcelamento do Solo',
      contact: '',
      responsavelLegal: '',
      cpfResponsavel: '',
      sedeEndereco: '',
      orgaoResponsavel: 'SEMA',
      responsavelTecnico: '',
      licencaObtida: 'Nenhuma / Em Requerimento',
      numeroLicenca: '',
      numeroProtocolo: '',
      dataProtocolo: new Date().toLocaleDateString('pt-BR'),
      coordE: '',
      coordN: '',
      zone: 22,
      lat: '',
      lng: ''
    }
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName.trim()) {
      onAddClient(newClientName.trim());
      setNewClientName('');
      setShowNewClientModal(false);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForProjects) return;
    const agency = newProjectForm.checklistAgency;
    const templateKey = `${agency}-${newProjectForm.currentPhase}`;
    const templateItems = checklistTemplates[templateKey] || [];
    const freshChecklist = templateItems.map(item => ({
      ...item,
      id: `${item.id}-${Math.random().toString(36).substr(2, 5)}`,
      isCompleted: false,
      attachedFiles: [],
      comment: ''
    }));

    const specs = {
      ...newProjectForm.specs,
      lat: newProjectForm.specs.lat ? parseFloat(newProjectForm.specs.lat) : undefined,
      lng: newProjectForm.specs.lng ? parseFloat(newProjectForm.specs.lng) : undefined,
      zone: newProjectForm.specs.zone ? parseFloat(newProjectForm.specs.zone as any) : 22,
      licencaASerObtida: newProjectForm.currentPhase,
      isDeferred: false
    };

    // Conversão automática se UTM estiver presente
    if (specs.coordE && specs.coordN) {
      const e = parseFloat(specs.coordE.replace(/[^\d.]/g, ''));
      const n = parseFloat(specs.coordN.replace(/[^\d.]/g, ''));
      const zone = specs.zone || 22;
      if (!isNaN(e) && !isNaN(n)) {
        const converted = utmToDecimal(e, n, zone);
        specs.lat = converted.lat;
        specs.lng = converted.lng;
      }
    }

    const newProject: Project = {
      id: `pr-${Date.now()}`,
      name: newProjectForm.name,
      razaoSocial: newProjectForm.razaoSocial,
      cnpj: newProjectForm.cnpj,
      location: newProjectForm.location,
      clientName: selectedClientForProjects,
      status: 'Em Planejamento',
      progress: 0,
      currentPhase: newProjectForm.currentPhase,
      checklistAgency: agency,
      specs: specs as any,
      checklist: freshChecklist
    };

    onAddProject(newProject);
    setShowNewProjectModal(false);
    setNewProjectForm({
      name: '', razaoSocial: '', cnpj: '', location: '', currentPhase: LicenseType.LP,
      checklistAgency: 'SEMA',
      specs: {
        areaTotal: '', qtdLotes: '', areaAPP: '', matricula: '', projectType: 'Parcelamento do Solo',
        contact: '', responsavelLegal: '', cpfResponsavel: '', sedeEndereco: '', orgaoResponsavel: 'SEMA',
        responsavelTecnico: '', licencaObtida: 'Nenhuma / Em Requerimento',
        numeroLicenca: '',
        numeroProtocolo: '', dataProtocolo: new Date().toLocaleDateString('pt-BR'),
        coordE: '', coordN: '',
        zone: 22,
        lat: '', lng: ''
      }
    });
  };

  if (selectedClientForProjects) {
    const clientProjects = projects.filter(p => p.clientName === selectedClientForProjects);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            {userRole !== 'client' && (
              <button
                onClick={() => setSelectedClientForProjects(null)}
                className="w-12 h-12 rounded-2xl bg-baccarim-hover border border-baccarim-border-hover flex items-center justify-center text-baccarim-text hover:bg-baccarim-active transition-all"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <div>
              <h2 className="text-2xl font-black text-baccarim-text tracking-tight leading-none">{selectedClientForProjects}</h2>
              <p className="text-xs text-baccarim-text-muted font-medium mt-1">Gerenciando {clientProjects.length} empreendimentos.</p>
            </div>
          </div>
          {userRole !== 'client' && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-6 py-3 bg-baccarim-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-baccarim-green transition-all self-start"
            >
              <i className="fas fa-plus mr-2"></i> Novo Empreendimento
            </button>
          )}
        </div>

        <ProjectsView
          projects={clientProjects}
          licenses={licenses}
          notifications={notifications}
          checklistTemplates={checklistTemplates}
          projectCategories={projectCategories}
          onUpdateProject={onUpdateProject}
          onDeleteProject={onDeleteProject}
          onAddNotification={onAddNotification}
        />

        {showNewProjectModal && (
          <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-baccarim-card rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative border border-baccarim-border-hover pb-safe">
              <div className="p-8 md:p-10 border-b border-baccarim-border flex justify-between items-center bg-baccarim-hover">
                <div>
                  <h3 className="text-2xl font-black text-baccarim-text">Cadastrar Empreendimento</h3>
                  <p className="text-xs text-baccarim-text-muted font-bold uppercase tracking-widest mt-1">Cliente: {selectedClientForProjects}</p>
                </div>
                <button onClick={() => setShowNewProjectModal(false)} className="w-10 h-10 rounded-full bg-baccarim-hover flex items-center justify-center text-baccarim-text-muted hover:text-red-500 transition-colors shadow-sm">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar pb-24">
                <form id="new-project-form" onSubmit={handleCreateProject} className="space-y-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em] border-b border-baccarim-border pb-2">1. Identificação Geral</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nome Fantasia do Empreendimento</label>
                        <input required value={newProjectForm.name} onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="Ex: RESIDENCIAL BOULEVARD" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Razão Social (P/ Licenciamento)</label>
                        <input required value={newProjectForm.razaoSocial} onChange={e => setNewProjectForm({ ...newProjectForm, razaoSocial: e.target.value })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="Ex: EMPREENDIMENTOS LTDA" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">CNPJ</label>
                        <input required value={newProjectForm.cnpj} onChange={e => setNewProjectForm({ ...newProjectForm, cnpj: e.target.value })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="00.000.000/0001-00" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Localização / Endereço da Obra</label>
                        <input required value={newProjectForm.location} onChange={e => setNewProjectForm({ ...newProjectForm, location: e.target.value })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="Rua, Número, Bairro, Cidade/UF" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em] border-b border-baccarim-border pb-2">2. Especificações Técnicas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Área Total (m²)</label>
                        <input value={newProjectForm.specs.areaTotal} onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, areaTotal: e.target.value } })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="42.500 m²" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Qtd Lotes / UH</label>
                        <input value={newProjectForm.specs.qtdLotes} onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, qtdLotes: e.target.value } })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="120" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1 flex items-center">
                          Latitude (Mapa)
                          <span className="ml-2 text-[7px] text-baccarim-blue animate-pulse">Obrigatório p/ Mapa</span>
                        </label>
                        <input value={newProjectForm.specs.lat} onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, lat: e.target.value } })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="Ex: -23.3283" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1 flex items-center">
                          Longitude (Mapa)
                          <span className="ml-2 text-[7px] text-baccarim-blue animate-pulse">Obrigatório p/ Mapa</span>
                        </label>
                        <input value={newProjectForm.specs.lng} onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, lng: e.target.value } })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="Ex: -51.1963" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Coordenada UTM (E)</label>
                        <input value={newProjectForm.specs.coordE} onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, coordE: e.target.value } })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="Ex: 479850" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Coordenada UTM (N)</label>
                        <input value={newProjectForm.specs.coordN} onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, coordN: e.target.value } })} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue" placeholder="Ex: 7419200" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Zona UTM</label>
                        <select
                          value={newProjectForm.specs.zone || 22}
                          onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, zone: parseInt(e.target.value) } })}
                          className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue appearance-none"
                        >
                          {[21, 22, 23, 24, 25].map(z => <option key={z} value={z} className="bg-baccarim-card">{z}S</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-baccarim-green uppercase tracking-[0.2em] border-b border-baccarim-border pb-2 flex items-center">
                      <i className="fas fa-leaf mr-2"></i> 4. Configuração Ambiental Inicial
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-baccarim-green/5 p-6 rounded-2xl border border-emerald-500/10">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Licença Obtida</label>
                        <select
                          value={newProjectForm.specs.licencaObtida}
                          onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, licencaObtida: e.target.value } })}
                          className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue appearance-none"
                        >
                          <option value="Nenhuma / Em Requerimento" className="bg-baccarim-card">Nenhuma / Em Requerimento</option>
                          <option value="Licença Prévia (LP)" className="bg-baccarim-card">Licença Prévia (LP)</option>
                          <option value="Licença de Instalação (LI)" className="bg-baccarim-card">Licença de Instalação (LI)</option>
                          <option value="Licença Ambiental Simplificada (LAS)" className="bg-baccarim-card">Licença Ambiental Simplificada (LAS)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Número da Licença</label>
                        <input
                          value={newProjectForm.specs.numeroLicenca}
                          onChange={e => setNewProjectForm({ ...newProjectForm, specs: { ...newProjectForm.specs, numeroLicenca: e.target.value } })}
                          className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue"
                          placeholder="Ex: 12345/2024"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Fase de Licenciamento Atual (Checklist)</label>
                        <select
                          value={newProjectForm.currentPhase}
                          onChange={e => setNewProjectForm({ ...newProjectForm, currentPhase: e.target.value as LicenseType })}
                          className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue appearance-none"
                        >
                          {Object.keys(checklistTemplates)
                            .filter(key => key.startsWith(newProjectForm.checklistAgency))
                            .map(key => {
                              const phase = key.replace(`${newProjectForm.checklistAgency}-`, '');
                              return (
                                <option key={key} value={phase} className="bg-baccarim-card">
                                  {phase}
                                </option>
                              );
                            })
                          }
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Órgão do Checklist (Modelo)</label>
                        <div className="flex bg-baccarim-hover p-1 rounded-xl border border-baccarim-border">
                          <button
                            type="button"
                            onClick={() => setNewProjectForm({ ...newProjectForm, checklistAgency: 'SEMA' })}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newProjectForm.checklistAgency === 'SEMA' ? 'bg-baccarim-blue text-white shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
                          >
                            SEMA
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewProjectForm({ ...newProjectForm, checklistAgency: 'IAT' })}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newProjectForm.checklistAgency === 'IAT' ? 'bg-baccarim-blue text-white shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
                          >
                            IAT
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 md:p-10 border-t border-baccarim-border bg-baccarim-hover flex justify-end items-center gap-4">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="px-8 py-4 bg-baccarim-hover text-baccarim-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest border border-baccarim-border hover:bg-baccarim-active transition-colors">Cancelar</button>
                <button form="new-project-form" type="submit" className="px-12 py-4 bg-baccarim-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all">Criar Empreendimento</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-baccarim-text tracking-tighter leading-none">Gestão de Clientes</h2>
          <p className="text-xs md:text-sm text-baccarim-text-muted font-medium mt-2">Gerencie e cadastre novos clientes estratégicos da Baccarim.</p>
        </div>
        {userRole !== 'client' && (
          <button
            onClick={() => setShowNewClientModal(true)}
            className="px-8 py-4 bg-baccarim-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Novo Cliente
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...clients].sort((a, b) => a.localeCompare(b)).map(client => {
          const clientLicenses = licenses.filter(l => l.clientName === client);
          const clientProjectsCount = projects.filter(p => p.clientName === client).length;

          return (
            <div
              key={client}
              className="bg-baccarim-card rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-baccarim-border hover:border-baccarim-blue/20 hover:-translate-y-1 transition-all duration-500 group cursor-pointer flex flex-col relative overflow-hidden"
              onClick={() => {
                setSelectedClientForProjects(client);
                onSelectClient(client);
              }}
            >
              <div className="flex items-start justify-between mb-8 md:mb-10 relative z-10">
                <div className="flex items-center space-x-4 md:space-x-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-baccarim-blue/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-baccarim-blue font-black text-2xl md:text-3xl shadow-lg transition-all duration-500 group-hover:bg-baccarim-blue group-hover:text-white group-hover:rotate-3">
                    {client.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-baccarim-text tracking-tight group-hover:text-baccarim-blue transition-colors duration-500">{client}</h3>
                    <p className="text-[9px] text-baccarim-text-muted font-black uppercase tracking-widest mt-1">Cliente Estratégico</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="w-10 h-10 rounded-full bg-baccarim-green border-2 border-baccarim-dark flex flex-col items-center justify-center text-baccarim-text text-[10px] font-black shadow-md shrink-0">
                    {clientProjectsCount}
                  </div>
                  {userRole !== 'client' && (
                    <button onClick={(e) => { e.stopPropagation(); onDeleteClient(client); }} className="p-2 text-baccarim-text-muted hover:text-red-500 transition-colors" title="Excluir Cliente"><i className="fas fa-trash-can text-sm"></i></button>
                  )}
                </div>
              </div>

              <div className="mb-8 md:mb-10 relative z-10">
                <div className="bg-baccarim-hover p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-baccarim-border group-hover:bg-baccarim-active group-hover:border-baccarim-blue/10 transition-all duration-500">
                  <p className="text-[8px] md:text-[9px] text-baccarim-text-muted font-black uppercase tracking-widest mb-1">Total Licenças</p>
                  <p className="text-xl md:text-2xl font-black text-baccarim-text">{clientLicenses.length}</p>
                </div>
              </div>

              <div className="mt-auto pt-6 md:pt-8 border-t border-baccarim-border relative z-10">
                <div className="flex items-center justify-between text-baccarim-text group-hover:text-baccarim-blue transition-all duration-500">
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">Ver Empreendimentos</span>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-baccarim-border-hover flex items-center justify-center group-hover:bg-baccarim-blue group-hover:text-white group-hover:border-baccarim-blue transition-all duration-500">
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNewClientModal && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 relative border border-baccarim-border-hover pb-safe">
            <h3 className="text-2xl font-black text-baccarim-text mb-8">Novo Cliente Estratégico</h3>
            <form onSubmit={handleCreateClient} className="space-y-6 pb-20">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nome do Cliente</label>
                <input
                  required
                  autoFocus
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text"
                  placeholder="Ex: Grupo Paysage"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-baccarim-blue text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-green transition-all">Cadastrar Cliente</button>
                <button type="button" onClick={() => setShowNewClientModal(false)} className="px-8 bg-baccarim-hover text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-active transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;

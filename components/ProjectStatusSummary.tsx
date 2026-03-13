
import React, { useState, useRef } from 'react';
import { Project, EnvironmentalLicense, Notification, LicenseStatus } from '../types';

interface ProjectStatusSummaryProps {
  projects: Project[];
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
}

const ProjectStatusSummary: React.FC<ProjectStatusSummaryProps> = ({ projects, licenses, notifications }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [clientFilter, setClientFilter] = useState<string>('todos');
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedNotifs = selectedProjectId ? notifications.filter(n => n.projectId === selectedProjectId) : [];

  // Filter Logic
  const uniqueStatuses = Array.from(new Set(projects.map(p => p.status)));
  const uniqueClients = Array.from(new Set(projects.map(p => p.clientName)));

  const filteredProjects = projects.filter(p => {
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchClient = clientFilter === 'todos' || p.clientName === clientFilter;
    return matchStatus && matchClient;
  });

  const handleExportPDF = () => {
    if (!containerRef.current) return;
    setIsExporting(true);

    const element = containerRef.current;
    const opt = {
      margin: 10,
      filename: `Baccarim-Status-Projetos-${new Date().toLocaleDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#f8f9fa'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Use window.html2pdf if available or any global reference
    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      html2pdf().from(element).set(opt).save().finally(() => {
        setIsExporting(false);
      });
    } else {
      console.error('html2pdf not found');
      setIsExporting(false);
      alert('Erro: Biblioteca de exportação não carregada.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-baccarim-card/50 p-6 rounded-[2rem] border border-baccarim-border backdrop-blur-md sticky top-0 z-[50]">
        <div className="flex items-center space-x-3 bg-baccarim-navy/40 px-5 py-3 rounded-2xl border border-baccarim-border">
          <i className="fas fa-filter text-[10px] text-baccarim-blue"></i>
          <span className="text-[9px] font-black text-baccarim-text opacity-90 uppercase tracking-widest">Filtrar por:</span>
        </div>

        {/* Status Filter */}
        <div className="relative group">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-baccarim-navy/60 text-baccarim-text text-[10px] font-black px-6 py-3 pr-10 rounded-2xl border border-baccarim-border focus:border-baccarim-blue/50 outline-none transition-all cursor-pointer hover:bg-baccarim-active uppercase tracking-widest"
          >
            <option value="todos">Todos os Status</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-baccarim-text-muted pointer-events-none group-hover:text-baccarim-blue transition-colors"></i>
        </div>

        {/* Client Filter */}
        <div className="relative group">
          <select 
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="appearance-none bg-baccarim-navy/60 text-baccarim-text text-[10px] font-black px-6 py-3 pr-10 rounded-2xl border border-baccarim-border focus:border-baccarim-blue/50 outline-none transition-all cursor-pointer hover:bg-baccarim-active uppercase tracking-widest"
          >
            <option value="todos">Todos os Clientes</option>
            {uniqueClients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-baccarim-text-muted pointer-events-none group-hover:text-baccarim-blue transition-colors"></i>
        </div>

        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`ml-auto flex items-center space-x-3 bg-baccarim-blue text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-baccarim-green transition-all transform active:scale-95 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExporting ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-file-pdf"></i>
          )}
          <span>{isExporting ? 'Gerando...' : 'Exportar PDF'}</span>
        </button>

        {/* Active Filters Counter */}
        {(statusFilter !== 'todos' || clientFilter !== 'todos') && (
          <button 
            onClick={() => { setStatusFilter('todos'); setClientFilter('todos'); }}
            className="flex items-center space-x-2 text-[9px] font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
          >
            <i className="fas fa-times-circle"></i>
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      {/* Grid container to be exported */}
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
        {filteredProjects.map(project => {
          const projectLicenses = licenses.filter(l => l.clientName === project.clientName && l.name.includes(project.name));
          const activeLicense = projectLicenses.find(l => l.status === LicenseStatus.ACTIVE);
          const projectNotifs = notifications.filter(n => n.projectId === project.id);
          const openNotifs = projectNotifs.filter(n => n.status === 'Open');
          
          return (
            <div key={project.id} className="bg-baccarim-card rounded-[2.5rem] p-8 shadow-2xl border border-baccarim-border hover:border-baccarim-blue/30 transition-all duration-500 group relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-baccarim-blue/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-baccarim-blue/10 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-baccarim-blue/10 flex items-center justify-center text-baccarim-blue shadow-inner group-hover:scale-110 transition-transform">
                    <i className="fas fa-building text-xl"></i>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${
                      project.status === 'Concluído' ? 'bg-baccarim-green text-white shadow-[0_2px_10px_rgba(0,176,142,0.3)]' : 
                      project.status === 'Em Execução' ? 'bg-baccarim-blue text-white shadow-[0_2px_10px_rgba(63,169,245,0.3)]' : 
                      'bg-baccarim-navy text-white'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-black text-baccarim-text tracking-tight mb-1 group-hover:text-baccarim-blue transition-colors">{project.name}</h3>
                  <p className="text-[9px] font-black text-baccarim-text opacity-70 uppercase tracking-[0.2em]">{project.clientName}</p>
                </div>

                <div className="space-y-6 flex-1">
                  {/* Progress Section */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[9px] font-black text-baccarim-text opacity-70 uppercase tracking-widest">Conformidade Legal</span>
                      <span className="text-xs font-black text-baccarim-blue">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-baccarim-hover rounded-full overflow-hidden border border-baccarim-border">
                      <div 
                        className="h-full bg-gradient-to-r from-baccarim-blue to-baccarim-green transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(63,169,245,0.3)]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-baccarim-hover/50 p-4 rounded-2xl border border-baccarim-border group-hover:bg-baccarim-active transition-colors">
                      <p className="text-[7px] font-black text-baccarim-text opacity-60 uppercase tracking-widest mb-1">Fase Atual</p>
                      <p className="text-[10px] font-black text-baccarim-blue leading-tight uppercase">{project.currentPhase || 'N/A'}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedProjectId(project.id)}
                      className="bg-baccarim-hover/50 p-4 rounded-2xl border border-baccarim-border group-hover:bg-baccarim-blue/10 group-hover:border-baccarim-blue/40 transition-all text-left"
                    >
                      <p className="text-[7px] font-black text-baccarim-text opacity-60 uppercase tracking-widest mb-1">Pendências</p>
                      <div className="flex items-center space-x-2">
                        <p className={`text-[10px] font-black leading-tight ${openNotifs.length > 0 ? 'text-rose-500' : 'text-baccarim-green'}`}>
                          {openNotifs.length} {openNotifs.length === 1 ? 'Aberta' : 'Abertas'}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* License Badge */}
                  {activeLicense ? (
                    <div className="flex items-center space-x-3 bg-baccarim-green/5 p-4 rounded-2xl border border-emerald-500/10">
                      <div className="w-8 h-8 rounded-xl bg-baccarim-green/20 flex items-center justify-center text-baccarim-green">
                        <i className="fas fa-certificate text-xs"></i>
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-baccarim-green/70 uppercase tracking-widest leading-none mb-1">Licença Ativa</p>
                        <p className="text-[9px] font-black text-baccarim-text truncate w-32 uppercase">{activeLicense.name.split(' - ')[1] || activeLicense.type}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 bg-baccarim-navy/30 p-4 rounded-2xl border border-baccarim-border">
                      <div className="w-8 h-8 rounded-xl bg-baccarim-hover flex items-center justify-center text-baccarim-blue">
                        <i className="fas fa-clock text-xs"></i>
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-baccarim-text opacity-60 uppercase tracking-widest leading-none mb-1">Status Legal</p>
                        <p className="text-[9px] font-black text-baccarim-text uppercase">Em Tramitação</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-baccarim-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-black text-baccarim-text opacity-60 uppercase tracking-widest">Protocolo SEI: {project.specs.numeroProtocolo || 'N/D'}</span>
                  <i className="fas fa-arrow-right text-baccarim-blue text-xs"></i>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center bg-baccarim-card/30 rounded-[3rem] border border-dashed border-baccarim-border">
            <div className="w-16 h-16 bg-baccarim-navy/50 text-baccarim-text-muted rounded-full flex items-center justify-center mx-auto mb-6 text-xl">
              <i className="fas fa-search"></i>
            </div>
            <h3 className="text-xl font-black text-baccarim-text">Nenhum empreendimento encontrado</h3>
            <p className="text-xs text-baccarim-text-muted mt-2 uppercase tracking-widest">Tente ajustar os filtros acima para ver outros resultados.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-baccarim-dark/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-2xl shadow-2xl border border-baccarim-border relative overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="p-10 border-b border-baccarim-border bg-baccarim-navy/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-black text-baccarim-text tracking-tighter">{selectedProject.name}</h2>
                  <p className="text-xs font-black text-baccarim-blue uppercase tracking-[0.3em] mt-2">Detalhamento de Pendências</p>
                </div>
                <button 
                  onClick={() => setSelectedProjectId(null)}
                  className="w-12 h-12 rounded-2xl bg-baccarim-hover flex items-center justify-center text-baccarim-text-muted hover:text-baccarim-text hover:bg-baccarim-active transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-6">
                <div className="bg-baccarim-blue/10 px-4 py-2 rounded-xl border border-baccarim-blue/20">
                  <p className="text-[8px] font-black text-baccarim-blue uppercase tracking-widest">Protocolo SEI Principal</p>
                  <p className="text-[12px] font-black text-baccarim-text">{selectedProject.specs.numeroProtocolo || 'Não Identificado'}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar space-y-6">
              {selectedNotifs.length > 0 ? (
                selectedNotifs.map(notif => (
                  <div key={notif.id} className="bg-baccarim-hover/30 rounded-3xl p-8 border border-baccarim-border hover:border-baccarim-blue/20 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${notif.status === 'Open' ? 'bg-rose-500 animate-pulse' : 'bg-baccarim-green'}`}></div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${notif.status === 'Open' ? 'text-rose-500' : 'text-baccarim-green'}`}>
                          {notif.status === 'Open' ? 'Pendente' : 'Atendida'}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest bg-baccarim-navy px-3 py-1 rounded-lg">
                        {notif.agency}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-baccarim-text mb-2">{notif.title}</h4>
                    <p className="text-xs text-baccarim-text-muted leading-relaxed mb-6">{notif.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-baccarim-card/50 p-4 rounded-2xl border border-baccarim-border">
                        <p className="text-[7px] font-black text-baccarim-text-muted uppercase tracking-widest mb-1">Prazo de Complementação</p>
                        <p className="text-[11px] font-black text-baccarim-text">{notif.deadline || 'A definir'}</p>
                      </div>
                      <div className="bg-baccarim-card/50 p-4 rounded-2xl border border-baccarim-border">
                        <p className="text-[7px] font-black text-baccarim-text-muted uppercase tracking-widest mb-1">Data Recebimento</p>
                        <p className="text-[11px] font-black text-baccarim-text">{notif.dateReceived}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-baccarim-green/10 text-baccarim-green rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                    <i className="fas fa-check-double"></i>
                  </div>
                  <h3 className="text-xl font-black text-baccarim-text">Nenhuma pendência crítica</h3>
                  <p className="text-xs text-baccarim-text-muted mt-2">O empreendimento está em total conformidade legal até o momento.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-baccarim-border bg-baccarim-navy/10 flex justify-end">
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="px-10 py-4 bg-baccarim-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-baccarim-green transition-all"
              >
                Concluir Visão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatusSummary;


import React, { useState } from 'react';
import { Project, EnvironmentalLicense, Notification, LicenseStatus } from '../types';

interface ProjectStatusSummaryProps {
  projects: Project[];
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
}

const ProjectStatusSummary: React.FC<ProjectStatusSummaryProps> = ({ projects, licenses, notifications }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedNotifs = selectedProjectId ? notifications.filter(n => n.projectId === selectedProjectId) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {projects.map(project => {
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
                    project.status === 'Concluído' ? 'bg-baccarim-green/20 text-baccarim-green border border-emerald-500/20' : 
                    project.status === 'Em Execução' ? 'bg-baccarim-blue/20 text-baccarim-blue border border-baccarim-blue/20' : 
                    'bg-baccarim-navy text-baccarim-text-muted border border-baccarim-border'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-black text-baccarim-text tracking-tight mb-1 group-hover:text-baccarim-blue transition-colors">{project.name}</h3>
                <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-[0.2em]">{project.clientName}</p>
              </div>

              <div className="space-y-6 flex-1">
                {/* Progress Section */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">Conformidade Legal</span>
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
                    <p className="text-[7px] font-black text-baccarim-text-muted uppercase tracking-widest mb-1">Fase Atual</p>
                    <p className="text-[10px] font-black text-baccarim-text leading-tight uppercase text-baccarim-blue">{project.currentPhase || 'N/A'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedProjectId(project.id)}
                    className="bg-baccarim-hover/50 p-4 rounded-2xl border border-baccarim-border group-hover:bg-baccarim-blue/10 group-hover:border-baccarim-blue/40 transition-all text-left"
                  >
                    <p className="text-[7px] font-black text-baccarim-text-muted uppercase tracking-widest mb-1">Pendências</p>
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
                    <div className="w-8 h-8 rounded-xl bg-baccarim-hover flex items-center justify-center text-baccarim-text-muted">
                      <i className="fas fa-clock text-xs"></i>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-baccarim-text-muted uppercase tracking-widest leading-none mb-1">Status Legal</p>
                      <p className="text-[9px] font-black text-baccarim-text uppercase">Em Tramitação</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-baccarim-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest">Protocolo SEI: {project.specs.numeroProtocolo || 'N/D'}</span>
                <i className="fas fa-arrow-right text-baccarim-blue text-xs"></i>
              </div>
            </div>
          </div>
        );
      })}

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
                className="px-10 py-4 bg-baccarim-blue text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-baccarim-green transition-all"
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

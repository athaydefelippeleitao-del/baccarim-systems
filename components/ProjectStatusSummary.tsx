import React, { useState, useRef } from 'react';
import { Project, EnvironmentalLicense, Notification, LicenseStatus } from '../types';
import ProjectMeetingMinutesView from './ProjectMeetingMinutesView';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProjectStatusSummaryProps {
  projects: Project[];
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
  onUpdateProject?: (project: Project) => void;
  onNavigateToClient?: (clientName: string) => void;
  onNavigateToNotifications?: (projectId: string) => void;
}

const ProjectStatusSummary: React.FC<ProjectStatusSummaryProps> = ({ projects, licenses, notifications, onUpdateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [popoverProjectId, setPopoverProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [clientFilter, setClientFilter] = useState<string>('todos');
  const [isExporting, setIsExporting] = useState(false);
  const [editingCell, setEditingCell] = useState<{ projectId: string, field: string } | null>(null);
  const [meetingMinutesProject, setMeetingMinutesProject] = useState<Project | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedNotifs = selectedProjectId ? notifications.filter(n => n.projectId === selectedProjectId) : [];

  // Filter Logic
  const uniqueStatuses = Array.from(new Set(projects.map(p => p.status)));
  const uniqueClients = Array.from(new Set(projects.map(p => p.clientName))).sort((a, b) => a.localeCompare(b));

  const filteredProjects = projects.filter(p => {
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchClient = clientFilter === 'todos' || p.clientName === clientFilter;
    return matchStatus && matchClient;
  }).sort((a, b) => {
    const clientCompare = (a.clientName || '').localeCompare(b.clientName || '');
    if (clientCompare !== 0) return clientCompare;
    return (a.name || '').localeCompare(b.name || '');
  });

  const handleCellSave = (project: Project, field: string, value: string) => {
    if (onUpdateProject) {
      const updatedProject = { ...project };
      if (['numeroProtocolo', 'responsavelTecnico', 'nomeResponsavel', 'dataProtocolo', 'ultimaMovimentacao'].includes(field)) {
        updatedProject.specs = { ...updatedProject.specs, [field]: value };
      } else {
        (updatedProject as any)[field] = value;
      }
      onUpdateProject(updatedProject);
    }
    setEditingCell(null);
  };

  const handleExportPDF = () => {
    setIsExporting(true);

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Cabeçalho
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // baccarim-navy
      doc.text('RELATÓRIO DE EMPREENDIMENTOS', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em ${new Date().toLocaleDateString()}`, 14, 26);

      // Dados da tabela
      const tableColumn = [
        "Processo / Protocolo", 
        "Status", 
        "Técnico Responsável", 
        "Nome ou Razão Social", 
        "Identificação", 
        "Data do Protocolo", 
        "Última Movimentação", 
        "Tipo de Licença", 
        "Andamento Atual"
      ];
      
      const tableRows: any[] = [];

      filteredProjects.forEach(project => {
        const projectNotifs = notifications.filter(n => n.projectId === project.id);
        const activeLicensesFromNotifs = projectNotifs.filter(n => n.status === 'Open' && n.category === 'Licença');
        const openNotifs = projectNotifs.filter(n => n.status === 'Open' && n.category !== 'Licença');
        
        let statusText = 'OK';
        if (activeLicensesFromNotifs.length > 0) statusText = 'Licença Ativa';
        else if (openNotifs.length > 0) statusText = 'Pendências';

        let lastMove = '-';
        if (projectNotifs.length > 0) {
          const sorted = [...projectNotifs].sort((a, b) => new Date(b.dateReceived || 0).getTime() - new Date(a.dateReceived || 0).getTime());
          if (sorted[0].dateReceived) {
            lastMove = sorted[0].dateReceived;
          }
        }

        tableRows.push([
          { content: (project.specs?.numeroProtocolo || '-').toString().trim(), styles: { halign: 'left' } },
          { content: statusText, styles: { halign: 'center' } },
          { content: (project.specs?.responsavelTecnico || project.specs?.nomeResponsavel || '-').toString().trim(), styles: { halign: 'left' } },
          { content: (project.clientName || (project as any).razaoSocial || '-').toString().trim(), styles: { halign: 'left' } },
          { content: (project.name || '-').toString().trim(), styles: { halign: 'left' } },
          { content: (project.specs?.dataProtocolo || '-').toString().trim(), styles: { halign: 'center' } },
          { content: (project.specs?.ultimaMovimentacao || lastMove).toString().trim(), styles: { halign: 'center' } },
          { content: (project.specs?.licencaObtida || project.specs?.licencaASerObtida || '-').toString().trim(), styles: { halign: 'center' } },
          { content: (project.currentPhase || project.status || '-').toString().trim(), styles: { halign: 'left' } }
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 32,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 35, halign: 'left' },
          1: { cellWidth: 17, halign: 'center' },
          2: { cellWidth: 28, halign: 'left' },
          3: { cellWidth: 33, halign: 'left' },
          4: { cellWidth: 33, halign: 'left' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' },
          7: { cellWidth: 41, halign: 'center' },
          8: { cellWidth: 41, halign: 'left' }
        },
        margin: { top: 32, right: 10, bottom: 15, left: 10 },
      });

      doc.save(`Baccarim-Status-Projetos-${new Date().toLocaleDateString()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Erro ao gerar PDF nativo. Verifique o console.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredProjects.map(project => {
      const projectNotifs = notifications.filter(n => n.projectId === project.id);
      const activeLicensesFromNotifs = projectNotifs.filter(n => n.status === 'Open' && n.category === 'Licença');
      const openNotifs = projectNotifs.filter(n => n.status === 'Open' && n.category !== 'Licença');
      
      let statusText = 'Tudo OK';
      if (activeLicensesFromNotifs.length > 0) statusText = 'Licença Ativa - Semi-concluído';
      else if (openNotifs.length > 0) statusText = 'Com pendências abertas';

      let lastMove = '-';
      if (projectNotifs.length > 0) {
        const sorted = [...projectNotifs].sort((a, b) => new Date(b.dateReceived || 0).getTime() - new Date(a.dateReceived || 0).getTime());
        if (sorted[0].dateReceived) {
          lastMove = sorted[0].dateReceived;
        }
      }

      return {
        'Processo / Protocolo': project.specs?.numeroProtocolo || '-',
        'Status': statusText,
        'Técnico Responsável': project.specs?.responsavelTecnico || project.specs?.nomeResponsavel || '-',
        'Nome ou Razão Social': project.clientName || (project as any).razaoSocial || '-',
        'Identificação': project.name || '-',
        'Data do Protocolo': project.specs?.dataProtocolo || '-',
        'Última Movimentação': project.specs?.ultimaMovimentacao || lastMove,
        'Tipo de Licença': project.specs?.licencaObtida || project.specs?.licencaASerObtida || '-',
        'Andamento Atual': project.currentPhase || project.status || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projetos");
    XLSX.writeFile(workbook, `Baccarim-Status-Projetos-${new Date().toLocaleDateString()}.xlsx`);
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

        <div className="ml-auto flex items-center space-x-2">
          <button 
            onClick={handleExportExcel}
            className="flex items-center space-x-3 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-500 transition-all transform active:scale-95"
          >
            <i className="fas fa-file-excel"></i>
            <span>Baixar Excel</span>
          </button>
          
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center space-x-3 bg-baccarim-blue text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-baccarim-green transition-all transform active:scale-95 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExporting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-file-pdf"></i>
            )}
            <span>{isExporting ? 'Gerando PDF...' : 'Exportar PDF'}</span>
          </button>
        </div>

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
      <div ref={containerRef}>
        <div className="bg-white rounded-[2rem] shadow-2xl border border-baccarim-border overflow-x-auto p-4 md:p-8">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b-2 border-baccarim-navy/20 text-[9px] font-black uppercase tracking-widest text-baccarim-navy bg-baccarim-navy/5">
                  <th className="p-4 rounded-tl-xl">Processo / Protocolo</th>
                  <th className="p-4 w-12 text-center" title="Pendências">Status</th>
                  <th className="p-4">Técnico Responsável</th>
                  <th className="p-4">Nome ou Razão Social</th>
                  <th className="p-4">Identificação</th>
                  <th className="p-4 text-center">Data do Protocolo</th>
                  <th className="p-4 text-center">Última Movimentação</th>
                  <th className="p-4 text-center">Tipo de Licença</th>
                  <th className="p-4">Andamento Atual</th>
                  <th className="p-4 rounded-tr-xl text-center" data-html2canvas-ignore="true">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project, index) => {
                  const projectNotifs = notifications.filter(n => n.projectId === project.id);
                  const openNotifs = projectNotifs.filter(n => n.status === 'Open' && n.category !== 'Licença');
                  const hasPending = openNotifs.length > 0;
                  
                  // In this system, licenses are actually tracked as Notifications with category === 'Licença'
                  const activeLicensesFromNotifs = projectNotifs.filter(n => n.status === 'Open' && n.category === 'Licença');
                  const hasActiveLicense = activeLicensesFromNotifs.length > 0;

                  let statusColor = 'bg-baccarim-green border-emerald-600';
                  let statusTitle = 'Tudo OK (Clique para ver)';
                  
                  if (hasActiveLicense) {
                    statusColor = 'bg-yellow-400 border-yellow-500';
                    statusTitle = 'Licença Ativa - Semi-concluído (Clique para ver)';
                  } else if (hasPending) {
                    statusColor = 'bg-red-500 border-red-600';
                    statusTitle = 'Com pendências abertas (Clique para ver)';
                  }
                  
                  let lastMove = '-';
                  if (projectNotifs.length > 0) {
                    const sorted = [...projectNotifs].sort((a, b) => new Date(b.dateReceived || 0).getTime() - new Date(a.dateReceived || 0).getTime());
                    if (sorted[0].dateReceived) {
                      lastMove = sorted[0].dateReceived;
                    }
                  }

                  const renderEditableCell = (field: string, value: string, className: string) => {
                    const isEditing = editingCell?.projectId === project.id && editingCell?.field === field;

                    if (isEditing) {
                      return (
                        <input
                          autoFocus
                          defaultValue={value}
                          className={`w-full bg-white text-baccarim-text border-2 border-baccarim-blue rounded px-2 py-1 outline-none shadow-sm ${className}`}
                          onBlur={(e) => handleCellSave(project, field, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave(project, field, e.currentTarget.value);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                        />
                      );
                    }

                    return (
                      <div 
                        className={`cursor-text hover:bg-slate-200/50 rounded px-1 -mx-1 min-h-[1.5rem] flex items-center transition-colors ${className}`}
                        onClick={() => setEditingCell({ projectId: project.id, field })}
                        title="Clique para editar"
                      >
                        {value || '-'}
                      </div>
                    );
                  };

                  return (
                    <tr key={project.id} className={`hover:bg-baccarim-hover transition-colors ${index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                      <td className="p-4 text-xs font-bold text-baccarim-blue whitespace-nowrap">
                        {renderEditableCell('numeroProtocolo', project.specs.numeroProtocolo || '', '')}
                      </td>
                      <td className="p-4 relative">
                        <div
                          className={`w-full h-8 rounded-md shadow-sm border cursor-pointer hover:opacity-80 transition-opacity ${statusColor}`}
                          title={statusTitle}
                          onClick={() => setPopoverProjectId(popoverProjectId === project.id ? null : project.id)}
                        ></div>

                        {/* Inline Popover */}
                        {popoverProjectId === project.id && (() => {
                          const pendingNotifs = projectNotifs.filter(n => n.status === 'Open');
                          return (
                            <div className="absolute left-0 top-full mt-1 z-[200] w-80 bg-baccarim-card border border-baccarim-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className={`px-4 py-3 flex items-center justify-between ${hasPending ? 'bg-red-500' : hasActiveLicense ? 'bg-yellow-400' : 'bg-emerald-500'}`}>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                  {hasPending ? 'Pendências Abertas' : hasActiveLicense ? 'Licença Ativa' : 'Tudo OK'}
                                </span>
                                <button onClick={() => setPopoverProjectId(null)} className="text-white/80 hover:text-white">
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </div>
                              {pendingNotifs.length === 0 ? (
                                <div className="p-4 text-center">
                                  <i className="fas fa-check-circle text-emerald-500 text-2xl mb-2 block"></i>
                                  <p className="text-[11px] font-bold text-baccarim-text-muted">Nenhuma pendência aberta</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-baccarim-border max-h-60 overflow-y-auto">
                                  {pendingNotifs.map(n => (
                                    <div key={n.id} className="px-4 py-3 flex items-start gap-3">
                                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.category === 'Licença' ? 'bg-yellow-400' : n.severity === 'Alta' ? 'bg-red-500' : n.severity === 'Média' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-baccarim-text leading-tight truncate">{n.title}</p>
                                        <p className="text-[9px] text-baccarim-text-muted mt-0.5 uppercase tracking-widest">{n.agency} • {n.category}</p>
                                        {n.deadline && <p className="text-[9px] font-bold text-baccarim-rose mt-0.5">Prazo: {n.deadline}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-[10px] font-bold text-baccarim-text">
                        {renderEditableCell('responsavelTecnico', project.specs.responsavelTecnico || project.specs.nomeResponsavel || '', '')}
                      </td>
                      <td className="p-4 text-[11px] font-black text-baccarim-navy uppercase">
                        {renderEditableCell('clientName', project.clientName || project.razaoSocial || '', '')}
                      </td>
                      <td className="p-4 text-[11px] font-bold text-baccarim-text uppercase">
                        {renderEditableCell('name', project.name, '')}
                      </td>
                      <td className="p-4 text-center text-[10px] font-medium text-baccarim-text-muted whitespace-nowrap">
                        {renderEditableCell('dataProtocolo', project.specs.dataProtocolo || '', 'justify-center')}
                      </td>
                      <td className="p-4 text-center text-[10px] font-medium text-baccarim-text-muted whitespace-nowrap">
                        {renderEditableCell('ultimaMovimentacao', project.specs.ultimaMovimentacao || lastMove, 'justify-center')}
                      </td>
                      <td className="p-4 text-center text-[10px] font-bold text-slate-500 whitespace-nowrap uppercase">
                        {renderEditableCell('licencaObtida', project.specs.licencaObtida || project.specs.licencaASerObtida || '-', 'justify-center')}
                      </td>
                      <td className="p-4 text-[10px] font-black text-baccarim-blue uppercase">
                        {renderEditableCell('currentPhase', project.currentPhase || project.status || '', '')}
                      </td>
                      <td className="p-4 text-center" data-html2canvas-ignore="true">
                        <div className="flex justify-center space-x-2">
                          <button 
                            title="Ir para Gestão de Clientes" 
                            onClick={() => onNavigateToClient?.(project.clientName)} 
                            className="w-8 h-8 rounded-lg bg-baccarim-navy/10 text-baccarim-navy hover:bg-baccarim-navy hover:text-white transition-all flex items-center justify-center shadow-sm"
                          >
                            <i className="fas fa-user-tie"></i>
                          </button>
                          <button 
                            title="Ir para Notificações" 
                            onClick={() => onNavigateToNotifications?.(project.id)} 
                            className="w-8 h-8 rounded-lg bg-baccarim-blue/10 text-baccarim-blue hover:bg-baccarim-blue hover:text-white transition-all flex items-center justify-center shadow-sm"
                          >
                            <i className="fas fa-bell"></i>
                          </button>
                          <button 
                            title="Ir para Atas e Anotações" 
                            onClick={() => setMeetingMinutesProject(project)} 
                            className="w-8 h-8 rounded-lg bg-baccarim-green/10 text-baccarim-green hover:bg-baccarim-green hover:text-white transition-all flex items-center justify-center shadow-sm"
                          >
                            <i className="fas fa-file-signature"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
      {selectedProject && (() => {
        const selectedProjectNotifs = notifications.filter(n => n.projectId === selectedProject.id);
        const hasActiveLicenseInModal = selectedProjectNotifs.some(n => n.status === 'Open' && n.category === 'Licença');
        return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-baccarim-dark/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-2xl shadow-2xl border border-baccarim-border relative overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="p-10 border-b border-baccarim-border bg-baccarim-navy/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-black text-baccarim-text tracking-tighter">{selectedProject.name}</h2>
                  <p className="text-xs font-black text-baccarim-blue uppercase tracking-[0.3em] mt-2">Detalhamento de Pendências</p>
                </div>
                <button                   onClick={() => setSelectedProjectId(null)}
                   className="w-12 h-12 rounded-2xl bg-baccarim-hover flex items-center justify-center text-baccarim-text-muted hover:text-baccarim-text hover:bg-baccarim-active transition-all"
                 >
                   <i className="fas fa-times"></i>
                 </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-baccarim-blue/10 px-4 py-2 rounded-xl border border-baccarim-blue/20">
                  <p className="text-[8px] font-black text-baccarim-blue uppercase tracking-widest">Protocolo SEI Principal</p>
                  <p className="text-[12px] font-black text-baccarim-text">{selectedProject.specs.numeroProtocolo || 'Não Identificado'}</p>
                </div>
                {selectedProject.specs.dataProtocolo && (
                  <div className="bg-baccarim-green/10 px-4 py-2 rounded-xl border border-baccarim-green/20">
                    <p className="text-[8px] font-black text-baccarim-green uppercase tracking-widest">Data do Protocolo</p>
                    <p className="text-[12px] font-black text-baccarim-text">{selectedProject.specs.dataProtocolo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar space-y-6">
              {selectedNotifs.length > 0 ? (
                selectedNotifs.map(notif => (
                  <div key={notif.id} className="bg-baccarim-hover/30 rounded-3xl p-8 border border-baccarim-border hover:border-baccarim-blue/20 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${notif.status === 'Open' ? (hasActiveLicenseInModal ? 'bg-yellow-400 animate-pulse' : 'bg-rose-500 animate-pulse') : 'bg-baccarim-green'}`}></div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${notif.status === 'Open' ? (hasActiveLicenseInModal ? 'text-yellow-600' : 'text-rose-500') : 'text-baccarim-green'}`}>
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
              <button                 onClick={() => setSelectedProjectId(null)}
                 className="px-10 py-4 bg-baccarim-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-baccarim-green transition-all"
               >
                 Concluir Visão
               </button>
            </div>
          </div>
        </div>
        );
      })}

      {meetingMinutesProject && (
        <ProjectMeetingMinutesView
          project={meetingMinutesProject}
          onUpdateProject={(updated) => {
             if (onUpdateProject) onUpdateProject(updated);
             setMeetingMinutesProject(updated);
          }}
          onClose={() => setMeetingMinutesProject(null)}
        />
      )}
    </div>
  );
};

export default ProjectStatusSummary;

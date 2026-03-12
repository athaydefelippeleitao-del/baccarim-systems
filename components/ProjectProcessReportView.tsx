
import React, { useRef, useState } from 'react';
import { Project, EnvironmentalLicense, Notification, ChecklistItem } from '../types';
import { AppLogo } from './AppLogo';

interface ProjectProcessReportViewProps {
  project: Project;
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
  onClose: () => void;
}

const ProjectProcessReportView: React.FC<ProjectProcessReportViewProps> = ({ project, licenses, notifications, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const projectLicenses = licenses.filter(l => l.clientName === project.clientName && (l.id === project.mainLicenseId || l.name.includes(project.name)));
  const projectNotifications = notifications.filter(n => n.projectId === project.id);

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const opt = {
      margin: 10,
      filename: `RELATORIO_PROCESSO_${project.name.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      await (window as any).html2pdf().set(opt).from(reportRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const BaccarimLogo = () => (
    <div className="flex items-center space-x-2">
      <AppLogo className="w-8 h-8" />
      <span className="text-xl font-black text-baccarim-navy tracking-tighter">Baccarim Systems</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[250] flex flex-col items-center overflow-y-auto p-4 md:p-10 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-baccarim-text text-2xl font-black uppercase tracking-widest">Relatório do Processo</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="px-6 py-3 bg-baccarim-green text-white rounded-xl font-black uppercase text-[10px] shadow-xl flex items-center space-x-2 hover:bg-emerald-600 transition-all"
          >
            {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
            <span>{isGenerating ? 'Gerando...' : 'Exportar PDF'}</span>
          </button>
          <button onClick={onClose} className="w-12 h-12 bg-baccarim-active text-baccarim-text rounded-full flex items-center justify-center hover:bg-baccarim-card/20 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div
        ref={reportRef}
        className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl p-[20mm] text-baccarim-text font-sans"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-baccarim-navy pb-8 mb-10">
          <div>
            <BaccarimLogo />
            <p className="text-[10px] font-bold text-baccarim-text-muted mt-2 uppercase tracking-widest">Engenharia de Loteamentos e Gestão Ambiental</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-baccarim-navy uppercase">Relatório de Status</h1>
            <p className="text-xs font-bold text-baccarim-text-muted">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* I - IDENTIFICAÇÃO DO REQUERENTE */}
        <section className="mb-10">
          <h3 className="text-sm font-black text-baccarim-blue uppercase tracking-[0.2em] mb-6 border-l-4 border-baccarim-blue pl-4">1. Identificação do Requerente</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="col-span-2">
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">01 Razão Social / Nome</label>
              <p className="text-sm font-black text-baccarim-navy">{project.specs.razaoSocial || project.razaoSocial}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">02 CNPJ / CPF</label>
              <p className="text-sm font-black text-baccarim-navy">{project.specs.cnpjCpf || project.cnpj}</p>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">03 Endereço</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.applicantAddress || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">04 Bairro</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.applicantBairro || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">05 Município / UF</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.applicantCity || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">06 CEP</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.applicantCep || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">07 Telefone Fixo</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.applicantPhone || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">08 Telefone Celular</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.applicantMobile || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">09 Email</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.applicantEmail || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">10 Nome para Contato</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.contactName || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">11 Cargo</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.contactRole || '-'}</p>
            </div>
          </div>
        </section>

        {/* II - CARACTERÍSTICAS DO EMPREENDIMENTO */}
        <section className="mb-10">
          <h3 className="text-sm font-black text-baccarim-blue uppercase tracking-[0.2em] mb-6 border-l-4 border-baccarim-blue pl-4">2. Características do Empreendimento</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="col-span-2">
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">12 Tipo</label>
              <p className="text-xs font-bold text-baccarim-text">
                {project.specs.projectCategory === 'Parcelamento' ? 'Parcelamento do solo urbano para fins habitacionais, como loteamentos e desmembramentos' :
                  project.specs.projectCategory === 'Implantação' ? 'Implantação de conjuntos habitacionais/construção de empreendimentos horizontais e/ou verticais' : '-'}
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">13 Endereço (Lote, Data, etc.)</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.projectAddress || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">14 Bairro / Gleba</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.projectBairro || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">15 Município / UF</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.projectCity || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">16 Inscrição Imobiliária</label>
              <p className="text-xs font-bold text-baccarim-text">{project.specs.realEstateId || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">17 Área Total (M²)</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.areaTotal || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">18 Área Construída / Loteável (M²)</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.areaConstruida || '-'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">19 Número de Unidades</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.numUnits || '-'}</p>
            </div>
          </div>
        </section>

        {/* III - DADOS TÉCNICOS ADICIONAIS */}
        <section className="mb-10">
          <h3 className="text-sm font-black text-baccarim-blue uppercase tracking-[0.2em] mb-6 border-l-4 border-baccarim-blue pl-4">3. Dados Técnicos Adicionais</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Área Total</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.areaTotal}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Área APP</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.areaAPP}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Qtd Lotes / UH</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.qtdLotes}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Matrícula</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.matricula}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Protocolo SEI</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.numeroProtocolo || 'N/A'}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Órgão Resp.</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.orgaoResponsavel || 'IAT / SEMA'}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Licença Obtida</label>
              <p className="text-xs font-black text-baccarim-green">{project.specs.licencaObtida || '-'}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">Nº da Licença</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.numeroLicenca || '-'}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">UTM (E)</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.coordE || '-'}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
              <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">UTM (N)</label>
              <p className="text-xs font-black text-baccarim-navy">{project.specs.coordN || '-'}</p>
            </div>
          </div>

          {project.specs.customSpecs && project.specs.customSpecs.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-6">
              {project.specs.customSpecs.map((spec) => (
                <div key={spec.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                  <label className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest block mb-1">{spec.label}</label>
                  <p className="text-xs font-black text-baccarim-navy">{spec.value || '-'}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Progress & Checklist */}
        <section className="mb-10">
          <h3 className="text-sm font-black text-baccarim-blue uppercase tracking-[0.2em] mb-6 border-l-4 border-baccarim-blue pl-4">4. Evolução do Processo ({project.currentPhase}) - {project.checklistAgency || 'SEMA'}</h3>
          <div className="flex items-center space-x-6 mb-8 bg-baccarim-navy text-baccarim-text p-6 rounded-2xl shadow-lg">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-baccarim-text/10" />
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent"
                  strokeDasharray={220}
                  strokeDashoffset={220 - (220 * project.progress) / 100}
                  className="text-baccarim-blue transition-all duration-1000"
                />
              </svg>
              <span className="absolute text-lg font-black">{project.progress}%</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status do Checklist</p>
              <h4 className="text-lg font-black">Fase de {project.currentPhase}</h4>
              <p className="text-[10px] font-medium opacity-80 mt-1">
                {project.checklist.filter(i => i.isCompleted).length} de {project.checklist.length} itens concluídos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Array.from(new Set(project.checklist.map(i => i.category))).map(cat => {
              const items = project.checklist.filter(i => i.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-baccarim-hover px-4 py-2 border-b border-slate-100">
                    <span className="text-[9px] font-black text-baccarim-navy uppercase tracking-widest">{cat}</span>
                  </div>
                  <div className="p-4 space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center space-x-2">
                            <i className={`fas ${item.isCompleted ? 'fa-check-circle text-baccarim-green' : 'fa-circle text-slate-200'}`}></i>
                            <span className={item.isCompleted ? 'font-bold text-baccarim-text' : 'text-baccarim-text-muted'}>{item.label}</span>
                          </div>
                          {item.isCompleted && <span className="text-[8px] font-black text-emerald-600 uppercase">Concluído</span>}
                        </div>
                        {item.comment && (
                          <div className="pl-5">
                            <p className="text-[9px] text-baccarim-text-muted italic">Obs: {item.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Licenses */}
        {projectLicenses.length > 0 && (
          <section className="mb-10">
            <h3 className="text-sm font-black text-baccarim-blue uppercase tracking-[0.2em] mb-6 border-l-4 border-baccarim-blue pl-4">5. Licenciamento Ambiental</h3>
            <div className="space-y-4">
              {projectLicenses.map(license => (
                <div key={license.id} className="border border-slate-100 rounded-xl p-5 flex justify-between items-center bg-baccarim-card shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-baccarim-navy uppercase">{license.name}</h4>
                    <p className="text-[9px] font-bold text-baccarim-text-muted mt-1">Processo: {license.processNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${license.status === 'Ativa' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                      {license.status}
                    </span>
                    <p className="text-[9px] font-bold text-baccarim-text-muted mt-2">Vencimento: {license.expiryDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notifications */}
        {projectNotifications.length > 0 && (
          <section className="mb-10">
            <h3 className="text-sm font-black text-baccarim-blue uppercase tracking-[0.2em] mb-6 border-l-4 border-baccarim-blue pl-4">6. Notificações e Pendências</h3>
            <div className="space-y-4">
              {projectNotifications.map(notif => (
                <div key={notif.id} className="border-l-4 border-amber-500 bg-amber-50/30 p-5 rounded-r-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-black text-baccarim-navy uppercase">{notif.title}</h4>
                    <span className="text-[8px] font-black bg-baccarim-amber text-baccarim-text px-2 py-1 rounded uppercase">{notif.severity}</span>
                  </div>
                  <p className="text-[10px] text-baccarim-text-muted mb-3">{notif.description}</p>
                  <div className="flex justify-between items-center text-[9px] font-bold text-baccarim-text-muted">
                    <span>Recebida em: {notif.dateReceived}</span>
                    <span className="text-amber-600">Prazo: {notif.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-baccarim-text-muted uppercase tracking-[0.3em]">Baccarim Engenharia Urbana Ltda</p>
          <p className="text-[8px] text-baccarim-text-muted mt-2">Este documento é um resumo informativo gerado pelo sistema Baccarim Systems.</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectProcessReportView;

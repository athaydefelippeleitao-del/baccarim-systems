import React, { useRef, useState } from 'react';
import { Project, AppConfig } from '../types';
import { AppLogo } from './AppLogo';

interface ProjectExtensionReportViewProps {
  project: Project;
  appConfig?: AppConfig;
  onClose: () => void;
}

const ProjectExtensionReportView: React.FC<ProjectExtensionReportViewProps> = ({ project, appConfig, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [days, setDays] = useState<number>(30); // Default 30 days
  const [customJustification, setCustomJustification] = useState<string>('');

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const opt = {
      margin: 15,
      filename: `REQUERIMENTO_DILACAO_${project.name.replace(/ /g, '_')}.pdf`,
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

  const agencyName = project.checklistAgency === 'IAT' ? 'ao INSTITUTO ÁGUA E TERRA - IAT' : 'à SECRETARIA MUNICIPAL DO AMBIENTE - SEMA';

  return (
    <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[250] flex flex-col md:flex-row items-start justify-center overflow-y-auto p-4 md:p-10 animate-in fade-in duration-300 gap-8">
      
      {/* Sidebar de Configuração */}
      <div className="w-full md:w-80 bg-baccarim-card rounded-[2rem] p-6 shadow-2xl border border-baccarim-border shrink-0 sticky top-10 print:hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-baccarim-text uppercase tracking-widest">Configurar Pedido</h3>
          <button onClick={onClose} className="w-8 h-8 bg-baccarim-hover text-baccarim-text-muted rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Dias de Dilação</label>
            <div className="flex items-center space-x-2">
              <button onClick={() => setDays(Math.max(1, days - 15))} className="w-10 h-10 bg-baccarim-hover rounded-xl text-baccarim-text hover:bg-baccarim-active"><i className="fas fa-minus"></i></button>
              <input 
                type="number" 
                value={days} 
                onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                className="flex-1 bg-baccarim-hover border border-baccarim-border p-2 rounded-xl text-center text-lg font-black text-baccarim-text outline-none" 
              />
              <button onClick={() => setDays(days + 15)} className="w-10 h-10 bg-baccarim-hover rounded-xl text-baccarim-text hover:bg-baccarim-active"><i className="fas fa-plus"></i></button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Justificativa Adicional (Opcional)</label>
            <textarea 
              value={customJustification}
              onChange={(e) => setCustomJustification(e.target.value)}
              className="w-full h-32 bg-baccarim-hover border border-baccarim-border p-3 rounded-xl text-xs text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue resize-none leading-relaxed"
              placeholder="Ex: Devido a atrasos na obtenção de documentos de terceiros..."
            />
          </div>
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating || days <= 0}
          className="w-full mt-6 py-4 bg-baccarim-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-2 hover:bg-baccarim-green transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-print"></i>}
          <span>{isGenerating ? 'Processando Documento...' : 'Gerar Documento (PDF)'}</span>
        </button>
      </div>

      {/* Papel A4 para Impressão */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_0_40px_rgba(0,0,0,0.5)] text-black font-serif text-[12pt] leading-relaxed relative flex flex-col print:shadow-none print:m-0 print:p-0">
        <div ref={reportRef} className="px-[25mm] py-[30mm] flex-1 flex flex-col bg-white">
          
          {/* Cabeçalho */}
          <div className="flex flex-col items-center justify-center mb-12 border-b-2 border-black pb-6">
            {appConfig?.appIcon && <img src={appConfig.appIcon} alt="Logo" className="w-16 h-16 mb-4" />}
            <h1 className="text-[14pt] font-bold text-center uppercase tracking-wide">
              REQUERIMENTO DE DILAÇÃO DE PRAZO
            </h1>
          </div>

          {/* Corpo do Documento */}
          <div className="space-y-8 flex-1">
            <div className="text-right">
              <p>Londrina - PR, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="font-bold">
              <p>À Ilustríssima Autoridade Ambiental</p>
              <p className="uppercase">{agencyName}</p>
            </div>

            <div className="space-y-4 text-justify indent-12 pt-4">
              <p>
                A empresa <span className="font-bold uppercase">{project.specs.razaoSocial || project.razaoSocial || project.clientName}</span>, inscrita no CNPJ/CPF sob o nº <span className="font-bold">{project.specs.cnpjCpf || project.cnpj || "Não Informado"}</span>, com sede na <span className="font-bold">{project.specs.applicantAddress || "endereço não cadastrado"}</span>, vem, muito respeitosamente, à presença de Vossa Senhoria requerer a <span className="font-bold uppercase">Dilação de Prazo</span> por <span className="font-bold">{days} ({days === 1 ? 'um dia' : `${days} dias`})</span> para atendimento de pendências referentes ao processo de licenciamento sob nº <span className="font-bold">{project.specs.numeroProtocolo || "_______________"}</span> do empreendimento designado <span className="font-bold">{project.name}</span>, localizado em <span className="font-bold">{project.location || project.specs.projectAddress}</span>.
              </p>

              <p>
                A presente solicitação se faz necessária para o adequado cumprimento e levantamento das exigências formuladas por este renomado órgão ambiental, visando o correto e integral atendimento das normativas vigentes.
              </p>

              {customJustification.trim() && (
                <p>
                  <span className="font-bold">Justificativa Adicional:</span> {customJustification.trim()}
                </p>
              )}

              <p>
                Certos de vossa compreensão e deferimento, reiteramos votos de elevada estima e consideração.
              </p>
            </div>
          </div>

          {/* Assinatura */}
          <div className="mt-24 pt-20 flex flex-col items-center">
            <div className="w-64 border-t border-black mb-2"></div>
            <p className="font-bold uppercase text-[11pt]">{project.specs.responsavelLegal || project.specs.razaoSocial || project.clientName}</p>
            {project.specs.cnpjCpf && <p className="text-[10pt]">{project.specs.cnpjCpf}</p>}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectExtensionReportView;

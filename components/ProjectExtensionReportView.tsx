import React, { useRef, useState, useEffect } from 'react';
import { Project, AppConfig } from '../types';

interface ProjectExtensionReportViewProps {
  project: Project;
  appConfig?: AppConfig;
  onClose: () => void;
}

const ProjectExtensionReportView: React.FC<ProjectExtensionReportViewProps> = ({ project, appConfig, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignature, setShowSignature] = useState(true);

  // Initial content based on the project and the reference image
  const getInitialContent = () => {
    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const processNumber = project.specs?.numeroProtocolo || '19.023.064622/2025-92';
    const razaoSocial = project.specs?.razaoSocial || project.clientName || 'BRAGA CRUZ BUSINESS LOTEAMENTOS LTDA';
    const cnpj = project.specs?.cnpjCpf || '32.128.269/0001-44';
    const responsavel = project.specs?.responsavelLegal || 'ALBERTO BACCARIM JUNIOR';
    const cpfResponsavel = '055.589.279-41'; // Placeholder as seen in image

    return `
      <div style="text-align: right; margin-bottom: 40px;">Londrina, ${today}.</div>
      
      <div style="margin-bottom: 40px;">
        <p style="font-weight: bold; margin-bottom: 0;">À</p>
        <p style="font-weight: bold; margin-bottom: 0;">Prefeitura Municipal de Londrina</p>
        <p style="font-weight: bold; margin-bottom: 0;">SEMA - Secretaria Municipal Do Ambiente de Londrina</p>
      </div>

      <div style="margin-bottom: 40px;">
        <p><strong>Ref.:</strong> Processo SEI ${processNumber} | Solicitação de prorrogação de prazo (60 dias) para envio de complementação solicitada através da Notificação Administrativa nº 2110/2025 e prorrogada pela Notificação Administrativa nº 173/2026.</p>
      </div>

      <div style="text-align: justify; line-height: 1.6;">
        <p style="text-indent: 50px; margin-bottom: 20px;">
          A empresa <strong>${razaoSocial}</strong>, pessoa jurídica inscrita no CNPJ sob o nº ${cnpj}, vem por meio deste, e através de seu outorgado <strong>${responsavel}</strong>, engenheiro civil, portador do CPF sob o nº ${cpfResponsavel}, prestar os esclarecimentos solicitados através da notificação supracitada.
        </p>

        <p style="text-indent: 50px; margin-bottom: 20px;">
          Em atenção à Notificação Administrativa nº 2110/2025 e prorrogada pela Notificação Administrativa nº 173/2026, e considerando a necessidade de maior prazo para o envio da complementação solicitada, gostaríamos de formalizar nossa solicitação de prorrogação de <strong>60 (sessenta) dias do prazo</strong> originalmente estabelecido.
        </p>

        <p style="text-indent: 50px; margin-bottom: 20px;">
          Reiteramos nossos protestos de estima e consideração e aguardamos a sua compreensão.
        </p>
      </div>

      <div style="margin-top: 60px; margin-bottom: 20px;">
        <p>Atenciosamente,</p>
      </div>
    `;
  };

  const [content, setContent] = useState(getInitialContent());

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    // Temporarily hide edit UI for clean PDF
    const opt = {
      margin: 20,
      filename: `OFICIO_DILACAO_${project.name.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja descartar as alterações e voltar ao modelo original?')) {
      setContent(getInitialContent());
    }
  };

  return (
    <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[250] flex flex-col md:flex-row items-start justify-center overflow-y-auto p-4 md:p-10 animate-in fade-in duration-300 gap-8">
      
      {/* Config Bar */}
      <div className="w-full md:w-80 bg-baccarim-card rounded-[2rem] p-6 shadow-2xl border border-baccarim-border shrink-0 sticky top-10 print:hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-baccarim-text uppercase tracking-widest">Editor de Ofício</h3>
          <button onClick={onClose} className="w-8 h-8 bg-baccarim-hover text-baccarim-text-muted rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-4 flex-1">
          <div className="p-4 bg-baccarim-blue/10 border border-baccarim-blue/20 rounded-2xl">
            <p className="text-[10px] text-baccarim-blue font-bold uppercase tracking-widest mb-2">Instrução</p>
            <p className="text-xs text-baccarim-text-muted leading-relaxed">
              Clique diretamente no texto do documento ao lado para editar qualquer informação.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-baccarim-hover rounded-xl border border-baccarim-border">
            <span className="text-xs font-bold text-baccarim-text">Mostrar Assinatura</span>
            <button 
              onClick={() => setShowSignature(!showSignature)}
              className={`w-10 h-6 rounded-full transition-all relative ${showSignature ? 'bg-baccarim-blue' : 'bg-baccarim-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showSignature ? 'left-5' : 'left-1'}`}></div>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-baccarim-hover text-baccarim-text rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/10 hover:text-orange-500 transition-all border border-baccarim-border"
          >
            <i className="fas fa-undo mr-2"></i>
            Resetar Template
          </button>
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="w-full mt-6 py-4 bg-baccarim-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-2 hover:bg-baccarim-green transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-file-pdf"></i>}
          <span>{isGenerating ? 'Processando...' : 'Baixar PDF Editado'}</span>
        </button>
      </div>

      {/* A4 Paper */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_0_40px_rgba(0,0,0,0.5)] text-black relative flex flex-col print:shadow-none print:m-0 print:p-0">
        <div 
          ref={reportRef} 
          className="px-[25mm] py-[30mm] flex-1 flex flex-col bg-white overflow-hidden"
          style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt' }}
        >
          {/* Main Content Area */}
          <div 
            contentEditable 
            suppressContentEditableWarning
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: content }}
            className="outline-none focus:ring-0 text-justify"
          />

          {/* Signature Area (Managed separately or within contentEditable) */}
          {showSignature && (
            <div className="mt-8 flex flex-col items-center self-center text-center">
              <div className="mb-2 italic opacity-50 text-xs">Assinatura Digital</div>
              <div className="w-64 border-t border-black mb-2"></div>
              <p className="font-bold uppercase text-[11pt]">
                {project.specs?.responsavelLegal || 'ALBERTO BACCARIM JUNIOR'}
              </p>
              <p className="font-bold uppercase text-[10pt]">
                {project.specs?.razaoSocial || project.clientName || 'BRAGA CRUZ BUSINESS LOTEAMENTOS LTDA'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectExtensionReportView;


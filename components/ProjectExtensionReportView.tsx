import React, { useRef, useState, useEffect } from 'react';
import { Project, AppConfig } from '../types';

interface ProjectExtensionReportViewProps {
  project: Project;
  appConfig?: AppConfig;
  onClose: () => void;
}

const DIAS_EXTENSO: Record<string, string> = {
  '15': '(quinze)',
  '30': '(trinta)',
  '45': '(quarenta e cinco)',
  '60': '(sessenta)',
  '90': '(noventa)',
  '120': '(cento e vinte)'
};

const ProjectExtensionReportView: React.FC<ProjectExtensionReportViewProps> = ({ project, appConfig, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignature, setShowSignature] = useState(true);
  const [localSignatureImage, setLocalSignatureImage] = useState<string | undefined>(appConfig?.signatureImage);

  // States for easily alterable fields
  const [extensionDays, setExtensionDays] = useState('60');
  const [extensionReason, setExtensionReason] = useState('a necessidade de maior prazo para o envio da complementação solicitada');

  // Generate HTML content
  const getInitialContent = (days: string, reason: string) => {
    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const processNumber = project.specs?.numeroProtocolo || '19.023.064622/2025-92';
    const razaoSocial = project.specs?.razaoSocial || project.clientName || 'BRAGA CRUZ BUSINESS LOTEAMENTOS LTDA';
    const cnpj = project.specs?.cnpjCpf || '32.128.269/0001-44';
    const responsavel = project.specs?.responsavelLegal || 'ALBERTO BACCARIM JUNIOR';
    const cpfResponsavel = project.specs?.cpfResponsavel || '055.589.279-41';

    const diasExtensoText = DIAS_EXTENSO[days] || '';

    return `
      <div style="text-align: right; margin-bottom: 25px; font-size: 11pt;">Londrina, ${today}.</div>
      
      <div style="margin-bottom: 25px; font-size: 11pt; line-height: 1.2;">
        <p style="font-weight: bold; margin-bottom: 5px;">À</p>
        <p style="font-weight: bold; margin-bottom: 0;">Prefeitura Municipal de Londrina</p>
        <p style="font-weight: bold; margin-bottom: 0;">SEMA - Secretaria Municipal Do Ambiente de Londrina</p>
      </div>

      <div style="margin-bottom: 30px; font-size: 11pt; line-height: 1.3; text-align: justify;">
        <p><strong>Ref.:</strong> Processo SEI ${processNumber} | Solicitação de prorrogação de prazo (${days} dias) para envio de complementação solicitada através da Notificação Administrativa nº 2110/2025 e prorrogada pela Notificação Administrativa nº 173/2026.</p>
      </div>

      <div style="text-align: justify; line-height: 1.4; font-size: 11pt;">
        <p style="text-indent: 50px; margin-bottom: 15px;">
          A empresa <strong>${razaoSocial}</strong>, pessoa jurídica inscrita no CNPJ sob o nº ${cnpj}, vem por meio deste, e através de seu outorgado <strong>${responsavel}</strong>, engenheiro civil, portador do CPF sob o nº ${cpfResponsavel}, prestar os esclarecimentos solicitados através da notificação supracitada.
        </p>

        <p style="text-indent: 50px; margin-bottom: 15px;">
          Em atenção à Notificação Administrativa nº 2110/2025 e prorrogada pela Notificação Administrativa nº 173/2026, e considerando ${reason}, gostaríamos de formalizar nossa solicitação de prorrogação de <strong>${days} ${diasExtensoText} dias do prazo</strong> originalmente estabelecido.
        </p>

        <p style="text-indent: 50px; margin-bottom: 15px;">
          Reiteramos nossos protestos de estima e consideração e aguardamos a sua compreensão.
        </p>
      </div>

      <div style="margin-top: 30px; margin-bottom: 15px; font-size: 11pt;">
        <p>Atenciosamente,</p>
      </div>
    `;
  };

  const [content, setContent] = useState(getInitialContent(extensionDays, extensionReason));

  const handleApplyChanges = () => {
    setContent(getInitialContent(extensionDays, extensionReason));
  };

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const opt = {
      margin: 10,
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
    if (confirm('Deseja resetar o texto para o modelo original?')) {
      setExtensionDays('60');
      setExtensionReason('a necessidade de maior prazo para o envio da complementação solicitada');
      setContent(getInitialContent('60', 'a necessidade de maior prazo para o envio da complementação solicitada'));
      setLocalSignatureImage(appConfig?.signatureImage);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSignatureImage(reader.result as string);
        setShowSignature(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[250] flex flex-col md:flex-row items-start justify-center overflow-y-auto p-4 md:p-10 animate-in fade-in duration-300 gap-8">
      
      {/* Settings Panel */}
      <div className="w-full md:w-80 bg-baccarim-card rounded-[2rem] p-6 shadow-2xl border border-baccarim-border shrink-0 sticky top-10 print:hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-baccarim-text uppercase tracking-widest">Editor de Ofício</h3>
          <button onClick={onClose} className="w-8 h-8 bg-baccarim-hover text-baccarim-text-muted rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-6">
          {/* Form Fields for Dynamically Changing Text */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-baccarim-text-muted uppercase tracking-widest mb-2">Prazo (Dias)</label>
              <select 
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                className="w-full bg-baccarim-dark border border-baccarim-border rounded-xl px-4 py-3 text-sm text-baccarim-text focus:outline-none focus:border-baccarim-blue transition-all"
              >
                <option value="15">15 Dias</option>
                <option value="30">30 Dias</option>
                <option value="45">45 Dias</option>
                <option value="60">60 Dias</option>
                <option value="90">90 Dias</option>
                <option value="120">120 Dias</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-baccarim-text-muted uppercase tracking-widest mb-2">Motivo da Dilação</label>
              <textarea 
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                className="w-full bg-baccarim-dark border border-baccarim-border rounded-xl px-4 py-3 text-sm text-baccarim-text focus:outline-none focus:border-baccarim-blue transition-all min-h-[100px] resize-y"
                placeholder="Ex: a necessidade de maior prazo..."
              />
            </div>

            <button 
              onClick={handleApplyChanges}
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-baccarim-blue text-white rounded-xl hover:bg-baccarim-green transition-all shadow-lg"
            >
              Aplicar Mudanças no Texto
            </button>
          </div>

          <div className="w-full h-px bg-baccarim-border"></div>

          {/* Signature Configuration */}
          <div className="space-y-3">
            <h4 className="text-[10px] text-baccarim-text-muted font-bold uppercase tracking-widest">Assinatura</h4>
            <div className="flex items-center justify-between p-3 bg-baccarim-hover rounded-xl border border-baccarim-border">
              <span className="text-xs font-bold text-baccarim-text">Exibir Assinatura</span>
              <button 
                onClick={() => setShowSignature(!showSignature)}
                className={`w-10 h-6 rounded-full transition-all relative ${showSignature ? 'bg-baccarim-blue' : 'bg-baccarim-border'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showSignature ? 'left-5' : 'left-1'}`}></div>
              </button>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleSignatureUpload} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-baccarim-blue/10 text-baccarim-blue rounded-xl hover:bg-baccarim-blue/20 transition-all border border-baccarim-blue/20"
            >
              <i className="fas fa-upload mr-2"></i> Anexar Imagem Mão
            </button>
          </div>

          <div className="w-full h-px bg-baccarim-border"></div>

          <button onClick={handleReset} className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-baccarim-hover text-baccarim-text-muted rounded-xl hover:text-baccarim-text border border-baccarim-border transition-all">
            <i className="fas fa-undo mr-2"></i> Resetar para Padrão
          </button>

          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full py-4 bg-baccarim-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-2 hover:bg-baccarim-green transition-all disabled:opacity-50"
          >
            {isGenerating ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-print"></i>}
            <span>{isGenerating ? 'Gerando...' : 'Gerar PDF'}</span>
          </button>
        </div>
      </div>

      {/* A4 Paper View */}
      <div 
        ref={reportRef}
        className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_40px_100px_rgba(0,0,0,0.4)] text-black relative flex flex-col print:shadow-none print:m-0 shrink-0"
      >
        <div 
          className="px-[20mm] py-[25mm] flex-1 flex flex-col bg-white overflow-hidden"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Editable Document Body */}
          <div 
            contentEditable 
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: content }}
            className="outline-none focus:ring-0"
          />

          {/* Signature Area (Properly Aligned & Embedded) */}
          {showSignature && (
            <div className="mt-4 flex flex-col items-start w-fit">
              <div className="relative mb-0 h-16 flex items-center justify-start">
                <div className="absolute left-0 bottom-2 w-48 h-12 flex items-center justify-start overflow-hidden">
                  {localSignatureImage ? (
                    <img src={localSignatureImage} alt="Assinatura" className="max-h-full object-contain" />
                  ) : (
                    <div className="text-baccarim-blue italic text-3xl opacity-60 ml-2" style={{ fontFamily: '"Brush Script MT", cursive' }}>
                      AB Junior
                    </div>
                  )}
                </div>
              </div>
              <div className="w-80 border-t border-black mb-2 opacity-80"></div>
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


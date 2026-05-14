import React, { useState } from 'react';
import { Project } from '../types';
import jsPDF from 'jspdf';

interface ProjectMeetingMinutesViewProps {
  project: Project;
  onClose: () => void;
}

const ProjectMeetingMinutesView: React.FC<ProjectMeetingMinutesViewProps> = ({ project, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [participants, setParticipants] = useState('');
  const [agenda, setAgenda] = useState('');
  const [decisions, setDecisions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generatePDF = async (action: 'download' | 'preview' = 'download') => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      // Tentar carregar a logo do diretório público
      let logoDataUrl: string | null = null;
      try {
        const response = await fetch('/logo_baccarim.jpg');
        if (response.ok) {
          const blob = await response.blob();
          logoDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        console.warn('Não foi possível carregar a logo', e);
      }

      // Função auxiliar para criar caixas com título
      let cursorY = 55;
      const drawSectionBox = (title: string, lines: string[], startY: number) => {
        // Checar quebra de página
        const estimatedHeight = 15 + (lines.length * 6);
        if (startY + estimatedHeight > pageHeight - 20) {
          doc.addPage();
          startY = 20;
          drawHeader(doc.internal.pages.length - 1); // Redesenha cabeçalho básico se precisar (ou só usa a margem)
        }

        doc.setFillColor(248, 250, 252); // Fundo bem clarinho (Slate 50)
        doc.setDrawColor(226, 232, 240); // Borda suave (Slate 200)
        doc.roundedRect(margin, startY, pageWidth - (margin * 2), estimatedHeight, 3, 3, 'FD');

        // Título da Seção
        doc.setFillColor(0, 26, 58); // Baccarim Navy
        doc.roundedRect(margin, startY, pageWidth - (margin * 2), 10, 3, 3, 'F');
        // Remover arredondamento da base do título para grudar na caixa
        doc.rect(margin, startY + 7, pageWidth - (margin * 2), 3, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), margin + 5, startY + 7);

        // Conteúdo
        doc.setTextColor(51, 65, 85); // Slate 700
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        let textY = startY + 16;
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + 5, textY);
          textY += 6;
        }

        return startY + estimatedHeight + 10; // Retorna nova posição Y
      };

      const drawHeader = (pageNumber: number) => {
        // Fundo Azul Escuro do Cabeçalho
        doc.setFillColor(0, 26, 58);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        if (logoDataUrl) {
          // Ajuste as dimensões da logo conforme necessário (assumindo imagem quadrada/retangular)
          doc.addImage(logoDataUrl, 'JPEG', margin, 7, 26, 26);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.setFont("helvetica", "bold");
          doc.text("ATA DE REUNIÃO", margin + 35, 25);
        } else {
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(24);
          doc.setFont("helvetica", "bold");
          doc.text("ATA DE REUNIÃO", margin, 26);
        }
      };

      // --- RENDERIZAÇÃO DA PÁGINA 1 ---
      drawHeader(1);

      // Dados do Projeto e Reunião (Lado a Lado ou em Blocos)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, pageWidth - (margin * 2), 35, 3, 3, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMAÇÕES GERAIS", margin + 5, cursorY + 8);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(margin + 5, cursorY + 11, pageWidth - margin - 5, cursorY + 11);

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      
      doc.setFont("helvetica", "bold");
      doc.text("Projeto:", margin + 5, cursorY + 18);
      doc.setFont("helvetica", "normal");
      doc.text(project.name, margin + 25, cursorY + 18);

      doc.setFont("helvetica", "bold");
      doc.text("Data/Hora:", pageWidth / 2, cursorY + 18);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date(date).toLocaleDateString('pt-BR')} às ${time}`, (pageWidth / 2) + 22, cursorY + 18);

      doc.setFont("helvetica", "bold");
      doc.text("Cliente:", margin + 5, cursorY + 25);
      doc.setFont("helvetica", "normal");
      doc.text(project.clientName, margin + 22, cursorY + 25);

      doc.setFont("helvetica", "bold");
      doc.text("Fase:", pageWidth / 2, cursorY + 25);
      doc.setFont("helvetica", "normal");
      doc.text(project.currentPhase || 'Não definida', (pageWidth / 2) + 12, cursorY + 25);

      cursorY += 45;

      // Participantes
      const splitParticipants = doc.splitTextToSize(participants, pageWidth - (margin * 2) - 10);
      cursorY = drawSectionBox("Participantes", splitParticipants, cursorY);

      // Pautas
      const splitAgenda = doc.splitTextToSize(agenda, pageWidth - (margin * 2) - 10);
      cursorY = drawSectionBox("Pautas / Assuntos Discutidos", splitAgenda, cursorY);

      // Deliberações
      const splitDecisions = doc.splitTextToSize(decisions, pageWidth - (margin * 2) - 10);
      drawSectionBox("Deliberações e Próximos Passos", splitDecisions, cursorY);

      // --- RODAPÉ EM TODAS AS PÁGINAS ---
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.text(`Gerado por Baccarim Systems - Ata de Reunião`, margin, pageHeight - 10);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      }

      if (action === 'preview') {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPreviewUrl(url);
      } else {
        const fileName = `Ata_Reuniao_${project.name.replace(/\s+/g, '_')}_${date}.pdf`;
        doc.save(fileName);
      }
      
    } catch (error) {
      console.error("Erro ao gerar PDF da Ata:", error);
      alert("Ocorreu um erro ao gerar o PDF. Verifique o console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-baccarim-dark/90 backdrop-blur-md z-[300] flex justify-center items-start p-4 md:p-8 overflow-y-auto animate-in fade-in duration-300 custom-scrollbar">
      <div className="bg-baccarim-card rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-baccarim-border animate-in slide-in-from-bottom-8 mt-10 mb-10">
        
        {/* Header */}
        <div className="bg-baccarim-hover p-6 md:p-8 border-b border-baccarim-border flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-baccarim-blue/10 flex items-center justify-center text-baccarim-blue">
              <i className="fas fa-handshake text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-baccarim-text tracking-tight uppercase">Ata de Reunião</h2>
              <p className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">{project.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-baccarim-active text-baccarim-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        {previewUrl ? (
          <div className="p-0 h-[600px] md:h-[700px] relative">
            <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Data da Reunião</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Hora da Reunião</label>
                <input 
                  type="time" 
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Participantes</label>
              <input 
                type="text" 
                value={participants}
                onChange={e => setParticipants(e.target.value)}
                placeholder="Ex: João Silva (Cliente), Maria (Baccarim), Carlos (Engenharia)"
                className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Pautas e Assuntos Discutidos</label>
              <textarea 
                value={agenda}
                onChange={e => setAgenda(e.target.value)}
                placeholder="Descreva aqui tudo o que foi conversado durante a reunião..."
                className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue min-h-[150px] resize-y custom-scrollbar" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Deliberações e Próximos Passos</label>
              <textarea 
                value={decisions}
                onChange={e => setDecisions(e.target.value)}
                placeholder="O que ficou decidido? Quem fará o quê?"
                className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue min-h-[120px] resize-y custom-scrollbar" 
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-baccarim-hover p-6 border-t border-baccarim-border flex justify-between items-center sticky bottom-0">
          {previewUrl ? (
            <button 
              onClick={() => setPreviewUrl(null)}
              className="px-6 py-4 bg-baccarim-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-baccarim-blue transition-all flex items-center space-x-2"
            >
              <i className="fas fa-arrow-left"></i><span>Voltar e Editar</span>
            </button>
          ) : (
            <div></div> // empty spacer
          )}
          
          <div className="flex gap-4">
            {!previewUrl && (
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-transparent text-baccarim-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-baccarim-text hover:bg-baccarim-active transition-all"
              >
                Cancelar
              </button>
            )}
            {!previewUrl && (
              <button 
                onClick={() => generatePDF('preview')}
                disabled={isGenerating || !participants || !agenda}
                className="px-6 py-4 bg-baccarim-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-baccarim-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <i className="fas fa-eye"></i><span>Visualizar</span>
              </button>
            )}
            <button 
              onClick={() => generatePDF('download')}
              disabled={isGenerating || !participants || !agenda}
              className="px-8 py-4 bg-baccarim-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <><i className="fas fa-spinner fa-spin"></i><span>Processando...</span></>
              ) : (
                <><i className="fas fa-download"></i><span>Baixar PDF</span></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectMeetingMinutesView;

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

  const generatePDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;

      // Header
      doc.setFillColor(0, 26, 58); // Baccarim Navy
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ATA DE REUNIÃO", margin, 25);
      
      // Project Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO PROJETO", margin, 55);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Projeto: ${project.name}`, margin, 65);
      doc.text(`Cliente: ${project.clientName}`, margin, 72);
      doc.text(`Fase Atual: ${project.currentPhase || 'Não definida'}`, margin, 79);
      
      // Meeting Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DA REUNIÃO", margin, 95);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${new Date(date).toLocaleDateString('pt-BR')} às ${time}`, margin, 105);
      
      doc.setFont("helvetica", "bold");
      doc.text("Participantes:", margin, 115);
      doc.setFont("helvetica", "normal");
      
      const splitParticipants = doc.splitTextToSize(participants, pageWidth - (margin * 2));
      doc.text(splitParticipants, margin, 122);
      
      let cursorY = 122 + (splitParticipants.length * 5) + 10;

      // Agenda
      if (cursorY > 260) { doc.addPage(); cursorY = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PAUTAS / ASSUNTOS DISCUTIDOS", margin, cursorY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitAgenda = doc.splitTextToSize(agenda, pageWidth - (margin * 2));
      cursorY += 10;
      
      for (let i = 0; i < splitAgenda.length; i++) {
        if (cursorY > 280) { doc.addPage(); cursorY = 20; }
        doc.text(splitAgenda[i], margin, cursorY);
        cursorY += 5;
      }

      // Decisions
      cursorY += 10;
      if (cursorY > 260) { doc.addPage(); cursorY = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DELIBERAÇÕES E PRÓXIMOS PASSOS", margin, cursorY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitDecisions = doc.splitTextToSize(decisions, pageWidth - (margin * 2));
      cursorY += 10;

      for (let i = 0; i < splitDecisions.length; i++) {
        if (cursorY > 280) { doc.addPage(); cursorY = 20; }
        doc.text(splitDecisions[i], margin, cursorY);
        cursorY += 5;
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Gerado por Baccarim Systems - Página ${i} de ${totalPages}`, margin, 290);
      }

      const fileName = `Ata_Reuniao_${project.name.replace(/\s+/g, '_')}_${date}.pdf`;
      doc.save(fileName);
      
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

        {/* Footer Actions */}
        <div className="bg-baccarim-hover p-6 border-t border-baccarim-border flex justify-end gap-4 sticky bottom-0">
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-transparent text-baccarim-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-baccarim-text hover:bg-baccarim-active transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={generatePDF}
            disabled={isGenerating || !participants || !agenda}
            className="px-8 py-4 bg-baccarim-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isGenerating ? (
              <><i className="fas fa-spinner fa-spin"></i><span>Gerando PDF...</span></>
            ) : (
              <><i className="fas fa-file-pdf"></i><span>Baixar PDF</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProjectMeetingMinutesView;

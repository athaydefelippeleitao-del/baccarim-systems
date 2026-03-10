
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PhotoReport, Project, PhotoItem } from '../types';
import { analyzeVistoriaImage } from '../services/openaiClient';

declare const L: any;

interface PhotoReportViewProps {
  projects: Project[];
  reports: PhotoReport[];
  onUpdateReport: (report: PhotoReport) => void;
  onDeleteReport: (id: string) => void;
}

interface PhotoItemInternal extends PhotoItem {
  isAnalyzing?: boolean;
}

const PhotoReportView: React.FC<PhotoReportViewProps> = ({ projects, reports, onUpdateReport, onDeleteReport }) => {
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PhotoReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<PhotoReport | null>(null);
  const [formStep, setFormStep] = useState(1);


  const initialDraftState: Partial<PhotoReport> = {
    title: 'RELATÓRIO FOTOGRÁFICO',
    date: new Date().toISOString().split('T')[0],
    respName: 'Alberto Baccarim Junior',
    respRole: 'Engenheiro Civil',
    respCrea: 'CREA/PR',
    respReg: '142.811/D',
    respCompany: 'BACCARIM ENGENHARIA URBANA LTDA',
    respEmail: 'alberto@baccarimengenharia.com.br',
    respCnpj: '03.019.603/0001-23',
    respAddress: 'Avenida Dom Pedro II, nº 33, Centro, Sala 02',
    respCity: 'Ibiporã-Paraná',
    respCep: '86200-000',
    respPhone: '(43) 3268-0916',
    technicalBasis: 'Resolução SEDEST nº 050/2022',
    ownerName: '',
    entName: '', entCpf: '', entAddress: '', entDistrict: '', entCity: 'Londrina/PR', entCep: '',
    projName: '', projAddress: '', projDistrict: '', projCity: 'Londrina/PR', projCep: '', projLicense: '',
    photos: []
  };

  const [draftReport, setDraftReport] = useState<Partial<PhotoReport>>(initialDraftState);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditReport = (report: PhotoReport) => {
    setDraftReport(report);
    setIsEditing(true);
    setFormStep(1);
    setShowNewReportModal(true);
  };

  const handleProjectLink = (project: Project) => {
    setDraftReport(prev => ({
      ...prev,
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      ownerName: project.specs.responsavelLegal || '',
      entName: project.razaoSocial,
      entCpf: project.cnpj,
      entAddress: project.specs.sedeEndereco || '',
      entDistrict: project.specs.sedeBairro || '',
      entCity: project.specs.sedeCidade || 'Londrina/PR',
      entCep: project.specs.sedeCep || '',
      projName: project.name,
      projAddress: project.location,
      projDistrict: project.specs.bairro || '',
      projCity: project.specs.cidade || 'Londrina/PR',
      projCep: project.specs.cep || '',
      projLicense: project.specs.licencaObtida || 'Em andamento para parcelamento do solo'
    }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const getUniquePoints = (photos: PhotoItem[]) => {
    const points: { lat: number; lng: number; photos: PhotoItem[]; pointNumber: number }[] = [];
    photos.forEach(photo => {
      if (photo.lat && photo.lng) {
        let existingPoint = points.find(p => Math.abs(p.lat - photo.lat!) < 0.00001 && Math.abs(p.lng - photo.lng!) < 0.00001);
        if (existingPoint) {
          existingPoint.photos.push(photo);
        } else {
          points.push({ lat: photo.lat!, lng: photo.lng!, photos: [photo], pointNumber: points.length + 1 });
        }
      }
    });
    return points;
  };

  useEffect(() => {
    if (selectedReport && mapContainerRef.current) {
      const container = mapContainerRef.current;
      container.innerHTML = '';
      const mapDiv = document.createElement('div');
      mapDiv.style.width = '100%';
      mapDiv.style.height = '100%';
      container.appendChild(mapDiv);

      const points = getUniquePoints(selectedReport.photos);

      if (points.length > 0) {
        const timer = setTimeout(() => {
          const map = L.map(mapDiv, {
            zoomControl: false,
            attributionControl: false,
            interactive: false,
            preferCanvas: true
          }).setView([points[0].lat, points[0].lng], 18);

          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 22,
            crossOrigin: true
          }).addTo(map);

          points.forEach((p) => {
            const iconHtml = `<div style="background: #002D62; color: white; border: 2.5px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">${p.pointNumber}</div>`;
            L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'b-marker', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(map);
          });

          // Draw a line connecting the points
          if (points.length > 1) {
            L.polyline(points.map(p => [p.lat, p.lng] as [number, number]), {
              color: '#3FA9F5',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10'
            }).addTo(map);
          }

          map.invalidateSize();
          if (points.length > 1) {
            const bounds = L.latLngBounds(points.map(pt => [pt.lat, pt.lng]));
            map.fitBounds(bounds.pad(0.3));
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedReport]);

  const resizeImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const incoming: PhotoItemInternal[] = [];
    for (const file of Array.from(files) as File[]) {
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader(); r.onload = (ev) => res(ev.target?.result as string); r.readAsDataURL(file);
      });

      // Redimensionar a imagem original para um tamanho razoável (ex: 1280px) para não sobrecarregar o db.json
      const optimizedBase64 = await resizeImage(base64, 1280, 1280);

      incoming.push({
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        url: optimizedBase64,
        caption: '',
        timestamp: new Date().toLocaleDateString('pt-BR'),
        coordE: '',
        coordN: '',
        isAnalyzing: true
      });
    }
    setDraftReport(prev => ({ ...prev, photos: [...(prev.photos || []), ...incoming] }));

    // Processar imagens sequencialmente para não estourar os limites da OpenAI (Too Many Requests / 429)
    const processImages = async () => {
      for (const photo of incoming) {
        try {
          // Usar a imagem já otimizada para análise
          const res = await analyzeVistoriaImage(photo.url);

          if (res) {
            setDraftReport(prev => ({
              ...prev,
              photos: prev.photos?.map(p => p.id === photo.id ? { ...p, ...res, isAnalyzing: false } : p)
            }));
          }
        } catch (error: any) {
          console.error("Erro na análise da imagem:", error);
          alert(`Erro na OpenAI: ${error?.message || error || 'Erro desconhecido'}`);
        } finally {
          // Garantir que o estado de carregamento seja removido mesmo em caso de erro ou se res for nulo
          setDraftReport(prev => ({
            ...prev,
            photos: prev.photos?.map(p => p.id === photo.id ? { ...p, isAnalyzing: false } : p)
          }));
        }
        // Aguardar 1 segundo entre uma requisição e outra para proteger contra Rate Limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    processImages();
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;
    onDeleteReport(reportToDelete.id);
    setReportToDelete(null);
  };

  const handleSaveReport = () => {
    if (!draftReport.projectId) return;
    if (isEditing && draftReport.id) {
      onUpdateReport(draftReport as PhotoReport);
      setSelectedReport(draftReport as PhotoReport);
    } else {
      const newReport = { ...draftReport, id: `rep-${Date.now()}` } as PhotoReport;
      onUpdateReport(newReport);
      setSelectedReport(newReport);
    }
    setShowNewReportModal(false);
    setIsEditing(false);
  };

  const handleGeneratePDF = async () => {
    if (!reportContentRef.current || !selectedReport) return;
    setIsGeneratingPdf(true);

    // Give Leaflet map extra time to fully render tiles before capture
    await new Promise(resolve => setTimeout(resolve, 1500));

    const opt = {
      margin: 0,
      filename: `BACCARIM_LAUDO_${selectedReport.projectName.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try { await (window as any).html2pdf().set(opt).from(reportContentRef.current).save(); } finally { setIsGeneratingPdf(false); }
  };

  const photoPages = useMemo(() => {
    if (!selectedReport) return [];
    const pages = [];
    for (let i = 0; i < selectedReport.photos.length; i += 4) pages.push(selectedReport.photos.slice(i, i + 4));
    return pages;
  }, [selectedReport]);

  const getPointInfoLabel = (photo: PhotoItem, allPhotos: PhotoItem[]) => {
    const points = getUniquePoints(allPhotos);
    const point = points.find(p => Math.abs(p.lat - (photo.lat || 0)) < 0.00001 && Math.abs(p.lng - (photo.lng || 0)) < 0.00001);
    if (!point) return '';

    return `PONTO ${point.pointNumber}`;
  };

  const BaccarimLogo = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-col items-end ${className}`}>
      <div className="w-10 h-10 grid grid-cols-2 gap-1">
        <div className="bg-[#00B08E] row-span-2 rounded-sm transform skew-y-[-12deg]"></div>
        <div className="bg-[#002D62] rounded-sm transform skew-y-[12deg]"></div>
        <div className="bg-[#3FA9F5] rounded-sm transform skew-y-[12deg]"></div>
      </div>
    </div>
  );

  const WatermarkLogo = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
      <div className="w-[150mm] h-[150mm] grid grid-cols-2 gap-4 transform rotate-12">
        <div className="bg-[#00B08E] row-span-2 rounded-[2rem] transform skew-y-[-12deg]"></div>
        <div className="bg-[#002D62] rounded-[2rem] transform skew-y-[12deg]"></div>
        <div className="bg-[#3FA9F5] rounded-[2rem] transform skew-y-[12deg]"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 print:hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h2 className="text-3xl font-black text-baccarim-navy tracking-tight">Relatórios Fotográficos</h2></div>
        <button onClick={() => { setDraftReport(initialDraftState); setFormStep(1); setIsEditing(false); setShowNewReportModal(true); }} className="px-8 py-5 bg-baccarim-navy/10 border border-baccarim-border text-baccarim-text rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-baccarim-navy/20 transition-all">Criar Laudo Técnico</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reports.map(report => (
          <div key={report.id} className="bg-baccarim-card rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative" onClick={() => setSelectedReport(report)}>
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReportToDelete(report);
                }}
                className="w-10 h-10 rounded-full bg-baccarim-card/90 backdrop-blur text-red-500 shadow-lg flex items-center justify-center hover:bg-red-500/20 hover:text-baccarim-text transition-all"
              >
                <i className="fas fa-trash-can"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditReport(report);
                }}
                className="w-10 h-10 rounded-full bg-baccarim-card/90 backdrop-blur text-baccarim-blue shadow-lg flex items-center justify-center hover:bg-baccarim-blue/20 hover:text-baccarim-text transition-all"
              >
                <i className="fas fa-edit"></i>
              </button>
            </div>
            <div className="aspect-video bg-baccarim-active rounded-[2rem] mb-6 overflow-hidden relative">
              {report.photos[0] ? <img src={report.photos[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="flex items-center justify-center h-full text-slate-200"><i className="fas fa-image text-5xl"></i></div>}
              <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-baccarim-card/90 backdrop-blur text-[8px] font-black uppercase rounded-full text-baccarim-navy shadow-sm">{report.photos.length} FOTOS</span></div>
            </div>
            <h3 className="text-lg font-black text-baccarim-navy truncate">{report.clientName}</h3>
          </div>
        ))}
      </div>

      {showNewReportModal && (
        <div className="fixed inset-0 bg-baccarim-navy/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-5xl shadow-2xl p-6 md:p-10 flex flex-col max-h-[95vh] relative pb-safe">
            <div className="flex justify-between items-center mb-6 md:mb-10">
              <h3 className="text-xl md:text-2xl font-black text-baccarim-navy">Configurador de Laudo</h3>
              <button onClick={() => setShowNewReportModal(false)} className="w-10 h-10 rounded-full bg-baccarim-hover text-slate-300 hover:text-red-500"><i className="fas fa-times"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-1 custom-scrollbar pb-24">
              {formStep === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                  <div>
                    <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em] mb-4">Informações Gerais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Título do Laudo</label>
                        <input value={draftReport.title} onChange={e => setDraftReport({ ...draftReport, title: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" placeholder="Ex: RELATÓRIO FOTOGRÁFICO" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Data do Laudo</label>
                        <input type="date" value={draftReport.date} onChange={e => setDraftReport({ ...draftReport, date: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em] mb-4">1. Selecione o Empreendimento</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projects.map(p => {
                        const isSelected = draftReport.projectId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleProjectLink(p)}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${isSelected ? 'border-baccarim-blue bg-baccarim-blue/5' : 'border-slate-100 bg-baccarim-card hover:border-slate-200'}`}
                          >
                            <div className="min-w-0">
                              <p className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest">{p.clientName}</p>
                              <h5 className={`text-sm font-black truncate ${isSelected ? 'text-baccarim-blue' : 'text-baccarim-navy'}`}>{p.name}</h5>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-baccarim-blue border-baccarim-blue text-baccarim-text' : 'border-slate-200 text-transparent'}`}>
                              <i className="fas fa-check text-[10px]"></i>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {draftReport.projectId && (
                    <div className="space-y-10 pt-4 border-t animate-in fade-in">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em]">1. Identificação do Empreendedor</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Cliente / Empresa</label>
                            <input value={draftReport.clientName} onChange={e => setDraftReport({ ...draftReport, clientName: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm border-baccarim-blue/30" placeholder="Ex: A. YOSHII" />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Proprietário / Interessado</label>
                            <input value={draftReport.ownerName} onChange={e => setDraftReport({ ...draftReport, ownerName: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm border-baccarim-blue/30" placeholder="Ex: Francisco Sigueru Hiraiwa" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Razão Social</label>
                            <input value={draftReport.entName} onChange={e => setDraftReport({ ...draftReport, entName: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">CPF / CNPJ</label>
                            <input value={draftReport.entCpf} onChange={e => setDraftReport({ ...draftReport, entCpf: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Endereço</label>
                            <input value={draftReport.entAddress} onChange={e => setDraftReport({ ...draftReport, entAddress: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Bairro</label>
                            <input value={draftReport.entDistrict} onChange={e => setDraftReport({ ...draftReport, entDistrict: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Município/UF</label>
                              <input value={draftReport.entCity} onChange={e => setDraftReport({ ...draftReport, entCity: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">CEP</label>
                              <input value={draftReport.entCep} onChange={e => setDraftReport({ ...draftReport, entCep: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 pt-4 border-t">
                        <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em]">1.1. Identificação do Empreendimento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nome</label>
                            <input value={draftReport.projName} onChange={e => setDraftReport({ ...draftReport, projName: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Endereço</label>
                            <input value={draftReport.projAddress} onChange={e => setDraftReport({ ...draftReport, projAddress: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Bairro</label>
                            <input value={draftReport.projDistrict} onChange={e => setDraftReport({ ...draftReport, projDistrict: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Município/UF</label>
                              <input value={draftReport.projCity} onChange={e => setDraftReport({ ...draftReport, projCity: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">CEP</label>
                              <input value={draftReport.projCep} onChange={e => setDraftReport({ ...draftReport, projCep: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Licença Ambiental</label>
                            <input value={draftReport.projLicense} onChange={e => setDraftReport({ ...draftReport, projLicense: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Embasamento Técnico</label>
                            <input value={draftReport.technicalBasis} onChange={e => setDraftReport({ ...draftReport, technicalBasis: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" placeholder="Ex: Resolução SEDEST nº 050/2022" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 pt-4 border-t">
                        <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em]">2. Identificação da Empresa e Responsável</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Responsável Técnico</label>
                            <input value={draftReport.respName} onChange={e => setDraftReport({ ...draftReport, respName: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Cargo / Função</label>
                            <input value={draftReport.respRole} onChange={e => setDraftReport({ ...draftReport, respRole: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" placeholder="Ex: Engenheiro Civil" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Conselho de Classe</label>
                              <input value={draftReport.respCrea} onChange={e => setDraftReport({ ...draftReport, respCrea: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nº Registro</label>
                              <input value={draftReport.respReg} onChange={e => setDraftReport({ ...draftReport, respReg: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Empresa Responsável</label>
                            <input value={draftReport.respCompany} onChange={e => setDraftReport({ ...draftReport, respCompany: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">CNPJ</label>
                            <input value={draftReport.respCnpj} onChange={e => setDraftReport({ ...draftReport, respCnpj: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">E-mail</label>
                            <input value={draftReport.respEmail} onChange={e => setDraftReport({ ...draftReport, respEmail: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Telefone</label>
                            <input value={draftReport.respPhone} onChange={e => setDraftReport({ ...draftReport, respPhone: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Endereço</label>
                            <input value={draftReport.respAddress} onChange={e => setDraftReport({ ...draftReport, respAddress: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Município/UF</label>
                              <input value={draftReport.respCity} onChange={e => setDraftReport({ ...draftReport, respCity: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">CEP</label>
                              <input value={draftReport.respCep} onChange={e => setDraftReport({ ...draftReport, respCep: e.target.value })} className="w-full bg-baccarim-hover border p-4 rounded-xl text-sm font-bold shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                  <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em] border-b pb-2">Registros Fotográficos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {draftReport.photos?.map((photo: PhotoItemInternal, idx) => (
                      <div key={photo.id} className="p-4 bg-baccarim-hover rounded-2xl flex gap-4 relative group border border-slate-100">
                        {photo.isAnalyzing && <div className="absolute inset-0 bg-baccarim-card/60 flex items-center justify-center rounded-2xl z-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div></div>}
                        <img src={photo.url} className="w-24 h-24 object-contain rounded-lg shadow-sm bg-white" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-blue-500 uppercase">FOTO {idx + 1} {photo.lat ? `• ${getPointInfoLabel(photo, draftReport.photos || [])}` : ''}</p>
                            <button onClick={() => setDraftReport({ ...draftReport, photos: draftReport.photos?.filter(p => p.id !== photo.id) })} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[10px]"></i></button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[7px] font-black text-slate-400 uppercase ml-1">UTM E</label>
                              <input value={photo.coordE} onChange={e => setDraftReport({ ...draftReport, photos: draftReport.photos?.map(p => p.id === photo.id ? { ...p, coordE: e.target.value } : p) })} className="w-full text-[10px] p-2 bg-baccarim-card border rounded font-bold" placeholder="E" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[7px] font-black text-slate-400 uppercase ml-1">UTM N</label>
                              <input value={photo.coordN} onChange={e => setDraftReport({ ...draftReport, photos: draftReport.photos?.map(p => p.id === photo.id ? { ...p, coordN: e.target.value } : p) })} className="w-full text-[10px] p-2 bg-baccarim-card border rounded font-bold" placeholder="N" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <label className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 cursor-pointer bg-baccarim-hover/50 hover:bg-baccarim-hover transition-all border-slate-200">
                      <i className="fas fa-camera text-slate-300 text-3xl mb-3"></i>
                      <p className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest text-center">Tire fotos ou<br />anexe arquivos</p>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 md:mt-10 flex flex-wrap gap-4 pt-6 border-t bg-baccarim-card">
              {formStep > 1 && <button onClick={() => setFormStep(prev => prev - 1)} className="px-6 md:px-10 py-4 bg-baccarim-active text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px]">Voltar</button>}
              {formStep < 2 ? (
                <button onClick={() => setFormStep(prev => prev + 1)} disabled={!draftReport.projectId} className="flex-1 py-4 bg-baccarim-navy/10 border border-baccarim-border text-baccarim-text rounded-2xl font-black uppercase text-[10px] shadow-xl disabled:opacity-30">Próximo Passo</button>
              ) : (
                <>
                  <button onClick={() => setSelectedReport(draftReport as PhotoReport)} disabled={!draftReport.photos?.length} className="px-6 md:px-10 py-4 bg-baccarim-blue/10 border border-baccarim-border text-baccarim-text rounded-2xl font-black uppercase text-[10px] shadow-xl">Visualizar Prévia</button>
                  <button onClick={handleSaveReport} disabled={!draftReport.photos?.length} className="flex-1 py-4 bg-baccarim-green/10 border border-baccarim-border text-baccarim-text rounded-2xl font-black uppercase text-[10px] shadow-xl">Finalizar e Gerar Laudo</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900 z-[200] overflow-y-auto p-4 md:p-10 print:bg-baccarim-card custom-scrollbar">
          <div className="fixed top-8 left-8 z-[210] print:hidden">
            <div className="bg-baccarim-card/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-baccarim-border">
              <p className="text-[10px] font-black text-baccarim-navy uppercase tracking-widest mb-1">Visualização do Laudo</p>
              <p className="text-[8px] text-baccarim-text-muted font-bold uppercase">Role para baixo para ver todas as páginas</p>
            </div>
          </div>
          <div className="fixed top-8 right-8 flex space-x-4 z-[210] print:hidden">
            <button onClick={handleGeneratePDF} disabled={isGeneratingPdf} className="w-16 h-16 bg-baccarim-green/10 border border-baccarim-border text-baccarim-text rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              {isGeneratingPdf ? <div className="w-6 h-6 border-2 border-baccarim-border/30 border-t-baccarim-text rounded-full animate-spin"></div> : <i className="fas fa-file-pdf text-xl"></i>}
            </button>
            <button onClick={() => setSelectedReport(null)} className="w-16 h-16 bg-baccarim-card text-baccarim-navy rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><i className="fas fa-times text-xl"></i></button>
          </div>

          <div ref={reportContentRef} className="bg-white mx-auto shadow-2xl print:my-0 mb-48" style={{ width: '210mm', minHeight: '297mm', color: '#000000' }}>
            <div className="page-a4 flex flex-col justify-between items-center p-[40mm] relative page-break" style={{ height: '297mm' }}>
              <WatermarkLogo />

              {/* Top Section - Owner Name */}
              <div className="w-full text-center relative z-10 mt-10">
                <h3 className="text-[28px] font-black text-[#002D62] uppercase tracking-tight leading-tight">
                  {selectedReport.ownerName || selectedReport.entName}
                </h3>
              </div>

              {/* Middle Section - Baccarim Branding */}
              <div className="text-center w-full space-y-16 relative z-10">
                <div className="space-y-6 flex flex-col items-center">
                  <div className="w-24 h-24 grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-[#00B08E] row-span-2 rounded-md transform skew-y-[-12deg]"></div>
                    <div className="bg-[#002D62] rounded-md transform skew-y-[12deg]"></div>
                    <div className="bg-[#3FA9F5] rounded-md transform skew-y-[12deg]"></div>
                  </div>
                  <h1 className="text-[42px] font-black text-[#002D62] leading-[1.1] tracking-tighter uppercase">Baccarim<br />Engenharia de<br />Loteamentos</h1>
                </div>

                <div className="space-y-4 flex flex-col items-center">
                  <div className="h-1 w-24 bg-baccarim-blue mb-2"></div>
                  <p className="text-[18px] font-bold text-baccarim-text-muted uppercase tracking-[0.4em]">{selectedReport.title}</p>
                </div>

                <div className="pt-10">
                  <h2 className="text-[24px] font-black text-[#002D62] uppercase leading-tight border-y-2 border-slate-100 py-6 inline-block px-12">
                    {selectedReport.clientName}
                  </h2>
                </div>
              </div>

              {/* Bottom Section - Location & Date */}
              <div className="w-full text-center relative z-10 mb-10">
                <div className="space-y-1">
                  <p className="text-[14px] font-black text-[#002D62] uppercase tracking-widest">
                    {selectedReport.respCity}
                  </p>
                  <p className="text-[14px] font-black text-[#002D62]">
                    {new Date(selectedReport.date).getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* NEW PAGE: Technical Identification / Signature Page */}
            <div className="page-a4 p-[30mm] flex flex-col justify-between page-break relative" style={{ height: '297mm' }}>
              <WatermarkLogo />
              <div className="absolute top-12 right-12"><BaccarimLogo className="scale-75" /></div>
              <div className="absolute bottom-10 right-10 text-[12px] font-bold text-[#002D62]">2</div>

              <div className="relative z-10 space-y-20">
                <div className="text-center">
                  <h3 className="text-[18px] font-black text-[#002D62] uppercase underline decoration-2 underline-offset-8">RELATÓRIO FOTOGRÁFICO</h3>
                </div>

                <div className="grid grid-cols-2 gap-20">
                  <div className="space-y-12">
                    <p className="text-[16px] font-black text-[#002D62] text-center">Contratante</p>
                    <div className="space-y-6 text-center">
                      <p className="text-[16px] font-bold text-[#002D62]">{selectedReport.ownerName || selectedReport.entName}</p>
                      <p className="text-[14px] font-bold text-[#002D62] leading-relaxed">
                        {selectedReport.entAddress}, {selectedReport.entDistrict}. {selectedReport.entCity}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p className="text-[16px] font-black text-[#002D62] text-center">Contratada</p>
                    <div className="space-y-6 text-center flex flex-col items-center">
                      <div className="text-left">
                        <h4 className="text-[24px] font-black text-[#002D62] leading-tight uppercase">Baccarim<br />Engenharia de<br />Loteamentos</h4>
                      </div>
                      <p className="text-[14px] font-bold text-[#002D62] leading-relaxed">
                        {selectedReport.respAddress} – {selectedReport.respCity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-[#002D62] overflow-hidden rounded-sm">
                  <div className="grid grid-cols-2 border-b-2 border-[#002D62]">
                    <div className="p-4 text-center border-r-2 border-[#002D62] space-y-2">
                      <p className="text-[14px] font-black text-[#002D62] uppercase">ELABORAÇÃO</p>
                      <p className="text-[14px] font-bold text-[#002D62]">
                        {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(selectedReport.date)).replace(/^\w/, c => c.toUpperCase())}
                      </p>
                    </div>
                    <div className="p-4 text-center space-y-2">
                      <p className="text-[14px] font-black text-[#002D62] uppercase">EMBASAMENTO TÉCNICO</p>
                      <p className="text-[14px] font-bold text-[#002D62]">{selectedReport.technicalBasis || 'Resolução SEDEST nº 050/2022'}</p>
                    </div>
                  </div>
                  <div className="p-3 text-center bg-slate-50">
                    <p className="text-[12px] font-black text-[#002D62]">Todos os direitos são reservados à Baccarim Engenharia Urbana LTDA</p>
                  </div>
                </div>

                <div className="space-y-10 text-center pt-10">
                  <p className="text-[14px] font-black text-[#002D62] uppercase tracking-widest">RESPONSÁVEL TÉCNICO DO RAS</p>
                  <div className="space-y-2">
                    <p className="text-[18px] font-black text-[#002D62]">{selectedReport.respName}</p>
                    <p className="text-[14px] font-bold text-[#002D62]">{selectedReport.respRole || 'Engenheiro Civil'}</p>
                    <p className="text-[14px] font-bold text-[#002D62]">{selectedReport.respCrea} – {selectedReport.respReg}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-a4 p-[25mm] space-y-14 page-break relative" style={{ height: '297mm' }}>
              <WatermarkLogo />
              <div className="absolute top-12 right-12"><BaccarimLogo className="scale-75" /></div>
              <div className="absolute bottom-10 right-10 text-[12px] font-bold text-[#002D62]">3</div>
              <div className="pt-24 space-y-12 text-[12px] relative z-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-1 w-1 bg-[#00B08E]"></div>
                    <h3 className="text-[16px] font-black uppercase text-[#002D62]">1. IDENTIFICAÇÃO DO EMPREENDEDOR</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pl-10">
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Nome</span> <span className="font-bold">{selectedReport.entName}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">CPF/CNPJ</span> <span className="font-bold">{selectedReport.entCpf}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Endereço</span> <span className="font-bold">{selectedReport.entAddress}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Bairro</span> <span className="font-bold">{selectedReport.entDistrict}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Município/UF</span> <span className="font-bold">{selectedReport.entCity}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">CEP</span> <span className="font-bold">{selectedReport.entCep}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-a4 p-[25mm] space-y-14 page-break relative" style={{ height: '297mm' }}>
              <WatermarkLogo />
              <div className="absolute top-12 right-12"><BaccarimLogo className="scale-75" /></div>
              <div className="absolute bottom-10 right-10 text-[12px] font-bold text-[#002D62]">4</div>
              <div className="pt-24 space-y-12 text-[12px] relative z-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-1 w-1 bg-[#3FA9F5]"></div>
                    <h3 className="text-[16px] font-black uppercase text-[#002D62]">1.1. IDENTIFICAÇÃO DO EMPREENDIMENTO</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pl-10">
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Nome</span> <span className="font-bold">{selectedReport.projName}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Endereço</span> <span className="font-bold">{selectedReport.projAddress}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Bairro</span> <span className="font-bold">{selectedReport.projDistrict}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Município/UF</span> <span className="font-bold">{selectedReport.projCity}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">CEP</span> <span className="font-bold">{selectedReport.projCep}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Licença Ambiental</span> <span className="font-bold text-[#00B08E]">{selectedReport.projLicense}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-a4 p-[25mm] space-y-14 page-break relative" style={{ height: '297mm' }}>
              <WatermarkLogo />
              <div className="absolute top-12 right-12"><BaccarimLogo className="scale-75" /></div>
              <div className="absolute bottom-10 right-10 text-[12px] font-bold text-[#002D62]">5</div>
              <div className="pt-24 space-y-12 text-[12px] relative z-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-1 w-1 bg-[#002D62]"></div>
                    <h3 className="text-[16px] font-black uppercase text-[#002D62]">2. IDENTIFICAÇÃO DA EMPRESA E RESPONSÁVEL TÉCNICO</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pl-10">
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Responsável Técnico</span> <span className="font-bold">{selectedReport.respName}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Conselho de Classe</span> <span className="font-bold">{selectedReport.respCrea}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Nº Registro</span> <span className="font-bold">{selectedReport.respReg}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Empresa Responsável</span> <span className="font-bold">{selectedReport.respCompany}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">CNPJ</span> <span className="font-bold">{selectedReport.respCnpj}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">E-mail</span> <span className="font-bold">{selectedReport.respEmail}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Telefone</span> <span className="font-bold">{selectedReport.respPhone}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Endereço</span> <span className="font-bold">{selectedReport.respAddress}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">Município/UF</span> <span className="font-bold">{selectedReport.respCity}</span></div>
                    <div className="flex border-b border-slate-100 pb-2"><span className="w-40 font-black text-slate-400 uppercase text-[10px]">CEP</span> <span className="font-bold">{selectedReport.respCep}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-a4 p-[25mm] space-y-14 page-break relative" style={{ height: '297mm' }}>
              <WatermarkLogo />
              <div className="absolute top-12 right-12"><BaccarimLogo className="scale-75" /></div>
              <div className="absolute bottom-10 right-10 text-[12px] font-bold text-[#002D62]">6</div>
              <div className="pt-24 space-y-12 text-[12px] relative z-10">
                <h3 className="text-[20px] font-black text-center uppercase text-[#002D62] mb-10">LISTA DE FIGURAS</h3>
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="font-bold text-[#002D62] whitespace-nowrap">Figura 1 – Mapa de localização dos Pontos do Relatório fotográfico</span>
                    <div className="flex-1 border-b border-dotted border-slate-400 mb-1"></div>
                    <span className="font-bold text-[#002D62]">7</span>
                  </div>
                  {selectedReport.photos.map((photo, idx) => {
                    const pointLabel = getPointInfoLabel(photo, selectedReport.photos);
                    const pageNum = Math.floor(idx / 4) + 8;
                    return (
                      <div key={photo.id} className="flex items-end gap-2">
                        <span className="font-bold text-[#002D62] whitespace-nowrap">Figura {idx + 2} – {pointLabel}</span>
                        <div className="flex-1 border-b border-dotted border-slate-400 mb-1"></div>
                        <span className="font-bold text-[#002D62]">{pageNum}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="page-a4 p-[25mm] space-y-10 page-break relative" style={{ height: '297mm' }}>
              <WatermarkLogo />
              <div className="absolute top-12 right-12"><BaccarimLogo className="scale-75" /></div>
              <div className="absolute bottom-10 right-10 text-[12px] font-bold text-[#002D62]">7</div>
              <div className="pt-24 flex flex-col h-full relative z-10">
                <h4 className="text-[16px] font-black uppercase mb-10 border-b-2 border-[#002D62] pb-4 text-[#002D62]">MAPA DE LOCALIZAÇÃO DOS PONTOS</h4>
                <div className="flex-1 bg-white rounded-3xl overflow-hidden border-4 border-slate-100 relative shadow-inner">
                  <div ref={mapContainerRef} className="w-full h-full"></div>
                </div>
                <p className="text-[11px] text-center mt-6 font-bold text-slate-500 italic">Figura 1 – Mapa de localização dos Pontos do Relatório fotográfico.</p>
              </div>
            </div>

            {photoPages.map((pagePhotos, pageIdx) => (
              <div key={pageIdx} className="page-a4 p-[20mm] page-break relative" style={{ height: '297mm' }}>
                <WatermarkLogo />
                <div className="absolute top-12 right-12"><BaccarimLogo className="scale-75" /></div>
                <div className="absolute bottom-10 right-10 text-[12px] font-bold text-[#002D62]">{pageIdx + 8}</div>
                <div className="pt-24 grid grid-cols-2 gap-x-12 gap-y-14 relative z-10">
                  {pagePhotos.map((photo, photoIdx) => {
                    const globalIndex = pageIdx * 4 + photoIdx + 1;
                    const pointLabel = getPointInfoLabel(photo, selectedReport.photos);
                    return (
                      <div key={photo.id} className="space-y-4">
                        <div className="relative aspect-[3/4] bg-white rounded-xl border-4 border-slate-100 overflow-hidden shadow-lg group">
                          <img src={photo.url} className="w-full h-full object-contain" />

                        </div>
                        <div className="px-4 space-y-2">
                          <p className="text-[10px] font-black text-center leading-relaxed text-[#002D62] bg-slate-50 py-2 rounded-lg border border-slate-100">
                            Figura {globalIndex + 1} – {pointLabel}.
                          </p>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <style>{`
            .page-a4 { background: white; box-sizing: border-box; }
            .b-marker { background: transparent !important; border: none !important; }
            @media print {
              body { background: white !important; }
              .page-break { page-break-after: always; display: block; clear: both; }
              @page { size: A4; margin: 0; }
            }
          `}</style>
        </div>
      )}
      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO DE RELATÓRIO */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-[#002D62]/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border-t-8 border-t-[#FF5A5A]">
            <div className="w-20 h-20 bg-[#FFF1F1] text-[#FF5A5A] rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner">
              <i className="fas fa-trash-can animate-bounce-slow"></i>
            </div>
            <h3 className="text-2xl font-black text-[#002D62] mb-3 tracking-tight">Excluir Relatório?</h3>
            <p className="text-[11px] text-baccarim-text-muted font-medium mb-10 leading-relaxed uppercase tracking-widest">
              Deseja remover permanentemente o laudo de <strong>{reportToDelete.clientName}</strong>? <br />Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setReportToDelete(null)}
                className="py-5 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-baccarim-active transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-5 bg-[#FF5A5A] text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-[#FF5A5A]/20 hover:bg-red-600 transition-all hover:-translate-y-1"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoReportView;

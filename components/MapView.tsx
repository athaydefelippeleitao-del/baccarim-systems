
import React, { useEffect, useRef, useState } from 'react';
import { Project } from '../types';

interface MapViewProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

declare const L: any;

const MapView: React.FC<MapViewProps> = ({ projects, onSelectProject }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<Record<string, any>>({});
  const markersRef = useRef<Record<string, any>>({});
  
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(typeof L !== 'undefined');
  const [visibleProjectIds, setVisibleProjectIds] = useState<Set<string>>(new Set(projects.map(p => p.id)));
  const [showControls, setShowControls] = useState(window.innerWidth > 768);
  const [mapMode, setMapMode] = useState<'streets' | 'satellite'>('streets');

  // Verificar se o Leaflet carregou (caso o script demore)
  useEffect(() => {
    if (typeof L !== 'undefined') {
      setIsLeafletLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (typeof L !== 'undefined') {
        setIsLeafletLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Sincronizar projetos visíveis quando a lista de projetos mudar
  useEffect(() => {
    setVisibleProjectIds(prev => {
      const next = new Set(prev);
      let changed = false;
      projects.forEach(p => {
        if (!next.has(p.id)) {
          next.add(p.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [projects]);

  // Inicialização Robusta
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      try {
        const initialLat = projects.find(p => p.specs.lat)?.specs.lat || -23.3106;
        const initialLng = projects.find(p => p.specs.lng)?.specs.lng || -51.1628;

        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 14,
          zoomControl: false,
          fadeAnimation: true
        });

        layersRef.current.streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO'
        });

        layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri'
        });

        layersRef.current.streets.addTo(mapInstanceRef.current);
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

        // Garante que o mapa preencha o container
        setTimeout(() => {
          if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 500);
      } catch (error) {
        console.error('Erro ao inicializar o mapa:', error);
      }
    };

    initMap();

    // Observer para detectar mudanças de tamanho do container (evita tela branca)
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Alternância de Camadas
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (mapMode === 'satellite') {
      mapInstanceRef.current.removeLayer(layersRef.current.streets);
      layersRef.current.satellite.addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.removeLayer(layersRef.current.satellite);
      layersRef.current.streets.addTo(mapInstanceRef.current);
    }
  }, [mapMode]);

  // Atualização de Marcadores
  useEffect(() => {
    if (!isLeafletLoaded || !mapInstanceRef.current) return;

    // Limpar marcadores antigos
    Object.keys(markersRef.current).forEach(id => {
      markersRef.current[id].remove();
      delete markersRef.current[id];
    });

    projects.forEach(project => {
      if (project.specs.lat && project.specs.lng && visibleProjectIds.has(project.id)) {
        const markerColor = project.status === 'Concluído' ? '#00B08E' : project.status === 'Em Execução' ? '#3FA9F5' : '#002D62';
        
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="marker-pin" style="
              background-color: ${markerColor}; 
              width: 32px; 
              height: 32px; 
              border-radius: 50% 50% 50% 0; 
              transform: rotate(-45deg); 
              border: 3px solid white; 
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fas fa-building" style="transform: rotate(45deg); color: white; font-size: 12px;"></i>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const marker = L.marker([project.specs.lat, project.specs.lng], { icon: customIcon }).addTo(mapInstanceRef.current);
        
        const popupContent = `
          <div style="padding: 10px; min-width: 220px; font-family: 'Plus Jakarta Sans', sans-serif;">
            <p style="margin: 0; font-size: 9px; font-weight: 800; color: #3FA9F5; text-transform: uppercase; letter-spacing: 0.1em;">${project.clientName}</p>
            <h4 style="margin: 4px 0; font-size: 18px; font-weight: 900; color: #000000; line-height: 1.1;">${project.name}</h4>
            <p style="margin: 0 0 4px 0; font-size: 10px; color: #000000; font-weight: 500;">${project.location}</p>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <div style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 7px; color: #64748b; text-transform: uppercase; font-weight: 800;">UTM E</p>
                <p style="margin: 0; font-size: 9px; color: #000000; font-weight: 700;">${project.specs.coordE || '-'}</p>
              </div>
              <div style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 7px; color: #64748b; text-transform: uppercase; font-weight: 800;">UTM N</p>
                <p style="margin: 0; font-size: 9px; color: #000000; font-weight: 700;">${project.specs.coordN || '-'}</p>
              </div>
            </div>
            <button id="btn-map-details-${project.id}" style="
              width: 100%; 
              padding: 12px; 
              background: #f1f5f9; 
              color: #000000; 
              border: 1px solid #cbd5e1; 
              border-radius: 10px; 
              font-size: 10px; 
              font-weight: 800; 
              text-transform: uppercase; 
              cursor: pointer;
            ">Abrir Dossiê Técnico</button>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-map-details-${project.id}`);
          if (btn) btn.onclick = () => onSelectProject(project.id);
        });
        markersRef.current[project.id] = marker;
      }
    });
  }, [visibleProjectIds, projects]);

  const toggleProjectVisibility = (id: string) => {
    const newVisible = new Set(visibleProjectIds);
    if (newVisible.has(id)) newVisible.delete(id);
    else newVisible.add(id);
    setVisibleProjectIds(newVisible);
  };

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6 animate-in fade-in duration-700">
      {!isLeafletLoaded && (
        <div className="absolute inset-0 z-[100] bg-baccarim-card/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-baccarim-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black text-baccarim-navy uppercase tracking-widest">Carregando Mapa...</p>
          </div>
        </div>
      )}
      <header className="hidden md:flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-baccarim-navy tracking-tight">Geolocalização</h2>
          <p className="hidden md:block text-baccarim-text-muted font-medium text-sm">Controle de empreendimentos no território.</p>
        </div>
        <div className="flex items-center space-x-2 bg-baccarim-card p-1 rounded-xl shadow-sm border border-slate-100">
           <button onClick={() => setMapMode('streets')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${mapMode === 'streets' ? 'bg-baccarim-navy text-baccarim-text' : 'text-baccarim-text-muted'}`}>Mapa</button>
           <button onClick={() => setMapMode('satellite')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${mapMode === 'satellite' ? 'bg-baccarim-navy text-baccarim-text' : 'text-baccarim-text-muted'}`}>Satélite</button>
        </div>
      </header>

      {/* Mobile Map Controls */}
      <div className="md:hidden flex items-center justify-between px-4 pt-4 absolute top-0 left-0 right-0 z-[20]">
        <div className="bg-baccarim-card/90 backdrop-blur-md p-1 rounded-xl shadow-xl border border-slate-100 flex items-center">
           <button onClick={() => setMapMode('streets')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mapMode === 'streets' ? 'bg-baccarim-navy text-baccarim-text' : 'text-baccarim-text-muted'}`}>Mapa</button>
           <button onClick={() => setMapMode('satellite')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mapMode === 'satellite' ? 'bg-baccarim-navy text-baccarim-text' : 'text-baccarim-text-muted'}`}>Satélite</button>
        </div>
      </div>

      {/* Container Principal do Mapa com altura fixa no mobile para garantir renderização */}
      <div className="relative flex-1 min-h-[500px] md:min-h-0 bg-baccarim-card md:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-baccarim-active"></div>
        
        {/* Controles Flutuantes */}
        <button 
          onClick={() => setShowControls(!showControls)}
          className="absolute top-16 md:top-4 left-4 z-[10] w-12 h-12 bg-baccarim-card rounded-xl shadow-xl flex items-center justify-center text-baccarim-navy hover:scale-110 transition-all border border-slate-100"
        >
          <i className={`fas ${showControls ? 'fa-times' : 'fa-layer-group'}`}></i>
        </button>

        {showControls && (
          <div className="absolute top-16 md:top-4 left-20 z-[10] w-64 max-h-[80%] bg-baccarim-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 overflow-y-auto p-4 custom-scrollbar">
            <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest mb-3 px-2">Lista de Projetos</p>
            <div className="space-y-1">
              {projects.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-baccarim-hover transition-colors cursor-pointer" onClick={() => toggleProjectVisibility(p.id)}>
                   <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${visibleProjectIds.has(p.id) ? 'bg-baccarim-blue' : 'bg-slate-300'}`}></div>
                      <span className="text-[10px] font-bold text-baccarim-navy truncate">{p.name}</span>
                   </div>
                   <i className={`fas ${visibleProjectIds.has(p.id) ? 'fa-eye' : 'fa-eye-slash'} text-[10px] text-slate-300`}></i>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-div-icon { background: transparent !important; border: none !important; }
        .leaflet-container { font-family: 'Plus Jakarta Sans', sans-serif !important; border-radius: inherit; }
      `}</style>
    </div>
  );
};

export default MapView;

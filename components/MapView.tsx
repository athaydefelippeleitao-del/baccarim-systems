import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Project } from '../types';
import { utmToDecimal, parseKML, parseUTMCoord } from '../utils/geoUtils';

interface MapViewProps {
  projects: Project[];
  clients: string[];
  onSelectProject: (projectId: string) => void;
}

declare const L: any;

// Pré-compila o KML uma vez por projeto para não repetir o trabalho em cada render
const kmlCoordsCache = new Map<string, [number, number][]>();

const getKmlCoords = (project: Project): [number, number][] => {
  if (!project.specs?.kmlFile?.fileData) return [];
  const cacheKey = `${project.id}-${project.specs.kmlFile.fileName}`;
  if (kmlCoordsCache.has(cacheKey)) return kmlCoordsCache.get(cacheKey)!;
  try {
    const kmlText = decodeURIComponent(escape(atob(project.specs.kmlFile.fileData)));
    const coords = parseKML(kmlText);
    kmlCoordsCache.set(cacheKey, coords);
    return coords;
  } catch {
    return [];
  }
};

const MapView: React.FC<MapViewProps> = ({ projects, clients, onSelectProject }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<Record<string, any>>({});
  const layerGroupRef = useRef<any>(null); // LayerGroup único para todos markers/polygons
  const markersRef = useRef<Record<string, any>>({});
  const polygonsRef = useRef<Record<string, any>>({});

  const [isLeafletLoaded, setIsLeafletLoaded] = useState(typeof L !== 'undefined');
  const [visibleProjectIds, setVisibleProjectIds] = useState<Set<string>>(new Set(projects.map(p => p.id)));
  const [showControls, setShowControls] = useState(window.innerWidth > 768);
  const [mapMode, setMapMode] = useState<'streets' | 'satellite'>('streets');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const filteredProjectsByClient = selectedClient
    ? projects.filter(p => p.clientName === selectedClient)
    : projects;

  // Verificar se o Leaflet carregou
  useEffect(() => {
    if (typeof L !== 'undefined') { setIsLeafletLoaded(true); return; }
    const interval = setInterval(() => {
      if (typeof L !== 'undefined') { setIsLeafletLoaded(true); clearInterval(interval); }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Sincronizar projetos visíveis apenas para novos
  useEffect(() => {
    setVisibleProjectIds(prev => {
      const next = new Set(prev);
      let changed = false;
      projects.forEach(p => { if (!next.has(p.id)) { next.add(p.id); changed = true; } });
      return changed ? next : prev;
    });
  }, [projects]);

  // Inicialização — roda apenas uma vez
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const firstProj = projects.find(p => p.specs?.lat || p.specs?.coordE);
      let initLat = firstProj?.specs?.lat;
      let initLng = firstProj?.specs?.lng;
      if ((initLat == null || initLng == null) && firstProj?.specs?.coordE && firstProj?.specs?.coordN) {
        const { lat, lng } = utmToDecimal(
          parseUTMCoord(firstProj.specs.coordE),
          parseUTMCoord(firstProj.specs.coordN),
          parseInt(String(firstProj.specs.zone) || '22', 10)
        );
        initLat = lat; initLng = lng;
      }

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [initLat ?? -23.3106, initLng ?? -51.1628],
        zoom: 14,
        zoomControl: false,
        // Animações mais leves
        zoomAnimation: true,
        zoomAnimationThreshold: 4,
        fadeAnimation: false,       // desativa fade de tiles (causa engasgos)
        markerZoomAnimation: true,
        // Melhor performance de render
        preferCanvas: true,         // renderiza markers em canvas (muito mais rápido)
        renderer: L.canvas({ padding: 0.5 }),
        // Evita trava ao mover rápido
        wheelDebounceTime: 40,
        wheelPxPerZoomLevel: 80,
        // Limitar zoom máximo para não carregar tiles desnecessários
        maxZoom: 19,
        minZoom: 4,
      });

      // Tiles com crossOrigin para melhor cache do browser
      layersRef.current.streets = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; CARTO', crossOrigin: true, maxZoom: 19, updateWhenIdle: true }
      );
      layersRef.current.satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri', crossOrigin: true, maxZoom: 19, updateWhenIdle: true }
      );

      layersRef.current.streets.addTo(mapInstanceRef.current);
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

      // LayerGroup único — muito mais eficiente que adicionar layers diretamente ao mapa
      layerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

      setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 300);
    } catch (e) {
      console.error('Erro ao inicializar mapa:', e);
    }

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [isLeafletLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Atualização INTELIGENTE de Marcadores — só adiciona/remove o que mudou
  useEffect(() => {
    if (!isLeafletLoaded || !mapInstanceRef.current || !layerGroupRef.current) return;

    const visibleProjects = filteredProjectsByClient.filter(p => visibleProjectIds.has(p.id));
    const visibleIds = new Set(visibleProjects.map(p => p.id));

    // Remove markers/polygons de projetos que não estão mais visíveis
    Object.keys(markersRef.current).forEach(id => {
      if (!visibleIds.has(id)) {
        layerGroupRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
    Object.keys(polygonsRef.current).forEach(id => {
      if (!visibleIds.has(id)) {
        layerGroupRef.current.removeLayer(polygonsRef.current[id]);
        delete polygonsRef.current[id];
      }
    });

    // Adiciona apenas os que ainda não existem
    visibleProjects.forEach(project => {
      const markerColor = project.status === 'Concluído' ? '#00B08E'
        : project.status === 'Em Execução' ? '#3FA9F5' : '#002D62';

      // Polígono KML — cria apenas se não existe ainda
      if (!polygonsRef.current[project.id]) {
        const coords = getKmlCoords(project);
        if (coords.length > 2) {
          const polygon = L.polygon(coords, {
            color: markerColor, fillColor: markerColor,
            fillOpacity: 0.22, weight: 2, opacity: 0.85
          });
          layerGroupRef.current.addLayer(polygon);
          polygonsRef.current[project.id] = polygon;
        }
      }

      // Marcador — always recalculate from UTM if available (prevents stale bad lat/lng from DB)
      const shouldRecreateMarker = !markersRef.current[project.id] || !!project.specs?.coordE;
      if (markersRef.current[project.id] && project.specs?.coordE) {
        // Remove stale marker so it's rebuilt with correct coordinates
        layerGroupRef.current.removeLayer(markersRef.current[project.id]);
        delete markersRef.current[project.id];
      }
      if (shouldRecreateMarker && !markersRef.current[project.id]) {
        const hasCoords = project.specs?.lat && project.specs?.lng;
        const hasUTM = project.specs?.coordE && project.specs?.coordN;
        if (!hasCoords && !hasUTM) return;

        let markerLat = project.specs?.lat || 0;
        let markerLng = project.specs?.lng || 0;
        
        if (hasUTM) {
          const eVal = parseUTMCoord(project.specs.coordE!);
          const nVal = parseUTMCoord(project.specs.coordN!);
          if (!isNaN(eVal) && !isNaN(nVal) && eVal > 100000 && nVal > 100000) {
            const { lat, lng } = utmToDecimal(eVal, nVal, Number(project.specs.zone) || 22);
            // Only use if within a valid lat/lng range (Brazil: lat -35 to 5, lng -75 to -30)
            if (lat > -35 && lat < 10 && lng > -80 && lng < -25) {
              markerLat = lat;
              markerLng = lng;
            }
          }
        } else if (!hasCoords) return;

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background:${markerColor};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><i class="fas fa-building" style="transform:rotate(45deg);color:white;font-size:10px;"></i></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28]
        });

        // Final safety check - never plot outside Brazil bounding box
        if (markerLat < -35 || markerLat > 10 || markerLng < -80 || markerLng > -25) {
          console.warn(`[MapView] Project "${project.name}" has invalid final coordinates (${markerLat?.toFixed(2)}, ${markerLng?.toFixed(2)}), skipping marker.`);
          return;
        }

        const marker = L.marker([markerLat, markerLng], { icon: customIcon });

        const popupContent = `
          <div style="padding:10px;min-width:200px;font-family:'Plus Jakarta Sans',sans-serif;">
            <p style="margin:0;font-size:9px;font-weight:800;color:#3FA9F5;text-transform:uppercase;letter-spacing:.1em;">${project.clientName}</p>
            <h4 style="margin:4px 0;font-size:16px;font-weight:900;color:#000;line-height:1.1;">${project.name}</h4>
            <p style="margin:0 0 10px;font-size:10px;color:#555;font-weight:500;">${project.location || ''}</p>
            <button id="btn-map-${project.id}" style="width:100%;padding:10px;background:#f1f5f9;color:#000;border:1px solid #cbd5e1;border-radius:8px;font-size:10px;font-weight:800;text-transform:uppercase;cursor:pointer;">Abrir Dossiê</button>
          </div>`;

        marker.bindPopup(popupContent, { maxWidth: 240, autoPanPadding: [20, 20] });
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-map-${project.id}`);
          if (btn) btn.onclick = () => onSelectProject(project.id);
        });

        layerGroupRef.current.addLayer(marker);
        markersRef.current[project.id] = marker;
      }
    });
  }, [visibleProjectIds, filteredProjectsByClient, isLeafletLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleProjectVisibility = useCallback((id: string) => {
    setVisibleProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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

      <div className="relative flex-1 min-h-[500px] md:min-h-0 bg-baccarim-card md:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-baccarim-active"></div>

        {/* Controles Flutuantes */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-16 md:top-4 left-4 z-[10] w-12 h-12 bg-baccarim-card rounded-xl shadow-xl flex items-center justify-center text-baccarim-navy hover:scale-110 transition-all border border-slate-100"
        >
          <i className={`fas ${showControls ? 'fa-times' : 'fa-layer-group'}`}></i>
        </button>

        {/* Filtro de Clientes */}
        <div className="absolute top-4 left-20 z-[10] hidden md:flex items-center space-x-2 bg-baccarim-card/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-slate-100">
          <i className="fas fa-filter text-[10px] text-baccarim-blue"></i>
          <select
            value={selectedClient || ''}
            onChange={(e) => setSelectedClient(e.target.value || null)}
            className="bg-transparent text-[10px] font-black uppercase text-baccarim-navy outline-none cursor-pointer"
          >
            <option value="">Todos os Clientes</option>
            {clients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>

        {showControls && (
          <div className="absolute top-16 md:top-16 left-20 z-[10] w-64 max-h-[80%] bg-baccarim-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 overflow-y-auto p-4 custom-scrollbar">
            <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest mb-3 px-2">Lista de Projetos</p>
            <div className="space-y-1">
              {filteredProjectsByClient.map(p => (
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
        .leaflet-tile { will-change: transform; }
        .leaflet-zoom-animated { will-change: transform; }
      `}</style>
    </div>
  );
};

export default MapView;

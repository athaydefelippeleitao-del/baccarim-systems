
import React, { useEffect, useState } from 'react';
import { analyzeLicensePortfolio } from '../services/openaiClient';
import { EnvironmentalLicense, Notification } from '../types';

interface SmartAnalysisProps {
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
}

const SmartAnalysis: React.FC<SmartAnalysisProps> = ({ licenses, notifications }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      async function getAnalysis() {
        setLoading(true);
        try {
          const text = await analyzeLicensePortfolio(licenses, notifications);
          setAnalysis(text || 'Nenhuma análise disponível.');
        } catch (error: any) {
          setAnalysis(`Erro ao processar análise estratégica:\n\nDetalhes do erro: ${error?.message || error || 'Erro desconhecido'}`);
        } finally {
          setLoading(false);
        }
      }
      getAnalysis();
    }, 1500); // Debounce de 1.5s para evitar chamadas excessivas durante sincronização

    return () => clearTimeout(timer);
  }, [licenses, notifications]);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-10 text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden h-full border border-white transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)]">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-baccarim-blue/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-baccarim-blue/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center tracking-tighter text-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-baccarim-blue shadow-inner border border-slate-100 mr-4">
              <i className="fas fa-microchip animate-pulse text-lg"></i>
            </div>
            Análise Estratégica AI
          </h2>
          <span className="px-3 py-1 bg-baccarim-hover rounded-full text-[9px] font-black uppercase tracking-widest border border-baccarim-border text-baccarim-blue">Cloud Processing</span>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-baccarim-border border-t-baccarim-blue"></div>
            <span className="text-baccarim-blue text-[10px] font-black uppercase tracking-widest animate-pulse">Sincronizando Inteligência...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar max-h-[350px]">
            <div className="whitespace-pre-wrap text-baccarim-text text-sm leading-relaxed font-medium">
              {analysis}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-baccarim-border flex items-center justify-between text-[9px] text-baccarim-text/30 uppercase font-black tracking-widest">
          <span>Baccarim Systems Cloud</span>
          <span className="flex items-center"><i className="fas fa-shield-halved mr-2 text-baccarim-green"></i> Dados Protegidos</span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-active); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SmartAnalysis;


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
    <div className="bg-baccarim-card rounded-[3rem] p-10 text-baccarim-text shadow-2xl relative overflow-hidden h-full border border-baccarim-border">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-baccarim-blue/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-baccarim-green/10 rounded-full blur-[100px]"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center tracking-tighter">
            <i className="fas fa-microchip mr-4 text-baccarim-blue animate-pulse"></i>
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

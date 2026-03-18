
import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 45); // Roughly 5 seconds total (100 * 45ms = 4500ms + some buffer)
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col items-center justify-center overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-baccarim-blue/20 rounded-full blur-[180px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-baccarim-green/20 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>
      
      <div className="relative flex flex-col items-center w-full max-w-md px-10">
        {/* Cinematic Logo Entrance */}
        <div className="flex flex-col items-center mb-20">
          <div className="relative w-32 h-32 mb-10 group">
             {/* Glowing Aura */}
             <div className="absolute inset-0 bg-baccarim-blue/20 blur-3xl rounded-full animate-pulse"></div>
             
             {/* Custom Logo Image */}
             <img src="/logo_baccarim.jpg" alt="Baccarim Logo" className="absolute inset-0 w-full h-full object-contain animate-in zoom-in duration-1000 rounded-2xl" />
          </div>
          
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
            <h1 className="text-7xl font-black text-baccarim-text tracking-tighter leading-none">
              Baccarim
            </h1>
            <div className="flex items-center justify-center space-x-4">
               <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-baccarim-text/20"></div>
               <span className="text-[12px] text-baccarim-blue uppercase font-black tracking-[0.8em] whitespace-nowrap">Systems Cloud</span>
               <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-baccarim-text/20"></div>
            </div>
          </div>
        </div>

        {/* Premium Progress Section */}
        <div className="w-full space-y-6">
          <div className="flex justify-between items-end mb-2">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-[0.3em]">Carregando Infraestrutura</p>
              <p className="text-[10px] font-bold text-baccarim-blue uppercase tracking-widest">
                {progress < 30 ? 'Iniciando Protocolos...' : 
                 progress < 60 ? 'Sincronizando Banco de Dados...' : 
                 progress < 90 ? 'Otimizando Interface...' : 'Pronto para Iniciar'}
              </p>
            </div>
            <span className="text-2xl font-black text-baccarim-text/20 tabular-nums">{progress}%</span>
          </div>
          
          <div className="h-[4px] w-full bg-baccarim-hover rounded-full overflow-hidden relative backdrop-blur-md border border-baccarim-border">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-baccarim-green via-baccarim-blue to-white shadow-[0_0_15px_rgba(63,169,245,0.5)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
            {/* Gloss Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>
        </div>
        
        <div className="mt-16 flex items-center space-x-3 opacity-60">
          <div className="w-1.5 h-1.5 bg-baccarim-green rounded-full animate-pulse"></div>
          <p className="text-[8px] font-black text-baccarim-text uppercase tracking-[0.5em]">Conexão Segura Baccarim Cloud</p>
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(var(--tw-rotate)); }
          50% { transform: translateY(-15px) rotate(var(--tw-rotate)); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        h1 {
          text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;


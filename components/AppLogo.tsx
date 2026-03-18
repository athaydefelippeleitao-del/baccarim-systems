import React from 'react';

export const AppLogo: React.FC<{ className?: string, customIcon?: string }> = ({ className = "w-10 h-10", customIcon }) => (
  <div className={`relative ${className} group`}>
     {/* Glowing Aura */}
     <div className="absolute inset-0 bg-gradient-to-tr from-baccarim-green/20 to-baccarim-blue/20 blur-xl rounded-full animate-pulse"></div>
     
     {customIcon ? (
       <div className="absolute inset-0 rounded-[30%] overflow-hidden border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
         <img src={customIcon} alt="App Logo" className="w-full h-full object-cover" />
       </div>
     ) : (
       <div className="absolute inset-0">
         <img src="/logo_baccarim.jpg" alt="App Logo" className="w-full h-full object-contain animate-float-slow" />
       </div>
     )}
  </div>
);

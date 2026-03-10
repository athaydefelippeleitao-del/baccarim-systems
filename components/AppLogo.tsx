import React from 'react';

export const AppLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`relative ${className} group`}>
     {/* Glowing Aura */}
     <div className="absolute inset-0 bg-gradient-to-tr from-baccarim-green/20 to-baccarim-blue/20 blur-xl rounded-full animate-pulse"></div>
     
     {/* Geometric Blocks */}
     <div className="absolute inset-0 grid grid-cols-2 gap-[15%]">
        <div className="bg-baccarim-green rounded-[30%] transform -skew-y-12 shadow-[0_0_15px_rgba(0,176,142,0.4)] animate-float-slow"></div>
        <div className="space-y-[15%]">
           <div className="h-1/2 bg-baccarim-navy rounded-[30%] transform skew-y-12 shadow-[0_0_15px_rgba(0,45,98,0.2)] animate-float-slow" style={{ animationDelay: '0.5s' }}></div>
           <div className="h-1/2 bg-baccarim-blue rounded-[30%] transform skew-y-12 shadow-[0_0_15px_rgba(63,169,245,0.4)] animate-float-slow" style={{ animationDelay: '1s' }}></div>
        </div>
     </div>
  </div>
);

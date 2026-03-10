
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-baccarim-card rounded-[2rem] shadow-xl border border-baccarim-border p-4 md:p-8 flex items-center transition-all hover:border-baccarim-border-hover group relative overflow-hidden">
      {/* Background Glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${color}`}></div>
      
      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${color}/10 text-baccarim-text mr-4 md:mr-6 text-xl md:text-2xl shadow-xl transition-transform group-hover:scale-110 relative z-10 border border-baccarim-border`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="min-w-0 relative z-10">
        <p className="text-[10px] md:text-xs font-black text-baccarim-text-muted uppercase tracking-[0.2em] truncate mb-1">{title}</p>
        <p className="text-xl md:text-3xl font-black text-baccarim-text tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;

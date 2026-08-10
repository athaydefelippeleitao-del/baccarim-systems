
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white p-5 md:p-6 flex items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] group relative overflow-hidden">
      {/* Decorative Blob */}
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-[40px] opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${color}`}></div>
      
      <div className={`w-14 h-14 flex-shrink-0 rounded-[1.2rem] flex items-center justify-center bg-white shadow-lg shadow-slate-200/50 mr-5 transition-transform duration-300 group-hover:scale-110 relative z-10 border border-slate-50`}>
        <i className={`fas ${icon} text-xl ${color.replace('bg-', 'text-')}`}></i>
      </div>
      
      <div className="min-w-0 relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-black text-slate-800 tabular-nums tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;

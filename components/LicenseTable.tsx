
import React from 'react';
import { EnvironmentalLicense, LicenseStatus } from '../types';

interface LicenseTableProps {
  licenses: EnvironmentalLicense[];
  onSelect: (license: EnvironmentalLicense) => void;
}

const LicenseTable: React.FC<LicenseTableProps> = ({ licenses, onSelect }) => {
  const getStatusBadgeClass = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.ACTIVE: return 'bg-baccarim-green/10 text-baccarim-green border-emerald-500/20';
      case LicenseStatus.EXPIRING: return 'bg-baccarim-amber/10 text-baccarim-amber border-amber-500/20';
      case LicenseStatus.EXPIRED: return 'bg-baccarim-rose/10 text-baccarim-rose border-rose-500/20';
      case LicenseStatus.PENDING: return 'bg-baccarim-blue/10 text-baccarim-blue border-baccarim-blue/20';
      default: return 'bg-baccarim-hover text-baccarim-text-muted border-baccarim-border-hover';
    }
  };

  const generateCalendarLink = (license: EnvironmentalLicense) => {
    const parts = license.expiryDate.split('/');
    if (parts.length !== 3) return "#";
    const formattedDate = `${parts[2]}${parts[1]}${parts[0]}`;
    
    const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
    const details = `Licença: ${license.type}\nProcesso: ${license.processNumber}\nParceiro: ${license.clientName}\nÓrgão: ${license.agency}`;
    
    const params = new URLSearchParams({
      text: `[VENCIMENTO] ${license.name}`,
      dates: `${formattedDate}/${formattedDate}`,
      details: details
    });
    
    return `${baseUrl}&${params.toString()}`;
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full divide-y divide-white/5">
        <thead className="bg-baccarim-hover">
          <tr>
            <th className="px-4 md:px-6 py-3 text-left text-[9px] md:text-xs font-black text-baccarim-text-muted uppercase tracking-widest">Protocolo / Licença</th>
            <th className="px-4 md:px-6 py-3 text-left text-[9px] md:text-xs font-black text-baccarim-text-muted uppercase tracking-widest hidden sm:table-cell">Parceiro</th>
            <th className="px-4 md:px-6 py-3 text-left text-[9px] md:text-xs font-black text-baccarim-text-muted uppercase tracking-widest">Vencimento</th>
            <th className="px-4 md:px-6 py-3 text-left text-[9px] md:text-xs font-black text-baccarim-text-muted uppercase tracking-widest">Status</th>
            <th className="px-4 md:px-6 py-3 text-right text-[9px] md:text-xs font-black text-baccarim-text-muted uppercase tracking-widest">Sinc.</th>
          </tr>
        </thead>
        <tbody className="bg-baccarim-card divide-y divide-white/5">
          {licenses.map((license) => (
            <tr key={license.id} className="hover:bg-baccarim-hover transition-colors cursor-pointer" onClick={() => onSelect(license)}>
              <td className="px-4 md:px-6 py-4">
                <div className="text-[11px] md:text-sm font-black text-baccarim-text leading-tight">{license.name}</div>
                <div className="text-[8px] md:text-[10px] text-baccarim-blue font-bold truncate max-w-[120px] md:max-w-[200px] mt-0.5">{license.processNumber}</div>
              </td>
              <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                <span className="text-xs font-bold text-baccarim-text-muted">{license.clientName}</span>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className={`text-[11px] md:text-sm font-black ${license.status === LicenseStatus.EXPIRED ? 'text-baccarim-rose' : 'text-slate-300'}`}>
                  {license.expiryDate}
                </div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <span className={`px-2 py-0.5 inline-flex text-[8px] md:text-[9px] font-black rounded-full border leading-tight ${getStatusBadgeClass(license.status)}`}>
                  {license.status}
                </span>
              </td>
              <td className="px-4 md:px-6 py-4 text-right">
                {license.expiryDate !== 'Pendente' && license.expiryDate !== 'N/A' && (
                  <a 
                    href={generateCalendarLink(license)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-baccarim-text-muted hover:text-baccarim-blue transition-all p-2"
                  >
                    <i className="fa-brands fa-google text-xs"></i>
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LicenseTable;

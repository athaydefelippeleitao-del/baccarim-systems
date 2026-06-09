import React, { useState } from 'react';
import { Contract, Installment } from '../types';

interface FinanceViewProps {
  clients: string[];
  contracts: Contract[];
  onUpdateContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ clients, contracts, onUpdateContract, onDeleteContract }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  const handlePdfUpload = (contractId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return;
      const attachment = { id: `pdf-${Date.now()}`, name: file.name, url: base64, type: 'pdf' };
      const otherFiles = (contract.attachedFiles || []).filter((f: any) => f.type !== 'pdf');
      onUpdateContract({ ...contract, attachedFiles: [...otherFiles, attachment] as any });
    };
    reader.readAsDataURL(file);
  };

  const getPdf = (contract: Contract) =>
    (contract.attachedFiles || []).find((f: any) => f.type === 'pdf');

  const [newProposalForm, setNewProposalForm] = useState({
    title: '', // Nº Proposta
    clientName: clients[0] || '', // Empresa
    startDate: new Date().toISOString().split('T')[0] // Data Enviada
  });

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();

    const newContractId = `prop-${Date.now()}`;
    const newContract: Contract = {
      id: newContractId,
      title: newProposalForm.title,
      clientName: newProposalForm.clientName,
      totalValue: 0, 
      startDate: newProposalForm.startDate,
      endDate: newProposalForm.startDate, 
      status: 'Pending', 
      billingType: 'Fixed',
      installments: [
        { id: `step-1-${Date.now()}`, title: 'no aceite da proposta', value: 0, dueDate: newProposalForm.startDate, status: 'Pending' },
        { id: `step-2-${Date.now()}`, title: '30 dias do aceite', value: 0, dueDate: newProposalForm.startDate, status: 'Pending' },
        { id: `step-3-${Date.now()}`, title: 'no protocolo da LP', value: 0, dueDate: newProposalForm.startDate, status: 'Pending' },
        { id: `step-4-${Date.now()}`, title: 'no protocolo da LI', value: 0, dueDate: newProposalForm.startDate, status: 'Pending' },
      ],
      attachedFiles: []
    };

    onUpdateContract(newContract);
    setShowAddModal(false);
    setNewProposalForm({
      title: '',
      clientName: clients[0] || '',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const toggleAcceptance = (contract: Contract) => {
    let nextStatus: Contract['status'] = 'Pending';
    if (contract.status === 'Pending') nextStatus = 'Active';
    else if (contract.status === 'Active' || contract.status === 'Completed') nextStatus = 'Expired';
    else if (contract.status === 'Expired') nextStatus = 'Pending';

    onUpdateContract({ ...contract, status: nextStatus });
  };

  const getAcceptanceLabel = (status: Contract['status']) => {
    if (status === 'Active' || status === 'Completed') return <span className="text-emerald-600 font-bold">SIM</span>;
    if (status === 'Expired') return <span className="text-rose-600 font-bold">NÃO</span>;
    return <span className="text-gray-400 font-medium">-</span>;
  };

  const toggleStepStatus = (contractId: string, stepId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    const updatedInstallments = contract.installments.map(inst => {
      if (inst.id === stepId) {
        // Treat 'Paid' as Concluído
        return { ...inst, status: inst.status === 'Pending' ? 'Paid' : 'Pending' }; 
      }
      return inst;
    }) as Installment[];
    onUpdateContract({ ...contract, installments: updatedInstallments });
  };
  
  const updateStepTitle = (contractId: string, stepId: string, title: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    const updatedInstallments = contract.installments.map(inst => {
      if (inst.id === stepId) return { ...inst, title };
      return inst;
    });
    onUpdateContract({ ...contract, installments: updatedInstallments });
  };

  const addStep = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    const newStep: Installment = {
      id: `step-${Date.now()}`,
      title: 'Nova etapa',
      value: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    onUpdateContract({ ...contract, installments: [...contract.installments, newStep] });
  };

  const removeStep = (contractId: string, stepId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    const updatedInstallments = contract.installments.filter(inst => inst.id !== stepId);
    onUpdateContract({ ...contract, installments: updatedInstallments });
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-baccarim-blue text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
            <i className="fas fa-file-contract"></i>
            <span>Comercial</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-baccarim-text tracking-tight">Planilha de Propostas</h2>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-6 py-3 bg-baccarim-blue text-baccarim-text rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-baccarim-green transition-all shadow-lg"
        >
          <i className="fas fa-plus mr-2"></i> Nova Proposta
        </button>
      </div>

      <div className="bg-baccarim-card rounded-3xl md:rounded-[3.5rem] shadow-xl border border-baccarim-border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1300px] border-collapse">
            <thead className="bg-baccarim-hover text-[9px] md:text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">
              <tr>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border">Nº PROPOSTA</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border">EMPRESA</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border text-center">DATA ENVIADA</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border text-center">ACEITE</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border">ETAPAS</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border text-center">PDF</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-baccarim-border bg-baccarim-card text-baccarim-text text-sm">
              {contracts.map(contract => {
                return (
                  <tr key={contract.id} className="hover:bg-baccarim-hover transition-colors align-top">
                    <td className="px-6 md:px-10 py-6">
                      <input 
                        value={contract.title}
                        onChange={(e) => onUpdateContract({ ...contract, title: e.target.value })}
                        className="bg-transparent border-b border-transparent focus:border-baccarim-blue hover:border-gray-300 transition-colors font-black text-baccarim-text outline-none w-full min-w-[200px] px-2 py-1"
                        placeholder="Nº da Proposta"
                      />
                    </td>
                    <td className="px-6 md:px-10 py-6">
                      <select
                        value={contract.clientName}
                        onChange={(e) => onUpdateContract({ ...contract, clientName: e.target.value })}
                        className="bg-transparent border-b border-transparent focus:border-baccarim-blue hover:border-gray-300 transition-colors text-xs md:text-sm font-bold outline-none w-full min-w-[220px] px-1 py-1"
                      >
                        {clients.map(c => <option key={c} value={c} className="bg-baccarim-card text-baccarim-text">{c}</option>)}
                      </select>
                    </td>
                    <td className="px-6 md:px-10 py-6 text-center">
                      <input 
                        type="date"
                        value={contract.startDate}
                        onChange={(e) => onUpdateContract({ ...contract, startDate: e.target.value, endDate: e.target.value })}
                        className="bg-transparent border-b border-transparent focus:border-baccarim-blue hover:border-gray-300 transition-colors text-xs md:text-sm text-baccarim-text-muted font-bold outline-none cursor-pointer px-2 py-1"
                      />
                    </td>
                    <td 
                      className="px-6 md:px-10 py-6 text-center cursor-pointer hover:bg-baccarim-active transition-colors select-none" 
                      onClick={() => toggleAcceptance(contract)} 
                      title="Clique para alterar (SIM/NÃO)"
                    >
                      <div className="flex items-center justify-center pt-1">
                         {getAcceptanceLabel(contract.status)}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-4 min-w-[300px]">
                      <div className="flex flex-col gap-2">
                        {contract.installments.map((step, index) => {
                          const isCompleted = step.status === 'Paid';
                          return (
                            <div key={step.id} className="flex items-center gap-2 group">
                              <button 
                                onClick={() => toggleStepStatus(contract.id, step.id)}
                                className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400 text-transparent hover:border-emerald-500'}`}
                              >
                                <i className="fas fa-check text-[6px]"></i>
                              </button>
                              
                              <input 
                                value={step.title}
                                onChange={(e) => updateStepTitle(contract.id, step.id, e.target.value)}
                                className={`flex-1 bg-transparent border-b border-transparent group-hover:border-baccarim-border focus:border-baccarim-blue outline-none text-[11px] md:text-xs font-bold px-1 transition-colors ${isCompleted ? 'text-emerald-700 line-through opacity-70' : 'text-baccarim-text'}`}
                                placeholder="Nome da etapa"
                              />

                              <button 
                                onClick={() => removeStep(contract.id, step.id)}
                                className="w-5 h-5 rounded hover:bg-red-100 text-transparent group-hover:text-red-400 hover:!text-red-600 transition-all flex items-center justify-center shrink-0"
                                title="Excluir"
                              >
                                <i className="fas fa-times text-[10px]"></i>
                              </button>
                            </div>
                          );
                        })}
                        <button 
                          onClick={() => addStep(contract.id)}
                          className="w-fit text-[9px] font-black uppercase tracking-widest text-baccarim-blue hover:text-baccarim-green transition-colors mt-1 flex items-center"
                        >
                          <i className="fas fa-plus mr-1"></i> Adicionar
                        </button>
                      </div>
                    </td>
                    {/* PDF Column */}
                    <td className="px-6 md:px-10 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getPdf(contract) ? (
                          <>
                            <button
                              onClick={() => setPdfViewUrl((getPdf(contract) as any)!.url)}
                              className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                              title="Visualizar PDF"
                            >
                              <i className="fas fa-file-pdf text-sm"></i>
                            </button>
                            <a
                              href={(getPdf(contract) as any)!.url}
                              download={(getPdf(contract) as any)!.name}
                              className="w-9 h-9 rounded-xl bg-blue-50 text-baccarim-blue hover:bg-baccarim-blue hover:text-white flex items-center justify-center transition-all shadow-sm"
                              title="Baixar PDF"
                            >
                              <i className="fas fa-download text-sm"></i>
                            </a>
                            <label
                              htmlFor={`pdf-replace-${contract.id}`}
                              className="w-9 h-9 rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                              title="Substituir PDF"
                            >
                              <i className="fas fa-arrow-up-from-bracket text-sm"></i>
                              <input
                                id={`pdf-replace-${contract.id}`}
                                type="file" accept="application/pdf" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(contract.id, f); e.target.value = ''; }}
                              />
                            </label>
                          </>
                        ) : (
                          <label
                            htmlFor={`pdf-upload-${contract.id}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-baccarim-blue hover:text-baccarim-blue transition-all cursor-pointer text-[9px] font-black uppercase tracking-widest"
                            title="Anexar PDF"
                          >
                            <i className="fas fa-paperclip text-sm"></i>
                            <span>Anexar</span>
                            <input
                              id={`pdf-upload-${contract.id}`}
                              type="file" accept="application/pdf" className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(contract.id, f); e.target.value = ''; }}
                            />
                          </label>
                        )}
                      </div>
                    </td>

                    {/* Delete Column */}
                    <td className="px-6 md:px-10 py-6">
                      <div className="flex items-center justify-center pt-1">
                        <button 
                          onClick={() => setContractToDelete(contract.id)}
                          className="w-10 h-10 rounded-xl bg-[#FFF1F1] text-[#FF5A5A] hover:bg-[#FF5A5A] hover:text-baccarim-text flex items-center justify-center transition-all shadow-sm"
                          title="Excluir Proposta"
                        >
                          <i className="fas fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-baccarim-text-muted font-bold">
                    Nenhuma proposta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualização de PDF */}
      {pdfViewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl flex flex-col" style={{ height: '90vh' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-black text-sm uppercase tracking-widest"><i className="fas fa-file-pdf mr-2 text-red-400"></i>Visualizador de Proposta</p>
              <button
                onClick={() => setPdfViewUrl(null)}
                className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <iframe
              src={pdfViewUrl}
              className="flex-1 w-full rounded-2xl border-2 border-white/10"
              title="Proposta PDF"
            />
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {contractToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border-t-8 border-t-baccarim-rose">
            <div className="w-20 h-20 bg-baccarim-rose/10 text-baccarim-rose rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner">
              <i className="fas fa-trash-can animate-bounce-slow"></i>
            </div>
            <h3 className="text-2xl font-black text-baccarim-text mb-3 tracking-tight">Excluir Proposta?</h3>
            <p className="text-[11px] text-baccarim-text-muted font-medium mb-10 leading-relaxed uppercase tracking-widest">
              Esta ação removerá permanentemente o registro desta proposta. <br/><strong>Não pode ser desfeita.</strong>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setContractToDelete(null)} 
                className="py-5 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-baccarim-active transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={() => { onDeleteContract(contractToDelete); setContractToDelete(null); }} 
                className="py-5 bg-red-500/10 border border-red-500/20 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-red-500/20 transition-all hover:-translate-y-1"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Proposta */}
      {showAddModal && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 relative animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <h3 className="text-2xl font-black text-baccarim-text mb-8">Nova Proposta</h3>
            
            <form onSubmit={handleCreateProposal} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nº da Proposta</label>
                <input required value={newProposalForm.title} onChange={e => setNewProposalForm({...newProposalForm, title: e.target.value})} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text" placeholder="Ex: 010 - 2021" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Empresa</label>
                <select 
                  required 
                  value={newProposalForm.clientName} 
                  onChange={e => setNewProposalForm({...newProposalForm, clientName: e.target.value})} 
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none font-bold text-baccarim-text"
                >
                  {clients.map(c => <option key={c} value={c} className="bg-baccarim-card">{c}</option>)}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Data Enviada</label>
                <input type="date" required value={newProposalForm.startDate} onChange={e => setNewProposalForm({...newProposalForm, startDate: e.target.value})} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none font-bold text-baccarim-text" />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-baccarim-navy/10 border border-baccarim-border text-baccarim-text py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-navy/20 transition-all">Salvar Proposta</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 bg-baccarim-active text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-hover transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;

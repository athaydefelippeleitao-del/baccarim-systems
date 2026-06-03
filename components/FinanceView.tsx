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
  const [selectedContractStepsId, setSelectedContractStepsId] = useState<string | null>(null);

  const [newProposalForm, setNewProposalForm] = useState({
    title: '', // Nº Proposta
    clientName: clients[0] || '', // Empresa
    startDate: new Date().toISOString().split('T')[0] // Data Enviada
  });

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();

    const newContract: Contract = {
      id: `prop-${Date.now()}`,
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

  const selectedContractForSteps = contracts.find(c => c.id === selectedContractStepsId);

  const toggleStepStatus = (contractId: string, stepId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    const updatedInstallments = contract.installments.map(inst => {
      if (inst.id === stepId) {
        // Treat 'Paid' as Concluído
        return { ...inst, status: inst.status === 'Pending' ? 'Paid' : 'Pending' }; 
      }
      return inst;
    });
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
          <table className="w-full text-left min-w-[800px] border-collapse">
            <thead className="bg-baccarim-hover text-[9px] md:text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">
              <tr>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border">Nº PROPOSTA</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border">EMPRESA</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border text-center">DATA ENVIADA</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border text-center">ACEITE</th>
                <th className="px-6 md:px-10 py-4 md:py-5 border-b border-baccarim-border text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-baccarim-border bg-baccarim-card text-baccarim-text text-sm">
              {contracts.map(contract => (
                <tr key={contract.id} className="hover:bg-baccarim-hover transition-colors">
                  <td className="px-6 md:px-10 py-4">
                    <input 
                      value={contract.title}
                      onChange={(e) => onUpdateContract({ ...contract, title: e.target.value })}
                      className="bg-transparent border-b border-transparent focus:border-baccarim-blue hover:border-gray-300 transition-colors font-black text-baccarim-text outline-none w-full max-w-[200px] px-2 py-1"
                      placeholder="Nº da Proposta"
                    />
                  </td>
                  <td className="px-6 md:px-10 py-4">
                    <select
                      value={contract.clientName}
                      onChange={(e) => onUpdateContract({ ...contract, clientName: e.target.value })}
                      className="bg-transparent border-b border-transparent focus:border-baccarim-blue hover:border-gray-300 transition-colors text-xs md:text-sm font-bold outline-none w-full max-w-[250px] px-1 py-1"
                    >
                      {clients.map(c => <option key={c} value={c} className="bg-baccarim-card text-baccarim-text">{c}</option>)}
                    </select>
                  </td>
                  <td className="px-6 md:px-10 py-4 text-center">
                    <input 
                      type="date"
                      value={contract.startDate}
                      onChange={(e) => onUpdateContract({ ...contract, startDate: e.target.value, endDate: e.target.value })}
                      className="bg-transparent border-b border-transparent focus:border-baccarim-blue hover:border-gray-300 transition-colors text-xs md:text-sm text-baccarim-text-muted font-bold outline-none cursor-pointer px-2 py-1"
                    />
                  </td>
                  <td 
                    className="px-6 md:px-10 py-4 text-center cursor-pointer hover:bg-baccarim-active transition-colors select-none" 
                    onClick={() => toggleAcceptance(contract)} 
                    title="Clique para alterar (SIM/NÃO)"
                  >
                    <div className="flex items-center justify-center">
                       {getAcceptanceLabel(contract.status)}
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => setSelectedContractStepsId(contract.id)}
                        className="w-10 h-10 rounded-xl bg-baccarim-blue/10 text-baccarim-blue hover:bg-baccarim-blue hover:text-baccarim-text flex items-center justify-center transition-all shadow-sm"
                        title="Ver Etapas"
                      >
                        <i className="fas fa-list-check text-sm"></i>
                      </button>
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
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-baccarim-text-muted font-bold">
                    Nenhuma proposta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Etapas */}
      {selectedContractForSteps && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-2xl shadow-2xl p-8 md:p-12 text-left relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <button onClick={() => setSelectedContractStepsId(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-baccarim-hover flex items-center justify-center text-baccarim-text-muted hover:text-red-500 transition-all">
              <i className="fas fa-times"></i>
            </button>
            
            <div className="mb-8">
              <div className="flex items-center space-x-3 text-baccarim-blue text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                <i className="fas fa-list-check"></i>
                <span>Etapas da Proposta</span>
              </div>
              <h3 className="text-2xl font-black text-baccarim-text truncate pr-12">{selectedContractForSteps.title}</h3>
              <p className="text-baccarim-text-muted font-bold text-sm mt-1">{selectedContractForSteps.clientName}</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mb-8">
              {selectedContractForSteps.installments.map((step, index) => {
                const isCompleted = step.status === 'Paid';
                return (
                  <div key={step.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${isCompleted ? 'bg-baccarim-green/10 border-emerald-500/30' : 'bg-baccarim-hover border-baccarim-border'}`}>
                    <button 
                      onClick={() => toggleStepStatus(selectedContractForSteps.id, step.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-emerald-500'}`}
                    >
                      <i className="fas fa-check text-[10px]"></i>
                    </button>
                    
                    <input 
                      value={step.title}
                      onChange={(e) => updateStepTitle(selectedContractForSteps.id, step.id, e.target.value)}
                      className={`flex-1 bg-transparent border-none outline-none font-bold text-sm md:text-base ${isCompleted ? 'text-emerald-700 line-through opacity-70' : 'text-baccarim-text'}`}
                      placeholder="Nome da etapa"
                    />

                    <button 
                      onClick={() => removeStep(selectedContractForSteps.id, step.id)}
                      className="w-8 h-8 rounded-xl bg-transparent text-baccarim-text-muted hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shrink-0"
                    >
                      <i className="fas fa-trash text-[10px]"></i>
                    </button>
                  </div>
                );
              })}
              
              <button 
                onClick={() => addStep(selectedContractForSteps.id)}
                className="w-full py-4 border-2 border-dashed border-baccarim-border rounded-2xl text-baccarim-text-muted font-bold text-[10px] uppercase tracking-widest hover:border-baccarim-blue hover:text-baccarim-blue transition-colors flex items-center justify-center"
              >
                <i className="fas fa-plus mr-2"></i> Adicionar Nova Etapa
              </button>
            </div>

            <button 
              onClick={() => setSelectedContractStepsId(null)} 
              className="w-full py-5 bg-baccarim-blue/10 text-baccarim-text border border-baccarim-border rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-baccarim-blue/20 transition-colors"
            >
              Concluir Edição
            </button>
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


import React, { useMemo, useState, useRef } from 'react';
import { Contract, Installment, Attachment } from '../types';
import { downloadFile } from '../utils/fileUtils';

interface FinanceViewProps {
  clients: string[];
  contracts: Contract[];
  onUpdateContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ clients, contracts, onUpdateContract, onDeleteContract }) => {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{ contractId: string, installmentId: string, fileName: string } | null>(null);
  const [activeInstallmentUpload, setActiveInstallmentUpload] = useState<{ contractId: string, installmentId: string } | null>(null);
  const [activeContractUploadId, setActiveContractUploadId] = useState<string | null>(null);
  const [dateChangePending, setDateChangePending] = useState<{ contractId: string, installmentId: string, newDate: string, oldDate: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newContractForm, setNewContractForm] = useState({
    title: '',
    clientName: clients[0] || '',
    totalValue: '',
    installments: [
      { title: 'Parcela 1', dueDate: new Date().toISOString().split('T')[0] }
    ]
  });

  const selectedContract = useMemo(() => 
    contracts.find(c => c.id === selectedContractId) || null
  , [contracts, selectedContractId]);

  const totalGlobalValue = useMemo(() => 
    contracts.filter(c => c.status === 'Active' || c.status === 'Completed')
             .reduce((acc, curr) => acc + curr.totalValue, 0), 
  [contracts]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleAddInstallmentRow = () => {
    const nextNum = newContractForm.installments.length + 1;
    setNewContractForm({
      ...newContractForm,
      installments: [
        ...newContractForm.installments,
        { title: `Parcela ${nextNum}`, dueDate: new Date().toISOString().split('T')[0] }
      ]
    });
  };

  const handleRemoveInstallmentRow = (index: number) => {
    if (newContractForm.installments.length <= 1) return;
    const updated = [...newContractForm.installments];
    updated.splice(index, 1);
    setNewContractForm({ ...newContractForm, installments: updated });
  };

  const handleUpdateInstallmentRow = (index: number, field: 'title' | 'dueDate', value: string) => {
    const updated = [...newContractForm.installments];
    updated[index] = { ...updated[index], [field]: value };
    setNewContractForm({ ...newContractForm, installments: updated });
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const totalVal = parseFloat(newContractForm.totalValue);
    if (isNaN(totalVal) || totalVal <= 0) return;

    const numInst = newContractForm.installments.length;
    const valuePerInst = totalVal / numInst;

    const installments: Installment[] = newContractForm.installments.map((inst, i) => ({
      id: `inst-${Date.now()}-${i}`,
      title: inst.title,
      value: valuePerInst,
      dueDate: inst.dueDate,
      status: 'Pending',
      attachedFiles: []
    }));

    const newContract: Contract = {
      id: `ct-${Date.now()}`,
      title: newContractForm.title,
      clientName: newContractForm.clientName,
      totalValue: totalVal,
      startDate: installments[0].dueDate,
      endDate: installments[numInst - 1].dueDate,
      status: 'Pending',
      billingType: 'Fixed',
      installments,
      attachedFiles: []
    };

    onUpdateContract(newContract);
    setShowAddContractModal(false);
    setNewContractForm({
      title: '',
      clientName: clients[0] || '',
      totalValue: '',
      installments: [{ title: 'Parcela 1', dueDate: new Date().toISOString().split('T')[0] }]
    });
  };

  const handleConfirmDeleteContract = () => {
    if (!contractToDelete) return;
    onDeleteContract(contractToDelete);
    setContractToDelete(null);
  };

  const handleConfirmDeleteAttachment = () => {
    if (!attachmentToDelete || !selectedContract) return;
    const { installmentId, fileName } = attachmentToDelete;

    if (installmentId === 'contract') {
      onUpdateContract({ 
        ...selectedContract, 
        attachedFiles: selectedContract.attachedFiles?.filter(f => f.fileName !== fileName) 
      });
    } else {
      const updatedInst = selectedContract.installments.map(inst => {
        if (inst.id !== installmentId) return inst;
        return { ...inst, attachedFiles: inst.attachedFiles?.filter(f => f.fileName !== fileName) };
      });
      onUpdateContract({ ...selectedContract, installments: updatedInst });
    }
    
    setAttachmentToDelete(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || (!activeInstallmentUpload && !activeContractUploadId) || !selectedContract) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = { 
        fileName: file.name, 
        fileData: base64Data, 
        fileDate: dateStr 
      };

      if (activeContractUploadId) {
        onUpdateContract({ 
          ...selectedContract, 
          attachedFiles: [...(selectedContract.attachedFiles || []), newAttachment] 
        });
        setActiveContractUploadId(null);
      } else if (activeInstallmentUpload) {
        const updatedInst = selectedContract.installments.map(inst => {
          if (inst.id !== activeInstallmentUpload.installmentId) return inst;
          return { ...inst, attachedFiles: [...(inst.attachedFiles || []), newAttachment] };
        });
        onUpdateContract({ ...selectedContract, installments: updatedInst });
        setActiveInstallmentUpload(null);
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const updateInstallmentData = (contractId: string, installmentId: string, updates: Partial<Installment>) => {
    if (!selectedContract) return;
    const updatedInstallments = selectedContract.installments.map(inst => {
      if (inst.id !== installmentId) return inst;
      return { ...inst, ...updates };
    });
    onUpdateContract({ ...selectedContract, installments: updatedInstallments });
  };

  const confirmDateChange = () => {
    if (!dateChangePending) return;
    const { contractId, installmentId, newDate } = dateChangePending;
    updateInstallmentData(contractId, installmentId, { dueDate: newDate });
    setDateChangePending(null);
  };

  const toggleInstallmentStatus = (contractId: string, installmentId: string) => {
    const current = contracts.find(c => c.id === contractId)?.installments.find(i => i.id === installmentId);
    if (!current) return;
    
    let nextStatus: Installment['status'] = 'Pending';
    if (current.status === 'Pending') nextStatus = 'Paid';
    else if (current.status === 'Paid') nextStatus = 'Overdue';
    else if (current.status === 'Overdue') nextStatus = 'Pending';
    
    updateInstallmentData(contractId, installmentId, { status: nextStatus });
  };

  const getStatusBadge = (status: Contract['status']) => {
    const styles = {
      Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Pending: 'bg-amber-100 text-amber-700 border-amber-200',
      Expired: 'bg-rose-100 text-rose-700 border-rose-200',
      Completed: 'bg-baccarim-active text-slate-700 border-slate-200'
    };
    const labels = {
      Active: 'Ativo',
      Pending: 'Pendente',
      Expired: 'Expirado',
      Completed: 'Concluído'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getInstallmentStatusDisplay = (status: Installment['status']) => {
    switch (status) {
      case 'Paid': return <span className="text-baccarim-green font-black flex items-center text-[11px] md:text-[13px] uppercase tracking-widest"><i className="fas fa-check-circle mr-2 text-[14px]"></i> PAGO</span>;
      case 'Pending': return <span className="text-baccarim-amber font-black flex items-center text-[11px] md:text-[13px] uppercase tracking-widest"><i className="fas fa-clock mr-2 text-[14px]"></i> PENDENTE</span>;
      case 'Overdue': return <span className="text-baccarim-rose font-black flex items-center text-[11px] md:text-[13px] uppercase tracking-widest"><i className="fas fa-exclamation-triangle mr-2 text-[14px]"></i> ATRASADO</span>;
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-baccarim-blue text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
            <i className="fas fa-file-invoice-dollar"></i>
            <span>Baccarim Finance</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-baccarim-text tracking-tight">Gestão Financeira</h2>
        </div>
        <div className="bg-baccarim-card p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-baccarim-border shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-baccarim-green/10 text-emerald-600 flex items-center justify-center shrink-0">
            <i className="fas fa-vault"></i>
          </div>
          <div>
            <p className="text-[9px] text-baccarim-text-muted font-black uppercase tracking-widest">Global em Carteira (Ativos)</p>
            <p className="text-lg md:text-xl font-black text-baccarim-text">{formatCurrency(totalGlobalValue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-baccarim-card rounded-3xl md:rounded-[3.5rem] shadow-xl border border-baccarim-border overflow-hidden">
        <div className="p-6 md:p-10 border-b border-baccarim-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-2xl font-black text-baccarim-text tracking-tight">Contratos & Fluxo de Recebimento</h3>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-[10px] text-baccarim-text-muted font-bold uppercase tracking-widest">Gestão de parcelas e documentos</p>
              <div className="md:hidden flex items-center text-[8px] text-baccarim-blue font-black animate-pulse">
                <i className="fas fa-arrow-right-long mr-1"></i> DESLIZE PARA VER MAIS
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowAddContractModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-baccarim-blue text-baccarim-text rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-baccarim-green transition-all shadow-lg"
          >
            <i className="fas fa-plus mr-2"></i> Novo Contrato
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-baccarim-hover text-[9px] md:text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">
              <tr>
                <th className="px-6 md:px-10 py-4 md:py-5">Contrato / Cliente</th>
                <th className="px-6 md:px-10 py-4 md:py-5">Valor Total</th>
                <th className="px-6 md:px-10 py-4 md:py-5">Parcelas</th>
                <th className="px-6 md:px-10 py-4 md:py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-baccarim-border">
              {contracts.map(contract => {
                const paidCount = contract.installments.filter(i => i.status === 'Paid').length;
                const totalCount = contract.installments.length;
                
                return (
                  <tr key={contract.id} className="hover:bg-baccarim-hover transition-colors">
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 rounded-2xl bg-baccarim-blue/10 text-baccarim-blue flex items-center justify-center">
                          <i className="fas fa-file-signature"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-black text-baccarim-text truncate">{contract.title}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-[8px] md:text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">
                              {contract.clientName}
                            </span>
                            {getStatusBadge(contract.status)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <p className="text-xs md:text-sm font-black text-baccarim-text">{formatCurrency(contract.totalValue)}</p>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-[60px] h-1.5 bg-baccarim-active rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-baccarim-green transition-all duration-1000" 
                            style={{ width: `${totalCount > 0 ? (paidCount/totalCount)*100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-black text-baccarim-text-muted">{paidCount}/{totalCount}</span>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <div className="flex items-center justify-center space-x-4">
                        <button 
                          onClick={() => setContractToDelete(contract.id)}
                          className="w-10 h-10 rounded-xl bg-[#FFF1F1] text-[#FF5A5A] hover:bg-[#FF5A5A] hover:text-baccarim-text flex items-center justify-center transition-all shadow-sm"
                          title="Excluir Contrato"
                        >
                          <i className="fas fa-trash-can text-sm"></i>
                        </button>
                        <button 
                          onClick={() => setSelectedContractId(contract.id)}
                          className="bg-baccarim-card border border-baccarim-border px-6 py-2.5 rounded-full text-[10px] font-black text-baccarim-text uppercase tracking-widest hover:shadow-lg transition-all hover:border-baccarim-border-hover"
                        >
                          Detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO (Premium) */}
      {contractToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border-t-8 border-t-baccarim-rose">
            <div className="w-20 h-20 bg-baccarim-rose/10 text-baccarim-rose rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner">
              <i className="fas fa-trash-can animate-bounce-slow"></i>
            </div>
            <h3 className="text-2xl font-black text-baccarim-text mb-3 tracking-tight">Excluir Contrato?</h3>
            <p className="text-[11px] text-baccarim-text-muted font-medium mb-10 leading-relaxed uppercase tracking-widest">
              Esta ação removerá permanentemente todos os registros de parcelas e anexos. <br/><strong>Não pode ser desfeita.</strong>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setContractToDelete(null)} 
                className="py-5 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-baccarim-active transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleConfirmDeleteContract} 
                className="py-5 bg-red-500/10 border border-red-500/20 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-red-500/20 transition-all hover:-translate-y-1"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO DE ANEXO */}
      {attachmentToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border-t-8 border-t-baccarim-rose">
            <div className="w-20 h-20 bg-baccarim-rose/10 text-baccarim-rose rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner">
              <i className="fas fa-file-circle-xmark animate-pulse"></i>
            </div>
            <h3 className="text-2xl font-black text-baccarim-text mb-3 tracking-tight">Excluir Anexo?</h3>
            <p className="text-[11px] text-baccarim-text-muted font-medium mb-10 leading-relaxed uppercase tracking-widest">
              Deseja remover o arquivo <strong>{attachmentToDelete.fileName}</strong> desta parcela? <br/>Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setAttachmentToDelete(null)} 
                className="py-5 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-baccarim-active transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleConfirmDeleteAttachment} 
                className="py-5 bg-red-500/10 border border-red-500/20 text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-red-500/20 transition-all hover:-translate-y-1"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhado de Parcelas (Premium Estilo Pill) */}
      {selectedContract && (
        <div className="fixed inset-0 bg-baccarim-navy/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[2.5rem] md:rounded-[4rem] w-full max-w-2xl shadow-2xl overflow-hidden p-8 md:p-14 relative max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <button onClick={() => setSelectedContractId(null)} className="absolute top-6 md:top-10 right-6 md:right-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-baccarim-hover flex items-center justify-center text-slate-300 hover:text-red-500 transition-all shadow-sm">
              <i className="fas fa-times"></i>
            </button>
            
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-[11px] font-black text-baccarim-blue uppercase tracking-[0.3em]">GESTÃO DE RECEBÍVEIS</span>
                  <span className="bg-baccarim-green/10 text-baccarim-green px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">ATIVO</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-baccarim-text tracking-tight">{selectedContract.title}</h3>
                <p className="text-baccarim-text-muted text-[10px] md:text-xs mt-2 font-black uppercase tracking-widest">
                  CONTRATO TOTAL: <span className="text-baccarim-text">{formatCurrency(selectedContract.totalValue)}</span>
                </p>
              </div>

              {/* Seção de Anexo do Contrato Principal */}
              <div className="flex items-center gap-4 bg-baccarim-hover p-4 rounded-2xl border border-baccarim-border">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest mb-1">Contrato Assinado</span>
                  {selectedContract.attachedFiles && selectedContract.attachedFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedContract.attachedFiles.map(file => (
                        <div key={file.fileName} className="flex items-center gap-2 bg-baccarim-card px-3 py-1.5 rounded-xl border border-baccarim-border shadow-sm">
                          <button onClick={() => downloadFile(file)} className="text-[10px] font-black text-baccarim-blue hover:underline truncate max-w-[100px]">
                            <i className="fas fa-file-pdf mr-1"></i> {file.fileName}
                          </button>
                          <button onClick={() => setAttachmentToDelete({ contractId: selectedContract.id, installmentId: 'contract', fileName: file.fileName })} className="text-rose-400 hover:text-rose-600">
                            <i className="fas fa-times-circle text-[10px]"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-baccarim-text-muted italic">Nenhum arquivo em anexo</span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setActiveContractUploadId(selectedContract.id);
                    fileInputRef.current?.click();
                  }}
                  className="w-10 h-10 rounded-xl bg-baccarim-blue text-baccarim-text flex items-center justify-center hover:bg-baccarim-green transition-all shadow-lg"
                  title="Anexar Contrato"
                >
                  <i className="fas fa-upload text-sm"></i>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-10 pb-20">
              {selectedContract.installments.map((inst, index) => (
                <div 
                  key={inst.id} 
                  className="p-6 md:p-8 bg-baccarim-card rounded-[2.5rem] md:rounded-[3.5rem] border border-baccarim-border shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center space-x-6 w-full md:w-auto">
                    {/* Index Number Circle */}
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] bg-baccarim-hover border border-baccarim-border flex items-center justify-center text-sm font-black text-baccarim-text shadow-inner shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          value={inst.title || `Parcela ${index + 1}`}
                          onChange={(e) => updateInstallmentData(selectedContract.id, inst.id, { title: e.target.value })}
                          className="bg-transparent border-none text-[18px] md:text-[22px] font-black text-baccarim-text outline-none focus:ring-0 w-full p-0 truncate leading-none"
                          placeholder="Nome"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 mt-1.5">
                         <p className="text-[10px] md:text-[12px] text-baccarim-text-muted font-black uppercase tracking-widest flex items-center">
                            VENCIMENTO: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                         </p>
                         <div className="relative inline-block">
                            <input 
                              type="date" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={(e) => setDateChangePending({ 
                                contractId: selectedContract.id, 
                                installmentId: inst.id, 
                                newDate: e.target.value,
                                oldDate: inst.dueDate
                              })}
                            />
                            <button className="text-[10px] md:text-[11px] text-baccarim-blue font-black uppercase tracking-widest hover:underline flex items-center">
                              <i className="fas fa-calendar-alt mr-2"></i> ALTERAR DATA
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto md:space-x-10 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                    <div 
                      onClick={() => toggleInstallmentStatus(selectedContract.id, inst.id)}
                      className="cursor-pointer hover:scale-105 transition-transform"
                    >
                      {getInstallmentStatusDisplay(inst.status)}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <button 
                          onClick={() => {
                            setActiveInstallmentUpload({ contractId: selectedContract.id, installmentId: inst.id });
                            fileInputRef.current?.click();
                          }}
                          className="w-12 h-12 rounded-[1.2rem] bg-[#3FA9F5]/5 text-[#3FA9F5] flex items-center justify-center hover:bg-[#3FA9F5] hover:text-baccarim-text transition-all shadow-sm"
                        >
                          <i className="fas fa-paperclip text-[18px]"></i>
                        </button>
                        {inst.attachedFiles && inst.attachedFiles.length > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#00B08E] text-baccarim-text text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            {inst.attachedFiles.length}
                          </span>
                        )}
                      </div>

                      {/* Botão de Excluir Anexos (se existirem) */}
                      {inst.attachedFiles && inst.attachedFiles.length > 0 && (
                        <div className="flex flex-col space-y-1">
                           {inst.attachedFiles.map(file => (
                             <div key={file.fileName} className="flex items-center space-x-2">
                               <button 
                                  onClick={() => downloadFile(file)}
                                  className="text-[9px] text-baccarim-blue hover:text-baccarim-navy font-black uppercase tracking-tighter flex items-center"
                                  title="Baixar Arquivo"
                               >
                                 <i className="fas fa-download mr-1"></i> {file.fileName.slice(0, 8)}...
                               </button>
                               <button 
                                  onClick={() => setAttachmentToDelete({ contractId: selectedContract.id, installmentId: inst.id, fileName: file.fileName })}
                                  className="text-[9px] text-rose-400 hover:text-rose-600 font-black"
                                  title="Excluir"
                               >
                                 <i className="fas fa-times-circle"></i>
                               </button>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setSelectedContractId(null)} className="flex-1 py-5 bg-baccarim-navy/10 border border-baccarim-border text-baccarim-text rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-baccarim-navy/20 transition-all">
                FINALIZAR AJUSTES
              </button>
              <button onClick={() => setSelectedContractId(null)} className="px-10 py-5 bg-baccarim-hover text-baccarim-text-muted rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-baccarim-active transition-colors">
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Data */}
      {dateChangePending && (
        <div className="fixed inset-0 bg-baccarim-navy/60 backdrop-blur-md z-[210] flex items-center justify-center p-4">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-sm shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-[#3FA9F5]/10 text-[#3FA9F5] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="fas fa-calendar-check"></i>
            </div>
            <h3 className="text-xl font-black text-baccarim-text mb-2">Alterar Vencimento?</h3>
            <p className="text-[11px] text-baccarim-text-subtle mb-8 leading-relaxed">
              Deseja atualizar a data de vencimento de <strong className="text-baccarim-rose">{new Date(dateChangePending.oldDate).toLocaleDateString('pt-BR')}</strong> para <strong className="text-baccarim-green">{new Date(dateChangePending.newDate).toLocaleDateString('pt-BR')}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setDateChangePending(null)} 
                className="py-4 bg-baccarim-active text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-baccarim-hover transition-colors"
              >
                VOLTAR
              </button>
              <button 
                onClick={confirmDateChange} 
                className="py-4 bg-baccarim-blue/10 border border-baccarim-border text-baccarim-text rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-baccarim-blue/20 transition-all"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Contrato (Com Parcelas Dinâmicas) */}
      {showAddContractModal && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden p-10 md:p-12 relative animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <h3 className="text-2xl font-black text-baccarim-text mb-8">Novo Contrato de Serviço</h3>
            
            <form onSubmit={handleCreateContract} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Título do Serviço</label>
                <input required value={newContractForm.title} onChange={e => setNewContractForm({...newContractForm, title: e.target.value})} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text" placeholder="Ex: Gestão Ambiental Lote 137" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Cliente</label>
                <select 
                  required
                  value={newContractForm.clientName}
                  onChange={e => setNewContractForm({...newContractForm, clientName: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none font-bold text-baccarim-text"
                >
                  {clients.map(c => <option key={c} value={c} className="bg-baccarim-card">{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Valor Total (R$)</label>
                <input type="number" step="0.01" required value={newContractForm.totalValue} onChange={e => setNewContractForm({...newContractForm, totalValue: e.target.value})} className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none font-bold text-baccarim-text" placeholder="0.00" />
              </div>

              {/* Seção de Parcelas Dinâmicas */}
              <div className="pt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-baccarim-border pb-3">
                  <h4 className="text-[10px] font-black text-baccarim-blue uppercase tracking-[0.2em]">Cronograma de Pagamentos</h4>
                  <button 
                    type="button" 
                    onClick={handleAddInstallmentRow}
                    className="text-[9px] font-black text-baccarim-text bg-baccarim-green px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-baccarim-green transition-all shadow-md shadow-emerald-500/10"
                  >
                    + Adicionar Parcela
                  </button>
                </div>

                <div className="space-y-3">
                  {newContractForm.installments.map((inst, idx) => (
                    <div key={idx} className="flex gap-3 animate-in slide-in-from-right-2 duration-300">
                      <div className="flex-1">
                        <input 
                          required
                          value={inst.title}
                          onChange={(e) => handleUpdateInstallmentRow(idx, 'title', e.target.value)}
                          className="w-full bg-baccarim-hover border border-baccarim-border p-3 rounded-xl text-[10px] font-bold outline-none"
                          placeholder="Nome (ex: Sinal)"
                        />
                      </div>
                      <div className="w-32">
                        <input 
                          type="date"
                          required
                          value={inst.dueDate}
                          onChange={(e) => handleUpdateInstallmentRow(idx, 'dueDate', e.target.value)}
                          className="w-full bg-baccarim-hover border border-baccarim-border p-3 rounded-xl text-[10px] font-bold outline-none"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveInstallmentRow(idx)}
                        disabled={newContractForm.installments.length <= 1}
                        className="w-10 h-10 rounded-xl bg-baccarim-active text-baccarim-text-muted hover:text-red-500 transition-all disabled:opacity-0"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-8 sticky bottom-0 bg-baccarim-card">
                <button type="submit" className="flex-1 bg-baccarim-navy/10 border border-baccarim-border text-baccarim-text py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-navy/20 transition-all">Gerar Contrato</button>
                <button type="button" onClick={() => setShowAddContractModal(false)} className="px-8 bg-baccarim-active text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-hover transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;

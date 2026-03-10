
import React, { useState } from 'react';
import { User } from '../types';
import { downloadFile } from '../utils/fileUtils';
import { exportAllDataAsZip } from '../utils/zipUtils';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (user: User) => void;
  allData?: any;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, allData }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    receiveNotifications: true,
    compactView: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [isLightMode, setIsLightMode] = useState(() => {
    return document.body.classList.contains('light-theme');
  });

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    if (newMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('baccarim_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('baccarim_theme', 'dark');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser({
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleExportData = () => {
    if (!allData) return;
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFile = {
      fileName: `baccarim_backup_${new Date().toISOString().split('T')[0]}.json`,
      fileData: dataUri,
      fileDate: new Date().toLocaleDateString('pt-BR')
    };
    
    downloadFile(exportFile);
  };

  const handleExportZip = async () => {
    if (!allData) return;
    setIsSaving(true);
    try {
      await exportAllDataAsZip(allData);
    } catch (error) {
      console.error("Erro ao exportar ZIP:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {showToast && (
        <div className="fixed top-10 right-10 z-[200] bg-baccarim-green text-baccarim-text px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-8">
          <div className="flex items-center space-x-3">
            <i className="fas fa-check-circle"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil Atualizado com Sucesso</span>
          </div>
        </div>
      )}

      {/* Header do Perfil */}
      <div className="bg-gradient-to-r from-baccarim-navy to-baccarim-blue rounded-[3rem] p-10 md:p-14 text-baccarim-text shadow-2xl relative overflow-hidden border border-baccarim-border-hover">
        <div className="absolute top-0 right-0 w-64 h-64 bg-baccarim-hover rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-baccarim-card rounded-[2rem] flex items-center justify-center text-[#002D62] text-3xl md:text-5xl font-black shadow-2xl">
            {userInitials}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">{user.name}</h2>
            <p className="text-baccarim-text-subtle text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-2">
              {user.role === 'admin' ? 'Administrador do Sistema' : user.role === 'engineer' ? 'Engenheiro de Licenciamento' : 'Cliente Estratégico'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-baccarim-active px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-baccarim-border-hover">
                Membro desde {user.createdAt || 'Jan 2024'}
              </span>
              <span className="bg-baccarim-green/20 text-baccarim-green px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-baccarim-green/20">
                Conta Ativa
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Dados */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-baccarim-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-baccarim-border">
            <h3 className="text-xl font-black text-baccarim-text mb-8">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Empresas Vinculadas</label>
                <div className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-xl text-xs font-bold text-baccarim-text-muted min-h-[52px] flex flex-wrap gap-2">
                  {user.clientNames && user.clientNames.length > 0 ? (
                    user.clientNames.map(cn => (
                      <span key={cn} className="bg-baccarim-card px-2 py-1 rounded-md border border-baccarim-border text-[9px] uppercase tracking-widest">{cn}</span>
                    ))
                  ) : (
                    'Baccarim Engenharia'
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-baccarim-border">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full md:w-auto px-12 py-4 bg-baccarim-blue text-baccarim-text rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Configurações de UI */}
          <div className="bg-baccarim-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-baccarim-border">
            <h3 className="text-xl font-black text-baccarim-text mb-8">Preferências do Sistema</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-baccarim-hover rounded-2xl border border-baccarim-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-baccarim-blue/10 text-baccarim-blue flex items-center justify-center">
                    <i className="fas fa-bell"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-baccarim-text">Notificações por E-mail</p>
                    <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">Alertas de vencimento e mensagens</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFormData({...formData, receiveNotifications: !formData.receiveNotifications})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.receiveNotifications ? 'bg-baccarim-green' : 'bg-baccarim-hover'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-baccarim-card rounded-full transition-all ${formData.receiveNotifications ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-baccarim-hover rounded-2xl border border-baccarim-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-baccarim-active text-baccarim-text flex items-center justify-center">
                    <i className="fas fa-table-list"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-baccarim-text">Visualização Compacta</p>
                    <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">Otimizar espaço em tabelas</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, compactView: !formData.compactView})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.compactView ? 'bg-baccarim-green' : 'bg-baccarim-hover'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-baccarim-card rounded-full transition-all ${formData.compactView ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-baccarim-hover rounded-2xl border border-baccarim-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-baccarim-active text-baccarim-text flex items-center justify-center">
                    <i className={`fas ${isLightMode ? 'fa-sun text-baccarim-amber' : 'fa-moon text-indigo-400'}`}></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-baccarim-text">Tema Claro</p>
                    <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">Alternar modo de cores</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-all relative ${isLightMode ? 'bg-baccarim-green' : 'bg-baccarim-hover'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-baccarim-card rounded-full transition-all ${isLightMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar do Perfil */}
        <div className="space-y-8">
          <div className="bg-baccarim-card rounded-[2.5rem] p-8 text-baccarim-text shadow-2xl relative overflow-hidden border border-baccarim-border">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-baccarim-green/10 rounded-full -mb-10 -mr-10 blur-2xl"></div>
            <h4 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Nível de Acesso</h4>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-baccarim-hover border border-baccarim-border-hover flex items-center justify-center text-xl">
                  <i className={`fas ${user.role === 'admin' ? 'fa-shield-halved text-baccarim-blue' : user.role === 'engineer' ? 'fa-helmet-safety text-baccarim-amber' : 'fa-building-user text-baccarim-green'}`}></i>
                </div>
                <div>
                  <p className="text-sm font-black text-baccarim-text">
                    {user.role === 'admin' ? 'Administrador' : user.role === 'engineer' ? 'Engenheiro' : 'Cliente'}
                  </p>
                  <p className="text-[9px] text-baccarim-text-muted font-bold uppercase tracking-widest">
                    Acesso {user.role === 'admin' ? 'Total' : user.role === 'engineer' ? 'Técnico' : 'Restrito'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-baccarim-text-muted leading-relaxed">
                {user.role === 'admin' 
                  ? 'Você possui privilégios de edição completa de licenças, contratos e checklists em todos os projetos.' 
                  : user.role === 'engineer'
                  ? 'Você possui acesso técnico para gerenciar projetos, checklists e laudos fotográficos.'
                  : 'Você possui visualização técnica dos seus empreendimentos e notificações.'}
              </p>
            </div>
          </div>

          <div className="bg-baccarim-card rounded-[2.5rem] p-8 border border-baccarim-border shadow-2xl text-center">
            <h4 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Segurança da Conta</h4>
            <div className="w-20 h-20 bg-baccarim-green/10 text-baccarim-green rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fas fa-lock"></i>
            </div>
            <p className="text-xs font-bold text-baccarim-text">Sua conta é protegida</p>
            <p className="text-[10px] text-baccarim-text-muted mt-2">Último login: {new Date().toLocaleDateString('pt-BR')}</p>
            <button className="mt-6 w-full py-3 border border-baccarim-border-hover rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-baccarim-hover transition-all text-baccarim-text-muted">
              Alterar Senha
            </button>
          </div>

          {(user.role === 'admin' || user.role === 'engineer') && (
            <div className="bg-baccarim-card rounded-[2.5rem] p-8 border border-baccarim-border shadow-2xl text-center">
              <h4 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Backup do Sistema</h4>
              <div className="w-20 h-20 bg-baccarim-blue/5 text-baccarim-blue rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-file-export"></i>
              </div>
              <p className="text-xs font-bold text-baccarim-text">Exportar Base de Dados</p>
              <p className="text-[10px] text-baccarim-text-muted mt-2">Baixe todos os registros (JSON)</p>
              <div className="grid grid-cols-1 gap-3 mt-6">
                <button 
                  onClick={handleExportData}
                  className="w-full py-4 bg-baccarim-hover text-baccarim-text rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-baccarim-active transition-all"
                >
                  Download JSON
                </button>
                <button 
                  onClick={handleExportZip}
                  disabled={isSaving}
                  className="w-full py-4 bg-baccarim-blue text-baccarim-text rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-baccarim-green transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <div className="w-3 h-3 border-2 border-baccarim-border/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <i className="fas fa-file-zipper"></i>
                  )}
                  <span>Download Tudo (ZIP)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

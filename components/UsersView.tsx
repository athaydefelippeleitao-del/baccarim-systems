
import React, { useState } from 'react';
import { User } from '../types';

interface UsersViewProps {
  users: (User & { password?: string })[];
  clients: string[];
  onAddUser: (user: User & { password?: string }) => void;
  onDeleteUser: (id: string) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ users, clients, onAddUser, onDeleteUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client' as 'admin' | 'engineer' | 'client',
    clientNames: [] as string[]
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User & { password?: string } = {
      id: `u-${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password,
      role: newUserForm.role,
      clientNames: newUserForm.role === 'client' ? newUserForm.clientNames : undefined,
      createdAt: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setNewUserForm({ name: '', email: '', password: '', role: 'client', clientNames: [] });
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const confirmDelete = (id: string) => {
    onDeleteUser(id);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-baccarim-text tracking-tight">Gestão de Contas</h2>
          <p className="text-baccarim-text-muted font-medium">Controle de acessos e visualização de credenciais.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-baccarim-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-blue/20 hover:-translate-y-1 transition-all"
        >
          <i className="fas fa-user-plus mr-2"></i> Nova Conta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-baccarim-card rounded-[2.5rem] border border-baccarim-border p-8 shadow-2xl hover:border-baccarim-border-hover transition-all group relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${user.role === 'admin' ? 'bg-baccarim-blue' : 'bg-baccarim-green'}`}></div>
            
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg ${user.role === 'admin' ? 'bg-baccarim-navy' : 'bg-baccarim-green'}`}>
                <i className={`fas ${user.role === 'admin' ? 'fa-shield-halved' : 'fa-building-user'}`}></i>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => togglePasswordVisibility(user.id)}
                  className="w-10 h-10 rounded-xl bg-baccarim-hover text-baccarim-text-muted hover:text-baccarim-blue flex items-center justify-center transition-all"
                  title="Ver Senha"
                >
                  <i className={`fas ${visiblePasswords[user.id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
                <button 
                  onClick={() => setUserToDelete(user.id)}
                  className="w-10 h-10 rounded-xl bg-baccarim-rose/10 text-baccarim-rose hover:bg-baccarim-rose hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  title="Excluir"
                >
                  <i className="fas fa-trash-can"></i>
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-baccarim-text tracking-tight truncate">{user.name}</h3>
            <p className="text-xs font-bold text-baccarim-text-muted mt-1">{user.email}</p>
            
            <div className="mt-4 p-3 bg-baccarim-hover rounded-xl border border-baccarim-border flex items-center justify-between">
              <span className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest">Senha</span>
              <span className="text-[10px] font-mono font-bold text-baccarim-text">
                {visiblePasswords[user.id] ? user.password : '••••••••'}
              </span>
            </div>
            
            <div className="mt-6 pt-6 border-t border-baccarim-border flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest">Nível de Acesso</p>
                <span className={`text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-baccarim-blue' : user.role === 'engineer' ? 'text-baccarim-amber' : 'text-baccarim-green'}`}>
                  {user.role === 'admin' ? 'Administrador' : user.role === 'engineer' ? 'Engenheiro' : 'Cliente'}
                </span>
              </div>
              {user.clientNames && user.clientNames.length > 0 && (
                <div className="text-right max-w-[60%]">
                  <p className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest">Empresas</p>
                  <div className="flex flex-wrap justify-end gap-1 mt-1">
                    {user.clientNames.map(cn => (
                      <span key={cn} className="text-[8px] font-black text-baccarim-text bg-baccarim-hover px-2 py-0.5 rounded-md border border-baccarim-border uppercase tracking-widest">{cn}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {userToDelete && (
        <div className="fixed inset-0 bg-baccarim-dark/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[2.5rem] w-full max-sm shadow-2xl p-10 text-center border border-baccarim-border-hover">
            <div className="w-16 h-16 bg-baccarim-rose/10 text-baccarim-rose rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"><i className="fas fa-user-xmark"></i></div>
            <h3 className="text-xl font-black text-baccarim-text mb-2">Excluir Conta?</h3>
            <p className="text-xs text-baccarim-text-muted mb-8">Este usuário perderá o acesso imediato ao sistema.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setUserToDelete(null)} className="py-4 bg-baccarim-hover text-baccarim-text-muted rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={() => confirmDelete(userToDelete)} className="py-4 bg-baccarim-rose text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-baccarim-rose/20">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl p-10 md:p-12 relative overflow-y-auto max-h-[90vh] border border-baccarim-border-hover pb-safe">
            <h3 className="text-2xl font-black text-baccarim-text mb-8">Nova Conta de Acesso</h3>
            <form onSubmit={handleCreateUser} className="space-y-6 pb-20">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  required 
                  value={newUserForm.name} 
                  onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text" 
                  placeholder="Ex: João Silva" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Usuário ou E-mail</label>
                <input 
                  required 
                  value={newUserForm.email} 
                  onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text" 
                  placeholder="Ex: joao.silva" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Senha</label>
                <input 
                  required 
                  type="text"
                  value={newUserForm.password} 
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                  className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text" 
                  placeholder="Defina uma senha" 
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Nível de Acesso</label>
                  <select 
                    value={newUserForm.role} 
                    onChange={e => setNewUserForm({...newUserForm, role: e.target.value as any})}
                    className="w-full bg-baccarim-hover border border-baccarim-border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold text-baccarim-text appearance-none"
                  >
                    <option value="client" className="bg-baccarim-card">Cliente</option>
                    <option value="engineer" className="bg-baccarim-card">Engenheiro</option>
                    <option value="admin" className="bg-baccarim-card">Administrador</option>
                  </select>
                </div>
              </div>

              {newUserForm.role === 'client' && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Vincular Clientes (Múltiplos)</label>
                  <div className="bg-baccarim-hover border border-baccarim-border rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2 no-scrollbar">
                    {[...clients].sort((a, b) => a.localeCompare(b)).map(c => (
                      <label key={c} className="flex items-center space-x-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={newUserForm.clientNames.includes(c)}
                          onChange={e => {
                            const newNames = e.target.checked 
                              ? [...newUserForm.clientNames, c]
                              : newUserForm.clientNames.filter(name => name !== c);
                            setNewUserForm({...newUserForm, clientNames: newNames});
                          }}
                          className="w-4 h-4 rounded border-baccarim-border bg-baccarim-card text-baccarim-blue focus:ring-baccarim-blue"
                        />
                        <span className="text-xs font-bold text-baccarim-text group-hover:text-baccarim-blue transition-colors">{c}</span>
                      </label>
                    ))}
                  </div>
                  {newUserForm.clientNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newUserForm.clientNames.map(cn => (
                        <span key={cn} className="bg-baccarim-blue/10 text-baccarim-blue text-[8px] font-black px-2 py-1 rounded-lg border border-baccarim-blue/20 uppercase tracking-widest">
                          {cn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-baccarim-blue text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-baccarim-blue/20 hover:bg-baccarim-green transition-all">Criar Conta</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 bg-baccarim-hover text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-active transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;

import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ServerStats {
  projects: number;
  licenses: number;
  notifications: number;
  reports: number;
  dbSize: number;
  uptime: number;
  lastUpdate: string;
}

interface ServerManagementProps {
  auditLog: any[];
  presence: any[];
}

const ServerManagementView: React.FC<ServerManagementProps> = ({ auditLog, presence }) => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'logs' | 'presence' | 'backup'>('stats');

  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleRestore = async (file: File) => {
    setIsRestoring(true);
    try {
      let json;
      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const dbFile = zip.file("db.json");
        if (!dbFile) throw new Error("Arquivo db.json não encontrado no ZIP");
        const text = await dbFile.async("string");
        json = JSON.parse(text);
      } else {
        const text = await file.text();
        json = JSON.parse(text);
      }
      
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      
      if (res.ok) {
        alert('Backup restaurado com sucesso! O sistema será recarregado.');
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(`Erro ao restaurar backup: ${errData.error || 'Erro no servidor'}`);
      }
    } catch (err) {
      console.error("Erro na restauração:", err);
      alert('Arquivo inválido ou erro na leitura do backup.');
    } finally {
      setIsRestoring(false);
      setShowConfirmModal(false);
      setPendingFile(null);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/server-stats');
      if (!res.ok) {
        if (res.status === 429) {
          console.warn("Limite de requisições atingido (Rate limit)");
          return;
        }
        throw new Error(`Server error: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta do servidor não é JSON");
      }
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Erro ao buscar stats do servidor", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const dbLimit = 1024 * 1024 * 1024; // 1GB limit for UI display
  const dbUsagePercent = stats ? Math.min((stats.dbSize / dbLimit) * 100, 100) : 0;

  if (loading) return <div className="p-10 text-center font-black text-baccarim-text-muted uppercase tracking-widest animate-pulse">Conectando ao Servidor Baccarim...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-baccarim-text tracking-tight">Servidor & Nuvem</h2>
          <p className="text-baccarim-text-muted font-medium">Monitoramento em tempo real da infraestrutura Baccarim Systems.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-baccarim-card p-1 rounded-2xl border border-baccarim-border">
            <button 
              onClick={() => setActiveSubTab('stats')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'stats' ? 'bg-baccarim-blue text-baccarim-text shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
            >
              Estatísticas
            </button>
            <button 
              onClick={() => setActiveSubTab('logs')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'logs' ? 'bg-baccarim-blue text-baccarim-text shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
            >
              Logs de Alterações
            </button>
            <button 
              onClick={() => setActiveSubTab('presence')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'presence' ? 'bg-baccarim-blue text-baccarim-text shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
            >
              Usuários Online ({presence.length})
            </button>
            <button 
              onClick={() => setActiveSubTab('backup')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'backup' ? 'bg-baccarim-blue text-baccarim-text shadow-md' : 'text-baccarim-text-muted hover:bg-baccarim-hover'}`}
            >
              Backup & Restauração
            </button>
          </div>
          <div className="flex items-center space-x-3 bg-baccarim-green/10 px-6 py-3 rounded-2xl border border-emerald-500/20">
            <div className="w-3 h-3 bg-baccarim-green rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
            <span className="text-[10px] font-black text-baccarim-green uppercase tracking-widest">Servidor Online</span>
          </div>
        </div>
      </div>

      {activeSubTab === 'stats' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-baccarim-card p-8 rounded-[2.5rem] shadow-2xl border border-baccarim-border">
              <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest mb-2">Tamanho da Base</p>
              <p className="text-2xl font-black text-baccarim-text">{formatSize(stats?.dbSize || 0)}</p>
              <div className="mt-4 h-1 bg-baccarim-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-baccarim-blue transition-all duration-1000" 
                  style={{ width: `${dbUsagePercent}%` }}
                ></div>
              </div>
              <p className="text-[8px] font-bold text-baccarim-text-muted mt-2 uppercase tracking-widest">Capacidade: 1.0 GB</p>
            </div>
            <div className="bg-baccarim-card p-8 rounded-[2.5rem] shadow-2xl border border-baccarim-border">
              <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest mb-2">Tempo de Atividade</p>
              <p className="text-2xl font-black text-baccarim-text">{formatUptime(stats?.uptime || 0)}</p>
              <p className="text-[9px] font-bold text-baccarim-green mt-2 uppercase tracking-widest">Estável</p>
            </div>
            <div className="bg-baccarim-card p-8 rounded-[2.5rem] shadow-2xl border border-baccarim-border">
              <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest mb-2">Total de Registros</p>
              <p className="text-2xl font-black text-baccarim-text">{(stats?.projects || 0) + (stats?.licenses || 0) + (stats?.notifications || 0)}</p>
              <p className="text-[9px] font-bold text-baccarim-text-muted mt-2 uppercase tracking-widest">Sincronizados</p>
            </div>
            <div className="bg-baccarim-card p-8 rounded-[2.5rem] shadow-2xl border border-baccarim-border">
              <p className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest mb-2">Última Escrita</p>
              <p className="text-sm font-black text-baccarim-text truncate">
                {stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('pt-BR') : 'N/A'}
              </p>
              <p className="text-[9px] font-bold text-baccarim-blue mt-2 uppercase tracking-widest">Backup Automático Ativo</p>
            </div>
          </div>

          <div className="bg-baccarim-card rounded-[3rem] p-10 md:p-14 text-baccarim-text shadow-2xl relative overflow-hidden border border-baccarim-border">
            <div className="absolute top-0 right-0 w-96 h-96 bg-baccarim-blue/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-baccarim-hover rounded-3xl flex items-center justify-center text-3xl border border-baccarim-border-hover">
                  <i className="fas fa-cloud-bolt text-baccarim-blue"></i>
                </div>
                <h3 className="text-3xl font-black tracking-tight">Infraestrutura Baccarim Cloud</h3>
                <p className="text-baccarim-text-muted leading-relaxed font-medium">
                  Seu aplicativo agora opera em uma arquitetura centralizada. Isso significa que o link que você compartilha com sua equipe é o mesmo servidor que processa e armazena todos os dados em tempo real.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-baccarim-hover border border-baccarim-border-hover px-5 py-3 rounded-2xl flex items-center space-x-3">
                    <i className="fas fa-check-circle text-baccarim-green"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">WebSockets Ativos</span>
                  </div>
                  <div className="bg-baccarim-hover border border-baccarim-border-hover px-5 py-3 rounded-2xl flex items-center space-x-3">
                    <i className="fas fa-check-circle text-baccarim-green"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Persistência db.json</span>
                  </div>
                </div>
              </div>
              <div className="bg-baccarim-hover rounded-[2.5rem] p-8 border border-baccarim-border-hover backdrop-blur-sm">
                <h4 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest mb-6">Logs de Sincronização</h4>
                <div className="space-y-4 font-mono text-[10px]">
                  <div className="flex items-center space-x-3 text-emerald-400">
                    <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                    <span>INFO: Conexão WebSocket estabelecida com sucesso.</span>
                  </div>
                  <div className="flex items-center space-x-3 text-baccarim-text-subtle">
                    <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                    <span>SYNC: Estado inicial carregado (db.json).</span>
                  </div>
                  <div className="flex items-center space-x-3 text-baccarim-blue">
                    <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                    <span>LISTEN: Aguardando atualizações de outros terminais...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'logs' && (
        <div className="bg-baccarim-card rounded-[2.5rem] border border-baccarim-border overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-baccarim-border flex justify-between items-center">
            <h3 className="text-xl font-black text-baccarim-text uppercase tracking-tight">Relatório de Alterações</h3>
            <span className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest">Últimas 100 ações</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-baccarim-hover/50">
                  <th className="p-6 text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest border-b border-baccarim-border">Data/Hora</th>
                  <th className="p-6 text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest border-b border-baccarim-border">Usuário</th>
                  <th className="p-6 text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest border-b border-baccarim-border">Ação</th>
                  <th className="p-6 text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest border-b border-baccarim-border">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-baccarim-border">
                {auditLog.length > 0 ? auditLog.map((log) => (
                  <tr key={log.id} className="hover:bg-baccarim-hover/30 transition-colors">
                    <td className="p-6 text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                    <td className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-baccarim-blue/20 flex items-center justify-center text-[10px] font-black text-baccarim-blue">
                          {log.userName?.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-baccarim-text">{log.userName}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        log.action === 'LOGIN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-baccarim-blue/10 text-baccarim-blue'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-6 text-sm font-medium text-baccarim-text-muted">{log.details}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-baccarim-text-muted font-black uppercase tracking-widest">Nenhum log registrado ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'presence' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presence.length > 0 ? presence.map((user) => (
            <div key={user.socketId} className="bg-baccarim-card p-8 rounded-[2.5rem] border border-baccarim-border shadow-2xl relative overflow-hidden group hover:border-baccarim-blue/50 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-baccarim-blue/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-baccarim-blue/10 transition-all"></div>
              <div className="flex items-center space-x-5 relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-baccarim-hover flex items-center justify-center text-2xl font-black text-baccarim-blue border border-baccarim-border">
                    {user.name?.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-baccarim-green rounded-full border-4 border-baccarim-card shadow-lg"></div>
                </div>
                <div>
                  <h4 className="text-lg font-black text-baccarim-text leading-tight">{user.name}</h4>
                  <p className="text-xs font-bold text-baccarim-text-muted">{user.email}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-baccarim-navy text-[8px] font-black uppercase tracking-widest text-baccarim-text-muted">
                      {user.role}
                    </span>
                    <span className="text-[8px] font-bold text-baccarim-green uppercase tracking-widest">Online Agora</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-baccarim-border flex justify-between items-center">
                <span className="text-[8px] font-black text-baccarim-text-muted uppercase tracking-widest">Conectado via WebSocket</span>
                <span className="text-[8px] font-mono text-baccarim-blue opacity-50">{user.socketId.substring(0, 8)}...</span>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-baccarim-card p-20 rounded-[2.5rem] border border-baccarim-border text-center">
              <p className="text-baccarim-text-muted font-black uppercase tracking-widest">Nenhum usuário online no momento.</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-baccarim-card p-10 md:p-14 rounded-[3rem] border border-baccarim-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-baccarim-blue/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-baccarim-blue/10 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-baccarim-blue/20">
                <i className="fas fa-download text-baccarim-blue"></i>
              </div>
              <h3 className="text-2xl font-black text-baccarim-text tracking-tight mb-4">Exportar Backup</h3>
              <p className="text-baccarim-text-muted font-medium mb-8">
                Baixe um arquivo JSON contendo todos os dados do sistema (projetos, licenças, notificações, usuários, etc). 
                Recomendamos fazer isso antes de atualizar o código do aplicativo.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/state?t=${Date.now()}`, { cache: 'no-store' });
                    const data = await res.json();
                    
                    // Usar JSZip para comprimir o backup, já que base64 de imagens ocupa muito espaço
                    const zip = new JSZip();
                    zip.file("db.json", JSON.stringify(data, null, 2));
                    
                    const content = await zip.generateAsync({ 
                      type: "blob",
                      compression: "DEFLATE",
                      compressionOptions: { level: 9 }
                    });
                    
                    saveAs(content, `baccarim-backup-${new Date().toISOString().split('T')[0]}.zip`);
                  } catch (e) {
                    console.error("Erro ao exportar backup:", e);
                    alert('Erro ao exportar backup. O arquivo pode ser muito grande para o navegador.');
                  }
                }}
                className="w-full py-5 bg-baccarim-blue text-baccarim-text rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-green transition-all flex items-center justify-center space-x-3"
              >
                <i className="fas fa-file-zipper"></i>
                <span>Fazer Download do Backup (ZIP)</span>
              </button>
            </div>
          </div>

          <div className="bg-baccarim-card p-10 md:p-14 rounded-[3rem] border border-baccarim-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-amber-500/20">
                <i className="fas fa-upload text-amber-500"></i>
              </div>
              <h3 className="text-2xl font-black text-baccarim-text tracking-tight mb-4">Restaurar Backup</h3>
              <p className="text-baccarim-text-muted font-medium mb-8">
                Faça o upload de um arquivo JSON de backup para restaurar o estado do sistema. 
                <strong className="text-amber-500 block mt-2">Atenção: Isso substituirá todos os dados atuais.</strong>
              </p>
              
              <label className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all flex items-center justify-center space-x-3 cursor-pointer border ${isRestoring ? 'bg-baccarim-hover text-baccarim-text-muted cursor-not-allowed' : 'bg-baccarim-hover text-baccarim-text hover:bg-amber-500/20 hover:text-baccarim-text border-baccarim-border-hover'}`}>
                {isRestoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-baccarim-border/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <span>Restaurando... Aguarde</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-import"></i>
                    <span>Selecionar Arquivo (.zip ou .json)</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept=".json,.zip" 
                  className="hidden" 
                  disabled={isRestoring}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPendingFile(file);
                    setShowConfirmModal(true);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-baccarim-navy/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-baccarim-card w-full max-w-md rounded-[2.5rem] border border-baccarim-border shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-4xl mx-auto border border-amber-500/20">
              <i className="fas fa-triangle-exclamation text-amber-500"></i>
            </div>
            
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-baccarim-text tracking-tight uppercase">Confirmar Restauração</h3>
              <p className="text-baccarim-text-muted font-medium leading-relaxed">
                Você está prestes a restaurar o arquivo <span className="text-baccarim-text font-bold">"{pendingFile?.name}"</span>. 
                Isso substituirá <span className="text-amber-500 font-bold underline">TODOS</span> os dados atuais do sistema.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                disabled={isRestoring}
                onClick={() => pendingFile && handleRestore(pendingFile)}
                className="w-full py-5 bg-amber-500/10 border border-baccarim-border text-baccarim-text rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-amber-500/20 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Restaurando Dados...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle"></i>
                    <span>Sim, Restaurar Agora</span>
                  </>
                )}
              </button>
              
              <button
                disabled={isRestoring}
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingFile(null);
                }}
                className="w-full py-5 bg-baccarim-hover text-baccarim-text rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-baccarim-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerManagementView;

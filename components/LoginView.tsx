
import React, { useState } from 'react';
import { AppLogo } from './AppLogo';

interface LoginViewProps {
  onLogin: (user: string, pass: string) => void;
  error?: string;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, error }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(user.trim(), pass.trim());
  };

  return (
    <div className="min-h-screen bg-baccarim-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-baccarim-green/10 rounded-full blur-[180px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-baccarim-blue/10 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-baccarim-card/80 backdrop-blur-3xl border border-baccarim-border p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-baccarim-green via-baccarim-blue to-baccarim-rose opacity-50"></div>
          
          <div className="text-center mb-12">
            <div className="flex justify-center mb-10">
              <div className="relative w-24 h-24 group">
                 {/* Glowing Aura */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-baccarim-green/20 to-baccarim-blue/20 blur-2xl rounded-full animate-pulse"></div>
                 
                 {/* Geometric Blocks - Exact replica of Loading Screen style but scaled */}
                 <div className="absolute inset-0 grid grid-cols-2 gap-2">
                    <div className="bg-baccarim-green rounded-xl transform -skew-y-12 shadow-[0_0_25px_rgba(0,176,142,0.4)] animate-float-slow"></div>
                    <div className="space-y-2">
                       <div className="h-1/2 bg-baccarim-navy rounded-xl transform skew-y-12 shadow-[0_0_25px_rgba(0,45,98,0.2)] animate-float-slow" style={{ animationDelay: '0.5s' }}></div>
                       <div className="h-1/2 bg-baccarim-blue rounded-xl transform skew-y-12 shadow-[0_0_25px_rgba(63,169,245,0.4)] animate-float-slow" style={{ animationDelay: '1s' }}></div>
                    </div>
                 </div>
              </div>
            </div>
            
            <h1 className="text-5xl font-black text-baccarim-text tracking-tighter leading-none">Baccarim</h1>
            <div className="flex items-center justify-center space-x-4 mt-4">
               <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-baccarim-text/10"></div>
               <span className="text-[10px] text-baccarim-blue/60 uppercase font-black tracking-[0.6em] whitespace-nowrap">Systems Cloud</span>
               <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-baccarim-text/10"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Usuário ou E-mail</label>
              <input 
                type="text" 
                required 
                autoComplete="username"
                value={user} 
                onChange={(e) => setUser(e.target.value)}
                placeholder="Identificação" 
                className="w-full bg-white/50 border border-baccarim-border rounded-2xl py-4 px-6 text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all placeholder:text-baccarim-text-subtle"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  autoComplete="current-password"
                  value={pass} 
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white/50 border border-baccarim-border rounded-2xl py-4 px-6 pr-14 text-baccarim-text outline-none focus:ring-2 focus:ring-baccarim-blue transition-all placeholder:text-baccarim-text-subtle"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-baccarim-text-muted hover:text-baccarim-text transition-colors p-2"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-4 px-4 rounded-2xl border border-red-500/20 animate-in shake duration-300">
                <i className="fas fa-circle-exclamation mr-2"></i>
                {error}
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-baccarim-green/20 to-baccarim-blue/20 border border-baccarim-border text-baccarim-text font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
              ENTRAR NO PORTAL
            </button>
          </form>
        </div>
        <div className="mt-10 flex flex-col items-center space-y-2 opacity-30">
          <p className="text-[9px] text-baccarim-text font-black uppercase tracking-[0.3em]">© 2026 Baccarim Engenharia</p>
          <div className="w-1 h-1 bg-baccarim-card rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

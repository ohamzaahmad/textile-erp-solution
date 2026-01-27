
import React, { useState } from 'react';
import { User, Role } from '../types';
import { authAPI } from '../api';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Real API Authentication
      await authAPI.login(username, password);
      const userData = await authAPI.getCurrentUser();
      
      // Map backend user data to frontend format
      const user: User = {
        username: userData.username,
        role: userData.role as Role,
        name: userData.name
      };
      
      onLogin(user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-[#7d2b3f] p-10 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
             
             <div className="w-20 h-20 bg-white rounded-2xl p-2 flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/20">
               <img src="/logo.svg" alt="HA Fabrics logo" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">HA FABRICS</h1>
             <p className="text-red-100 text-[10px] font-black uppercase tracking-[4px]">Enterprise ERP v2.0</p>
          </div>

          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold p-4 rounded-xl flex items-center animate-in fade-in slide-in-from-top-2">
                <i className="fas fa-exclamation-circle mr-3"></i> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
                <div className="relative">
                   <i className="fas fa-user absolute left-4 top-4 text-slate-300"></i>
                   <input 
                      type="text" 
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Enter username" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#7d2b3f] transition-all"
                   />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                   <i className="fas fa-lock absolute left-4 top-4 text-slate-300"></i>
                   <input 
                      type="password" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#7d2b3f] transition-all"
                   />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#7d2b3f] hover:bg-[#5a1f2d] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                <>Sign In to Workflow <i className="fas fa-arrow-right ml-3"></i></>
              )}
            </button>

            <div className="pt-6 text-center">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Forgot your credentials? Contact Admin</p>
            </div>
          </form>
        </div>
        
        <div className="mt-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-[3px]">
          Secure End-to-End Textile Management
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

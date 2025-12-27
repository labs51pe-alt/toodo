
import React, { useState } from 'react';
import { Key, ArrowRight, Loader2, BarChart3, CheckCircle2, ShieldCheck, Zap, Globe, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Empresa } from '../types';

interface Props {
  onLogin: (empresa: Empresa) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (code.toUpperCase() === 'MULTIFARMA') {
        const multifarmaEmpresa: Empresa = {
          id: 'multifarma-master',
          nombre_comercial: 'MULTIFARMA',
          codigo_acceso: 'MULTIFARMA',
          odoo_url: 'https://igp.facturaclic.pe/',
          odoo_db: 'igp_master',
          odoo_username: 'soporte@facturaclic.pe',
          odoo_api_key: '6d50304b768a9e09de0978cf46155769f9410809',
          color_primario: '#21B799',
          logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=MF&backgroundColor=21B799',
          use_proxy: true 
        };
        
        setTimeout(() => {
          onLogin(multifarmaEmpresa);
          setLoading(false);
        }, 1200);
        return;
      }

      if (code === 'Luis2021') {
        const { data: adminData } = await supabase
          .from('empresas')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (adminData) {
          onLogin({ ...adminData, use_proxy: true, color_primario: '#21B799' } as Empresa);
          return;
        }
      }

      const { data, error: sbError } = await supabase
        .from('empresas')
        .select('*')
        .eq('codigo_acceso', code)
        .single();

      if (sbError || !data) {
        setError('Acceso denegado. Verifique su código SaaS.');
      } else {
        onLogin({ ...data, use_proxy: true } as Empresa);
      }
    } catch (err) {
      setError('Error de enlace con el servidor SaaS.');
    } finally {
      if (code.toUpperCase() !== 'MULTIFARMA') setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Brand Section */}
      <div className="hidden lg:flex flex-1 bg-slate-50 relative items-center justify-center p-20 overflow-hidden border-r border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary rounded-full blur-[150px]"></div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-primary/20">
             <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-8 italic uppercase leading-tight">
            Toodo <br/> <span className="text-primary italic">Intelligence</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
            La plataforma SaaS de auditoría para Odoo ERP. Visualiza márgenes, rentabilidad y ventas de múltiples sedes en tiempo real.
          </p>
          
          <div className="grid grid-cols-2 gap-8">
             <div className="flex gap-4 items-start">
                <div className="p-3 bg-white rounded-xl shadow-sm text-primary"><Zap className="w-5 h-5" /></div>
                <div>
                   <p className="font-black text-slate-800 text-xs uppercase italic">Real-Time Sync</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Conexión con Odoo</p>
                </div>
             </div>
             <div className="flex gap-4 items-start">
                <div className="p-3 bg-white rounded-xl shadow-sm text-secondary"><Globe className="w-5 h-5" /></div>
                <div>
                   <p className="font-black text-slate-800 text-xs uppercase italic">Multi-Sede</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Gestión Centralizada</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="lg:hidden text-center mb-12">
             <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                <BarChart3 className="w-10 h-10 text-white" />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Toodo</h1>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 italic uppercase">Acceso Corporativo</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Ingrese su código de acceso SaaS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa / Código</label>
                {code.toUpperCase() === 'MULTIFARMA' && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase animate-pulse">
                    <CheckCircle2 className="w-3 h-3" /> Partner Certificado
                  </span>
                )}
              </div>
              <div className="relative group">
                <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: MULTIFARMA"
                  className="w-full bg-slate-50 border border-slate-100 text-slate-900 pl-14 pr-8 py-5 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300 font-black tracking-widest text-lg uppercase italic"
                  autoFocus
                />
              </div>
              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl flex items-center gap-3 animate-in shake duration-300">
                  <ShieldCheck className="w-4 h-4 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-slate-900/10 hover:bg-primary transition-all disabled:opacity-20 active:scale-95 group uppercase text-xs tracking-widest italic"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Acceder al Sistema <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-50">
             <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SaaS Audit v2.5 Protocol</p>
             </div>
             <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
               Este sistema es para uso autorizado exclusivamente. Toda actividad de auditoría es registrada para fines de cumplimiento corporativo.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

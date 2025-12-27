
import React, { useState } from 'react';
import { Key, ArrowRight, Loader2, BarChart3, CheckCircle2, ShieldCheck, Zap, Globe, Users, ShieldAlert } from 'lucide-react';
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
      // Logic for MULTIFARMA
      if (code.toUpperCase() === 'MULTIFARMA') {
        const multifarmaEmpresa: Empresa = {
          id: 'multifarma-master',
          nombre_comercial: 'MULTIFARMA',
          codigo_acceso: 'MULTIFARMA',
          odoo_url: 'https://igp.facturaclic.pe/',
          odoo_db: 'igp_master',
          odoo_username: 'soporte@facturaclic.pe',
          odoo_api_key: '6d50304b768a9e09de0978cf46155769f9410809',
          odoo_company_id: 1, // Asignado por el Super Admin
          color_primario: '#21B799',
          logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=MF&backgroundColor=21B799',
          use_proxy: true 
        };
        
        setTimeout(() => {
          onLogin(multifarmaEmpresa);
          setLoading(false);
        }, 800);
        return;
      }

      // Logic for Super Admin Luis
      if (code === 'Luis2021') {
        const adminEmpresa: Empresa = {
          id: 'admin-root',
          nombre_comercial: 'SUPER ADMIN TOODO',
          codigo_acceso: 'Luis2021',
          odoo_url: 'https://igp.facturaclic.pe/',
          odoo_db: 'igp_master',
          odoo_username: 'soporte@facturaclic.pe',
          odoo_api_key: '6d50304b768a9e09de0978cf46155769f9410809',
          color_primario: '#21B799',
          logo_url: '',
          use_proxy: true
        };
        onLogin(adminEmpresa);
        return;
      }

      // Normal SaaS User Login via Supabase
      const { data, error: sbError } = await supabase
        .from('empresas')
        .select('*')
        .eq('codigo_acceso', code)
        .single();

      if (sbError || !data) {
        setError('Acceso denegado. Código SaaS no registrado o inhabilitado.');
      } else {
        onLogin({ ...data, use_proxy: true } as Empresa);
      }
    } catch (err) {
      setError('Error de enlace con el servidor SaaS Toodo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans overflow-hidden">
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
            Toodo <br/> <span className="text-primary italic">Auditoría</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
            La plataforma SaaS de auditoría para Odoo ERP. Control total sobre múltiples sedes y compañías desde un solo lugar.
          </p>
          
          <div className="grid grid-cols-2 gap-8">
             <div className="flex gap-4 items-start">
                <div className="p-3 bg-white rounded-xl shadow-sm text-primary group-hover:scale-110 transition-transform"><Zap className="w-5 h-5" /></div>
                <div>
                   <p className="font-black text-slate-800 text-xs uppercase italic">Multi-Empresa</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Soporte Company ID</p>
                </div>
             </div>
             <div className="flex gap-4 items-start">
                <div className="p-3 bg-white rounded-xl shadow-sm text-secondary"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                   <p className="font-black text-slate-800 text-xs uppercase italic">Segregación</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Acceso Privado</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 italic uppercase">Acceso Corporativo</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Ingrese su código de acceso SaaS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código SaaS</label>
                {code.toUpperCase() === 'MULTIFARMA' && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cliente Activo
                  </span>
                )}
                {code === 'Luis2021' && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase">
                    <ShieldAlert className="w-3.5 h-3.5" /> Super Admin
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
                <div className="bg-red-50 text-red-500 p-5 rounded-2xl flex items-center gap-4 animate-in shake duration-300 border border-red-100">
                  <ShieldAlert className="w-6 h-6 text-red-500 opacity-80" />
                  <p className="text-[10px] font-black uppercase tracking-tight italic">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-slate-900/10 hover:bg-primary hover:text-slate-950 transition-all disabled:opacity-20 active:scale-95 group uppercase text-xs tracking-widest italic"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Verificar Credenciales <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-50 text-center">
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">SaaS Audit v2.6 Multi-Company Protocol</p>
             <div className="flex justify-center gap-6 grayscale opacity-30">
                <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;


import React, { useState, useEffect } from 'react';
import { X, Globe, Database, User, Key, ShieldCheck, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { Empresa } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (empresa: Partial<Empresa>) => void;
}

const OdooConfigModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState<Partial<Empresa>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lemon_empresa');
    if (stored) setConfig(JSON.parse(stored));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Intentar actualizar en Supabase si es un registro real
      if (config.id && !config.id.includes('multifarma')) {
        const { data, error } = await supabase
          .from('empresas')
          .update({
            odoo_url: config.odoo_url,
            odoo_db: config.odoo_db,
            odoo_username: config.odoo_username,
            odoo_api_key: config.odoo_api_key,
            odoo_company_id: config.odoo_company_id ? Number(config.odoo_company_id) : null,
            use_proxy: config.use_proxy
          })
          .eq('id', config.id)
          .select()
          .single();

        if (!error) {
          onSave(data);
          onClose();
          return;
        }
      }
      
      // Si falla o es local, guardar localmente
      onSave(config);
      onClose();
    } catch (err) {
      console.error(err);
      onSave(config);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/20">
        <div className="bg-slate-950 px-10 py-8 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary rounded-xl">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic">Toodo Sync</h2>
              <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Configuración Segura</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:rotate-90 transition-transform p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-3 h-3 text-secondary" /> URL del Servidor
            </label>
            <input
              type="text"
              value={config.odoo_url || ''}
              onChange={(e) => setConfig({...config, odoo_url: e.target.value})}
              placeholder="https://tu-odoo.com"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-secondary" /> Base de Datos
              </label>
              <input
                type="text"
                value={config.odoo_db || ''}
                onChange={(e) => setConfig({...config, odoo_db: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 className="w-3 h-3 text-secondary" /> ID Compañía
              </label>
              <input
                type="number"
                placeholder="Opcional"
                value={config.odoo_company_id || ''}
                onChange={(e) => setConfig({...config, odoo_company_id: e.target.value ? Number(e.target.value) : undefined})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3 text-secondary" /> Usuario
            </label>
            <input
              type="text"
              value={config.odoo_username || ''}
              onChange={(e) => setConfig({...config, odoo_username: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Key className="w-3 h-3 text-secondary" /> Token / API Key
            </label>
            <input
              type="password"
              value={config.odoo_api_key || ''}
              onChange={(e) => setConfig({...config, odoo_api_key: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold"
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-[1.5rem] border border-primary/10">
            <input
              type="checkbox"
              id="use_proxy"
              checked={!!config.use_proxy}
              onChange={(e) => setConfig({...config, use_proxy: e.target.checked})}
              className="w-5 h-5 accent-primary rounded-lg cursor-pointer"
            />
            <label htmlFor="use_proxy" className="text-[10px] font-black text-slate-700 cursor-pointer uppercase tracking-tight">
              Activar Túnel Proxy (CORS Bypass)
            </label>
          </div>
          
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-slate-950 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:bg-primary hover:text-slate-950 transition-all flex justify-center items-center group active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <span className="italic">Aplicar Cambios</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OdooConfigModal;

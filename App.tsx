
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Package, Settings, 
  Menu, X, Home, Database, Store, MapPin, 
  Calendar, CreditCard, LayoutDashboard, LogOut, ShoppingCart, RefreshCcw,
  Filter, PieChart, Tag, Layers, Search, Download, Clock, AlertCircle,
  Users, Briefcase, Plus, Edit, Trash2, Sparkles, ChevronRight, Layout, Monitor
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, Legend, LineChart, Line
} from 'recharts';
import { supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import OdooConfigModal from './components/OdooConfigModal';
import AIAnalysis from './components/AIAnalysis';
import { OdooService } from './services/odooService';
// Removed POSStats from import as it is not exported from types.ts
import { Empresa, ReporteCierre, KPIStats, ProductoVendido, SedeStats } from './types';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [reportes, setReportes] = useState<ReporteCierre[]>([]);
  const [topProductsReal, setTopProductsReal] = useState<ProductoVendido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date Filtering States
  const [dateFilter, setDateFilter] = useState<'hoy' | 'mes' | 'personalizado'>('mes');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const stored = localStorage.getItem('lemon_empresa');
    const adminMode = localStorage.getItem('toodo_admin') === 'true';
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEmpresa(parsed);
        setIsAdmin(adminMode);
      } catch (e) {
        localStorage.removeItem('lemon_empresa');
      }
    }
  }, []);

  useEffect(() => {
    if (empresa) {
      localStorage.setItem('lemon_empresa', JSON.stringify(empresa));
      localStorage.setItem('toodo_admin', isAdmin.toString());
      fetchData();
    }
  }, [empresa, isAdmin, dateFilter, customRange]);

  const fetchData = async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    let startDate: string | undefined;
    let endDate: string | undefined;

    const now = new Date();
    if (dateFilter === 'hoy') {
      const today = now.toISOString().split('T')[0];
      startDate = `${today} 00:00:00`;
      endDate = `${today} 23:59:59`;
    } else if (dateFilter === 'mes') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      startDate = `${firstDay} 00:00:00`;
    } else if (dateFilter === 'personalizado' && customRange.start && customRange.end) {
      startDate = `${customRange.start} 00:00:00`;
      endDate = `${customRange.end} 23:59:59`;
    }

    try {
      const odoo = new OdooService(empresa);
      await odoo.authenticate();
      
      const [realOrders, realProducts] = await Promise.all([
        odoo.getPosOrders(500, startDate, endDate),
        odoo.getTopProducts(startDate, endDate)
      ]);
      
      setReportes(realOrders || []);
      setTopProductsReal(realProducts || []);
      
      if (realOrders.length === 0) {
        setError(`No se encontraron ventas para el periodo: ${dateFilter === 'mes' ? 'Este Mes' : dateFilter === 'hoy' ? 'Hoy' : 'Rango Personalizado'}`);
      }
    } catch (err: any) {
      console.error("Critical Sync Error:", err);
      setError(err.message || "Error inesperado al conectar con Odoo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (emp: Empresa) => {
    setEmpresa(emp);
    setIsAdmin(emp.codigo_acceso === 'Luis2021');
  };

  const logout = () => {
    localStorage.removeItem('lemon_empresa');
    localStorage.removeItem('toodo_admin');
    setEmpresa(null);
    setIsAdmin(false);
  };

  const kpis = useMemo<KPIStats>(() => {
    const totalV = reportes.reduce((s, r) => s + Number(r.total_ventas), 0);
    const totalC = reportes.reduce((s, r) => s + Number(r.total_costo || 0), 0);
    const totalT = reportes.length;
    return {
      totalVentas: totalV,
      totalCosto: totalC,
      totalMargen: totalV - totalC,
      unidades: totalT,
      ticketPromedio: totalT > 0 ? totalV / totalT : 0
    };
  }, [reportes]);

  const sedeStats = useMemo<SedeStats[]>(() => {
    const map: Record<string, { v: number, m: number, t: number }> = {};
    reportes.forEach(r => {
      const name = r.pos_name || 'Sin Caja';
      if (!map[name]) map[name] = { v: 0, m: 0, t: 0 };
      map[name].v += r.total_ventas;
      map[name].m += (r.total_ventas - r.total_costo);
      map[name].t += 1;
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      ventas: data.v,
      margenPct: Number(((data.m / data.v) * 100).toFixed(1)),
      transacciones: data.t
    })).sort((a, b) => b.ventas - a.ventas);
  }, [reportes]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    reportes.forEach(r => {
      const day = new Date(r.fecha_reporte).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      grouped[day] = (grouped[day] || 0) + r.total_ventas;
    });
    return Object.entries(grouped).map(([name, v]) => ({ name, ventas: v })).reverse();
  }, [reportes]);

  if (!empresa) return <LoginScreen onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <OdooConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={(updated) => setEmpresa({ ...empresa, ...updated } as Empresa)}
      />

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-slate-900 font-black text-xl tracking-tighter uppercase italic">Toodo</h1>
              <p className="text-primary text-[9px] font-black uppercase tracking-widest">SaaS Analytics</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-4 mt-4">Análisis Real-Time</p>
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'cajas', icon: Monitor, label: 'Puntos de Venta' },
              { id: 'productos', icon: Tag, label: 'Ranking Odoo' },
              { id: 'reportes', icon: Calendar, label: 'Historial Odoo' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  activeView === item.id 
                    ? 'bg-primary/10 text-primary font-black' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
             <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 rounded-xl transition-colors font-bold text-sm">
                <LogOut className="w-4 h-4" /> Salir del Sistema
              </button>
          </div>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : ''}`}>
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-slate-100 rounded-xl lg:hidden text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">
                {activeView === 'cajas' ? 'Control de Cajas' : empresa.nombre_comercial}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-accent animate-spin' : error ? 'bg-red-500' : 'bg-primary'}`}></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                   {loading ? 'Sincronizando...' : error ? 'Error Detectado' : `Conectado: ${empresa.odoo_db}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Pill */}
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl gap-1">
              {['hoy', 'mes', 'personalizado'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    dateFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f === 'mes' ? 'Este Mes' : f}
                </button>
              ))}
            </div>

            {dateFilter === 'personalizado' && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                <input 
                  type="date" 
                  className="text-[10px] font-bold border rounded-lg px-2 py-1.5 outline-none focus:ring-1 ring-primary"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                />
                <input 
                  type="date" 
                  className="text-[10px] font-bold border rounded-lg px-2 py-1.5 outline-none focus:ring-1 ring-primary"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                />
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            
            <button onClick={() => setIsConfigOpen(true)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-primary transition-all shadow-sm">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={fetchData} className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform active:scale-95">
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="p-8 lg:p-12 space-y-10 max-w-[1400px] mx-auto">
          {error && (
             <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600 animate-in slide-in-from-top-4 duration-500">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1">
                   <p className="font-black text-xs uppercase tracking-widest mb-1">Estado de Sincronización</p>
                   <p className="text-sm font-bold opacity-80 leading-snug">{error}</p>
                </div>
                <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700">Reintentar</button>
             </div>
          )}

          {activeView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><DollarSign className="w-12 h-12" /></div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Ventas Brutas</p>
                  <h3 className="text-3xl font-black tracking-tighter text-slate-900">S/ {kpis.totalVentas.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center gap-1.5 text-primary font-black text-[10px] uppercase">
                    <Database className="w-3.5 h-3.5" /> Odoo Real-Time
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Margen Neto Est.</p>
                  <h3 className="text-3xl font-black tracking-tighter text-accent italic">S/ {kpis.totalMargen.toLocaleString()}</h3>
                  <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">35% Rentabilidad</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Cajas Activas</p>
                  <h3 className="text-3xl font-black tracking-tighter text-slate-900">{sedeStats.length}</h3>
                  <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase">Puntos detectados</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Ticket Promedio</p>
                  <h3 className="text-3xl font-black tracking-tighter text-secondary">S/ {kpis.ticketPromedio.toFixed(2)}</h3>
                  <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase">Transacciones: {reportes.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">Curva de Ventas</h4>
                        <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase text-slate-400">Diario</span>
                      </div>
                      <div className="h-[350px]">
                        {reportes.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#21B799" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#21B799" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', fontSize: '10px' }} 
                                cursor={{ stroke: '#21B799', strokeWidth: 2 }}
                              />
                              <Area type="monotone" dataKey="ventas" stroke="#21B799" strokeWidth={3} fillOpacity={1} fill="url(#vGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <Monitor className="w-12 h-12 opacity-20" />
                            <p className="font-black uppercase text-[10px] italic tracking-widest">Esperando datos de Odoo...</p>
                          </div>
                        )}
                      </div>
                   </div>
                   
                   <AIAnalysis kpis={kpis} sedes={sedeStats} />
                </div>

                <div className="space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                     <h4 className="text-xl font-black text-slate-800 tracking-tighter mb-8 uppercase italic">Top Cajas</h4>
                     <div className="space-y-6">
                       {sedeStats.slice(0, 5).map((sede, i) => (
                         <div key={i} className="group cursor-default">
                            <div className="flex justify-between items-center mb-2">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                                    <Monitor className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-black text-slate-700 uppercase truncate max-w-[120px]">{sede.name}</span>
                               </div>
                               <span className="text-xs font-black text-slate-900">S/ {sede.ventas.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                               <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${(sede.ventas / (sedeStats[0]?.ventas || 1)) * 100}%` }}></div>
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                     <h4 className="text-lg font-black tracking-tighter mb-4 uppercase italic">SaaS Status</h4>
                     <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b border-white/10 pb-3">
                           <span>Odoo API</span>
                           <span className={error ? "text-red-500 font-black" : "text-primary font-black"}>{error ? "OFFLINE" : "STABLE"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                           <span>DB Master</span>
                           <span className="text-white/60 font-black">{empresa.odoo_db}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                           <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-2">Sincronización</p>
                           <div className="flex gap-1">
                              {[1,2,3,4,5,6].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 5 ? 'bg-primary' : 'bg-white/10'}`}></div>)}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'cajas' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-end justify-between">
                  <div>
                     <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Rendimiento por Caja</h3>
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Métricas individuales y rentabilidad operativa</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {sedeStats.map((sede, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group">
                       <div className="flex items-start justify-between mb-8">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                <Monitor className="w-7 h-7" />
                             </div>
                             <div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">{sede.name}</h4>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Odoo POS Config</span>
                             </div>
                          </div>
                          <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             ID: {i + 1}
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-slate-50 p-5 rounded-2xl">
                             <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Ventas Totales</p>
                             <p className="text-xl font-black text-slate-900 tracking-tighter">S/ {sede.ventas.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 p-5 rounded-2xl">
                             <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Margen Est.</p>
                             <p className="text-xl font-black text-primary tracking-tighter">{sede.margenPct}%</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                             <span>Actividad Comercial</span>
                             <span className="text-slate-900">{sede.transacciones} Órdenes</span>
                          </div>
                          <div className="h-12 flex items-end gap-1">
                             {[...Array(12)].map((_, j) => (
                               <div 
                                 key={j} 
                                 className="flex-1 bg-slate-100 rounded-sm group-hover:bg-primary/20 transition-all" 
                                 style={{ height: `${20 + Math.random() * 80}%` }}
                               ></div>
                             ))}
                          </div>
                       </div>

                       <button className="w-full mt-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 group/btn">
                          Detalle de Auditoría <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeView === 'productos' && (
            <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">Top Artículos (Odoo)</h3>
                  <div className="flex gap-2">
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-colors"><Download className="w-4 h-4" /></button>
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-colors"><Search className="w-4 h-4" /></button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">
                        <th className="pb-4">Producto</th>
                        <th className="pb-4 text-center">Qty Vendida</th>
                        <th className="pb-4 text-right">Monto Bruto</th>
                        <th className="pb-4 text-right pr-4">Utilidad Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {topProductsReal.length > 0 ? topProductsReal.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-6 font-black text-slate-800 text-lg flex items-center gap-4">
                             <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors"><Package className="w-5 h-5" /></div>
                             {p.nombre}
                          </td>
                          <td className="py-6 text-center font-bold text-slate-500">{p.cantidad.toLocaleString()}</td>
                          <td className="py-6 text-right font-black text-slate-900 italic">S/ {p.total_venta.toLocaleString()}</td>
                          <td className="py-6 text-right pr-4 font-black text-primary">S/ {p.margen.toLocaleString()}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest">No se encontraron datos para el periodo seleccionado</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
          
          {activeView === 'reportes' && (
             <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase mb-12">Historial de Órdenes POS</h3>
                <div className="space-y-4">
                   {reportes.slice(0, 50).map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-sm group">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                               <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="font-black text-slate-900 text-sm uppercase italic">{r.pos_name}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(r.fecha_reporte).toLocaleString('es-PE')}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-black text-slate-900 tracking-tighter">S/ {r.total_ventas.toLocaleString()}</p>
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Pagado / Odoo Sync</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;

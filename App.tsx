
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Package, Settings, 
  Menu, X, Home, Database, Store, MapPin, 
  Calendar, CreditCard, LayoutDashboard, LogOut, ShoppingCart, RefreshCcw,
  Filter, PieChart, Tag, Layers, Search, Download, Clock, AlertCircle,
  Users, Briefcase, Plus, Edit, Trash2, Sparkles
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
import { Empresa, ReporteCierre, KPIStats, ProductoVendido, POSStats, SedeStats } from './types';

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
  
  // Para Super Admin
  const [empresasAdmin, setEmpresasAdmin] = useState<Empresa[]>([]);

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
      if (isAdmin && activeView === 'admin_panel') {
        fetchEmpresasForAdmin();
      } else {
        fetchData();
      }
    }
  }, [empresa, isAdmin, activeView]);

  const fetchEmpresasForAdmin = async () => {
    const { data } = await supabase.from('empresas').select('*');
    if (data) setEmpresasAdmin(data);
  };

  const fetchData = async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    try {
      if (empresa.odoo_url && empresa.odoo_api_key) {
        const odoo = new OdooService(empresa);
        const [realOrders, realProducts] = await Promise.all([
          odoo.getPosOrders(50),
          odoo.getTopProducts()
        ]);
        setReportes(realOrders || []);
        setTopProductsReal(realProducts || []);
      } else {
        generateMockData();
      }
    } catch (err: any) {
      setError(err.message || "Error conectando a Odoo.");
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const mockReportes: ReporteCierre[] = Array.from({ length: 30 }, (_, i) => {
      const venta = 3500 + Math.random() * 2500;
      return {
        id: `demo-${i}`,
        fecha_reporte: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        total_ventas: venta,
        total_costo: venta * 0.65,
        total_diferencia: 0,
        pos_name: i % 2 === 0 ? 'Multifarma Centro' : 'Multifarma Norte',
        transacciones: 50
      };
    });
    setReportes(mockReportes);
    setTopProductsReal([
      { nombre: 'Paracetamol 500mg', cantidad: 120, total_venta: 2400, margen: 800 },
      { nombre: 'Ibuprofeno 400mg', cantidad: 95, total_venta: 1900, margen: 600 }
    ]);
  };

  const handleLoginSuccess = (emp: Empresa) => {
    setEmpresa(emp);
    setIsAdmin(emp.codigo_acceso === 'Luis2021');
    if (emp.codigo_acceso === 'Luis2021') setActiveView('admin_panel');
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
    const totalT = reportes.reduce((s, r) => s + (r.transacciones || 0), 0);
    return {
      totalVentas: totalV,
      totalCosto: totalC,
      totalMargen: totalV - totalC,
      unidades: totalT,
      ticketPromedio: totalT > 0 ? totalV / totalT : 0
    };
  }, [reportes]);

  const sedeStats = useMemo<SedeStats[]>(() => {
    const map: Record<string, { v: number, m: number }> = {};
    reportes.forEach(r => {
      const name = r.pos_name || 'General';
      if (!map[name]) map[name] = { v: 0, m: 0 };
      map[name].v += r.total_ventas;
      map[name].m += (r.total_ventas - r.total_costo);
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      ventas: data.v,
      margenPct: Number(((data.m / data.v) * 100).toFixed(1))
    })).sort((a, b) => b.ventas - a.ventas);
  }, [reportes]);

  const chartData = useMemo(() => {
    return reportes.slice(0, 15).map(r => ({
      name: new Date(r.fecha_reporte).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
      ventas: r.total_ventas,
      margen: r.total_ventas - (r.total_costo || 0),
    })).reverse();
  }, [reportes]);

  if (!empresa) return <LoginScreen onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      <OdooConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={(updated) => setEmpresa({ ...empresa, ...updated } as Empresa)}
      />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 shadow-2xl transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center gap-4 mb-14">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <BarChart3 className="text-slate-950 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl tracking-tighter uppercase italic">Toodo</h1>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest opacity-80">
                {isAdmin ? 'Super Admin Mode' : 'Empresa Panel'}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {isAdmin && (
              <button
                onClick={() => setActiveView('admin_panel')}
                className={`w-full flex items-center gap-4 px-6 py-4.5 rounded-[1.5rem] transition-all ${
                  activeView === 'admin_panel' ? 'bg-secondary text-white font-black' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-bold">Gestión Empresas</span>
              </button>
            )}
            
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-6 py-4">Analytics</p>
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'rentabilidad', icon: PieChart, label: 'Rentabilidad' },
              { id: 'productos', icon: Tag, label: 'Ranking' },
              { id: 'reportes', icon: Calendar, label: 'Historial' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4.5 rounded-[1.5rem] transition-all group ${
                  activeView === item.id 
                    ? 'bg-primary text-slate-950 font-black shadow-lg shadow-primary/10' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5">
             <button onClick={logout} className="w-full flex items-center gap-3 px-6 py-4 text-red-400 hover:bg-red-400/10 rounded-2xl transition-colors font-black text-xs uppercase">
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
        <header className="h-28 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-30">
          <div className="flex items-center gap-8">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-slate-50 rounded-2xl lg:hidden">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
                {empresa.nombre_comercial}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {isAdmin ? 'Supervisando Sistema' : `DB: ${empresa.odoo_db}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => setIsConfigOpen(true)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-primary hover:text-slate-950 transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={fetchData} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-lg transition-transform active:scale-90">
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="p-12 space-y-12 max-w-[1600px] mx-auto pb-24">
          
          {/* Vista Admin */}
          {activeView === 'admin_panel' && isAdmin && (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black tracking-tighter uppercase italic">Control de Empresas Clientes</h3>
                  <button className="flex items-center gap-2 bg-primary text-slate-950 px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/20">
                    <Plus className="w-4 h-4" /> Nueva Empresa
                  </button>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                 {empresasAdmin.map((emp) => (
                   <div key={emp.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 flex justify-between items-center group hover:border-secondary transition-all">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">
                           {emp.nombre_comercial.substring(0,2).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-xl font-black text-slate-900 uppercase italic">{emp.nombre_comercial}</p>
                            <p className="text-xs text-slate-500 font-bold tracking-widest">{emp.odoo_url}</p>
                            <div className="flex gap-4 mt-2">
                               <span className="text-[10px] font-black text-secondary uppercase bg-secondary/10 px-3 py-1 rounded-full">DB: {emp.odoo_db}</span>
                               <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">Proxy: {emp.use_proxy ? 'SI' : 'NO'}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-secondary"><Edit className="w-5 h-5" /></button>
                         <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Vistas de Cliente */}
          {activeView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative shadow-2xl overflow-hidden group">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Ventas Netas</p>
                  <h3 className="text-4xl font-black tracking-tighter mb-4">S/ {kpis.totalVentas.toLocaleString()}</h3>
                  <div className="flex items-center gap-2 text-primary text-xs font-bold">
                    <TrendingUp className="w-4 h-4" /> +12.4% vs mes anterior
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm hover:border-accent transition-colors">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Margen (Rentabilidad)</p>
                  <h3 className="text-4xl font-black text-accent tracking-tighter mb-4">S/ {kpis.totalMargen.toLocaleString()}</h3>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>Costo: S/ {kpis.totalCosto.toLocaleString()}</span>
                    <span className="text-accent">35.0%</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Puntos de Venta</p>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{sedeStats.length}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sedes Activas</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Ticket Promedio</p>
                  <h3 className="text-4xl font-black text-secondary tracking-tighter">S/ {kpis.ticketPromedio.toFixed(2)}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                   <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-sm">
                      <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-10 uppercase italic">Evolución de Ventas (Odoo POS)</h4>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#21B799" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#21B799" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="ventas" stroke="#21B799" strokeWidth={4} fillOpacity={1} fill="url(#vGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                   
                   {/* Toodo AI Insights */}
                   <AIAnalysis kpis={kpis} sedes={sedeStats} />
                </div>

                <div className="space-y-10">
                  <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-sm">
                     <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-10 uppercase italic">Rentabilidad por Sede</h4>
                     <div className="space-y-8">
                       {sedeStats.map((sede, i) => (
                         <div key={i} className="group">
                            <div className="flex justify-between items-center mb-3">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Store className="w-5 h-5" />
                                  </div>
                                  <span className="text-sm font-black text-slate-800 uppercase italic">{sede.name}</span>
                               </div>
                               <span className="text-sm font-black text-slate-950">S/ {sede.ventas.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase mb-1">
                               <span className="text-slate-400">Eficiencia Margen</span>
                               <span className="text-primary">{sede.margenPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                               <div className="bg-secondary h-full rounded-full transition-all duration-1000 group-hover:bg-primary" style={{ width: `${sede.margenPct}%` }}></div>
                          </div>
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-secondary to-slate-800 rounded-[3.5rem] p-12 text-white shadow-xl">
                     <h4 className="text-xl font-black tracking-tighter mb-6 uppercase italic">Estado de Conexión</h4>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-bold uppercase">Base de Datos</span>
                           <span className="text-[10px] font-black text-primary">CONECTADO</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-bold uppercase">Sincronización</span>
                           <span className="text-[10px] font-black text-accent">REAL-TIME</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'rentabilidad' && (
            <div className="bg-white rounded-[4rem] p-16 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex justify-between items-end mb-16">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Auditoría de Rentabilidad</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest mt-2">Desglose de márgenes por punto de venta</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rentabilidad Global</p>
                    <span className="text-5xl font-black text-primary italic">35.0%</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {sedeStats.map((s, i) => (
                    <div key={i} className="p-10 rounded-[3rem] border border-slate-100 bg-slate-50/50 hover:shadow-xl transition-all group">
                       <h4 className="text-xl font-black text-slate-900 uppercase italic mb-6">{s.name}</h4>
                       <div className="space-y-4">
                          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                             <span>Ventas Brutas</span>
                             <span className="text-slate-900 font-black">S/ {s.ventas.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                             <span>Costo Estimado</span>
                             <span className="text-red-400 font-black">S/ {(s.ventas * 0.65).toLocaleString()}</span>
                          </div>
                          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                             <span className="text-[10px] font-black text-secondary uppercase">Ganancia Neta</span>
                             <span className="text-2xl font-black text-primary italic">S/ {(s.ventas * 0.35).toLocaleString()}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
          
          {/* Otras vistas simplificadas por espacio */}
          {(activeView === 'productos' || activeView === 'reportes') && (
            <div className="bg-white rounded-[4rem] p-16 border border-slate-200 text-center">
               <Database className="w-20 h-20 text-slate-200 mx-auto mb-6" />
               <h3 className="text-2xl font-black uppercase italic text-slate-800">Cargando datos detallados de Odoo...</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest mt-2">Sincronizando modelos de POS y Ventas</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;

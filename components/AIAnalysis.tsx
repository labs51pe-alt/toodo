
import React, { useState } from 'react';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { analyzeBusinessData } from '../services/geminiService';
import { KPIStats, SedeStats } from '../types';

interface Props {
  kpis: KPIStats;
  sedes: SedeStats[];
}

const AIAnalysis: React.FC<Props> = ({ kpis, sedes }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeBusinessData(kpis, sedes);
    setAnalysis(result || "No se pudo obtener el análisis.");
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-110"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-primary to-secondary rounded-[1.5rem] shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Toodo AI Insights</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Análisis Inteligente Predictivo</p>
          </div>
        </div>
        
        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase hover:bg-primary hover:text-slate-950 transition-all disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>Generar Reporte <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {analysis ? (
        <div className="prose prose-slate max-w-none bg-slate-50 p-10 rounded-[2rem] border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">
            {analysis}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4 opacity-30" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Utiliza el poder de Gemini 2.5 Flash para potenciar tu negocio</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;

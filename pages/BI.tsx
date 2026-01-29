import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { 
  BrainCircuit, MapPin, Smile, Target, Sparkles, Loader2 
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { supabase } from '../lib/supabase';

const COLORS = ['#2A8CB4', '#79954C', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function BI() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: responses, error } = await supabase
        .from('responses')
        .select('*');

      if (error) throw error;

      // Mock aggregation for demo purposes
      const processedData = {
        satisfaction: [
            { name: 'Promotores', value: 65 },
            { name: 'Neutros', value: 25 },
            { name: 'Detratores', value: 10 }
        ],
        origins: [
            { name: 'SP', value: 120 },
            { name: 'SE', value: 300 },
            { name: 'BA', value: 80 },
            { name: 'AL', value: 60 },
            { name: 'RJ', value: 40 },
        ],
        radar: [
            { subject: 'Segurança', A: 120, fullMark: 150 },
            { subject: 'Limpeza', A: 98, fullMark: 150 },
            { subject: 'Sinalização', A: 86, fullMark: 150 },
            { subject: 'Preços', A: 99, fullMark: 150 },
            { subject: 'Hospitalidade', A: 85, fullMark: 150 },
            { subject: 'Atrativos', A: 65, fullMark: 150 },
        ]
      };

      setData(processedData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
      if (!data) return;
      setLoadingInsights(true);
      const summary = {
          npsDistribution: data.satisfaction,
          geographicData: data.origins,
          aspectRatings: data.radar
      };
      const result = await geminiService.getBIInsights(summary);
      setInsights(result);
      setLoadingInsights(false);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#2A8CB4]" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-4">Carregando Inteligência...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
       <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Business Intelligence</h2>
          <p className="text-slate-400 font-medium mt-1">Indicadores avançados e análise preditiva.</p>
        </div>
        <button 
            onClick={handleGenerateInsights}
            disabled={loadingInsights}
            className="bg-[#2A8CB4] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-sky-100 hover:bg-[#1a6b8a] transition-all flex items-center gap-2"
        >
            {loadingInsights ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
            Análise IA Gemini
        </button>
      </header>

      {insights && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl"><Sparkles size={24}/></div>
                      <h3 className="text-2xl font-bold">Insights Estratégicos</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                      <p className="text-indigo-100 leading-relaxed whitespace-pre-wrap">{insights}</p>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Smile size={20} className="text-emerald-500" /> Distribuição de Satisfação (NPS)
                  </h3>
              </div>
              <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie 
                              data={data.satisfaction} 
                              cx="50%" cy="50%" 
                              innerRadius={60} 
                              outerRadius={100} 
                              paddingAngle={5} 
                              dataKey="value"
                          >
                              {data.satisfaction.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip 
                              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} 
                          />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                  {data.satisfaction.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                          {item.name}
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Target size={20} className="text-rose-500" /> Avaliação por Aspectos
                  </h3>
              </div>
              <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                          <Radar name="Avaliação" dataKey="A" stroke="#F59E0B" strokeWidth={3} fill="#F59E0B" fillOpacity={0.3} />
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <MapPin size={20} className="text-[#2A8CB4]" /> Origem dos Visitantes (Top 5 Estados)
                  </h3>
              </div>
              <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.origins} layout="vertical" margin={{left: 20}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600}} width={40} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                          <Bar dataKey="value" fill="#2A8CB4" radius={[0, 10, 10, 0]} barSize={30}>
                              {data.origins.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
          
      </div>
    </div>
  );
}
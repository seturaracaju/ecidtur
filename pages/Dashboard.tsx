import React, { useEffect, useState, useContext } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardCheck, ShieldAlert, Timer, FileText, TrendingUp, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../App';

const KpiCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 group hover:scale-[1.02] transition-all duration-500">
    <div className="flex items-start justify-between mb-6">
      <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shrink-0`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full shrink-0 ${trend.includes('+') ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
          <TrendingUp size={14} />
          {trend}
        </span>
      )}
    </div>
    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h4>
  </div>
);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalResponses: 0,
    activeForms: 0,
    fraudAlerts: 0,
    avgTime: '0m 0s'
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [researcherStats, setResearcherStats] = useState({
    total: 0,
    goal: 500 // Meta exemplo
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Total de Respostas
      const { count: responsesCount, data: responses } = await supabase
        .from('responses')
        .select('created_at, duration_seconds, surveyor_id', { count: 'exact' });

      // 2. Formulários Ativos
      const { count: formsCount } = await supabase
        .from('forms')
        .select('id', { count: 'exact' })
        .eq('status', 'Ativo');

      // 3. Alertas de Fraude Pendentes/Confirmados
      const { count: fraudsCount } = await supabase
        .from('fraud_alerts')
        .select('id', { count: 'exact' })
        .in('status', ['pending', 'confirmed']);

      // 4. Calcular Tempo Médio
      let avgSeconds = 0;
      if (responses && responses.length > 0) {
        const totalDuration = responses.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
        // Filtra respostas com duração 0 para não distorcer a média se houver erros
        const validDurations = responses.filter(r => r.duration_seconds > 0).length;
        if (validDurations > 0) {
          avgSeconds = Math.round(totalDuration / validDurations);
        }
      }
      const avgTimeStr = `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`;

      // 5. Preparar Dados do Gráfico (Últimos 7 dias)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const dailyData = last7Days.map(date => {
        const count = responses?.filter(r => r.created_at.startsWith(date)).length || 0;
        const dayName = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
        return { name: dayName.charAt(0).toUpperCase() + dayName.slice(1), coletas: count, date };
      });

      // 6. Dados do Pesquisador Logado
      let myColetas = 0;
      if (user && responses) {
        myColetas = responses.filter(r => r.surveyor_id === user.id).length;
      }

      setKpis({
        totalResponses: responsesCount || 0,
        activeForms: formsCount || 0,
        fraudAlerts: fraudsCount || 0,
        avgTime: avgTimeStr
      });
      setChartData(dailyData);
      setResearcherStats({ total: myColetas, goal: 500 });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2A8CB4]" size={40} />
      </div>
    );
  }

  // Calculo de porcentagem da meta
  const metaPct = Math.min(Math.round((researcherStats.total / researcherStats.goal) * 100), 100);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Painel Estratégico</h2>
          <p className="text-slate-400 font-medium mt-1">Acompanhe as coletas e inteligência em tempo real.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={fetchDashboardData} className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
            Atualizar Dados
          </button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard 
          label="Total de Respostas" 
          value={kpis.totalResponses.toLocaleString('pt-BR')} 
          icon={ClipboardCheck} 
          color="bg-[#2A8CB4]" 
          // Trend mockado, ideal seria comparar com semana anterior
          trend="+100% vs ontem" 
        />
        <KpiCard 
          label="Formulários Ativos" 
          value={kpis.activeForms} 
          icon={FileText} 
          color="bg-[#79954C]" 
        />
        <KpiCard 
          label="Alertas de Fraude" 
          value={kpis.fraudAlerts} 
          icon={ShieldAlert} 
          color="bg-red-500" 
          trend={kpis.fraudAlerts > 0 ? "Atenção" : "Seguro"} 
        />
        <KpiCard 
          label="T. Médio Resposta" 
          value={kpis.avgTime} 
          icon={Timer} 
          color="bg-amber-500" 
        />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 min-h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Fluxo de Coletas</h3>
              <p className="text-slate-400 text-sm font-medium">Volume de respostas nos últimos 7 dias</p>
            </div>
            <select className="bg-slate-50 border-none outline-none px-4 py-2 rounded-xl text-slate-500 text-sm font-bold cursor-pointer">
              <option>Esta Semana</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorColetas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2A8CB4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2A8CB4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}}
                  itemStyle={{color: '#2A8CB4', fontWeight: 700}}
                />
                <Area 
                  type="monotone" 
                  dataKey="coletas" 
                  stroke="#2A8CB4" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorColetas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Researcher Highlight */}
        <div className="bg-[#79954C] p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between text-white relative overflow-hidden h-full min-h-[500px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tight">Sua Meta Pessoal</h3>
            <p className="text-emerald-50 text-sm font-medium mt-1">Status atual como pesquisador</p>
          </div>
          
          <div className="relative z-10 my-12 text-center">
            <div className="inline-flex items-center justify-center p-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <Users size={64} className="text-white" />
            </div>
            <h4 className="text-5xl font-extrabold">{metaPct}%</h4>
            <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs mt-2">{metaPct >= 100 ? 'Meta Atingida!' : 'Em progresso'}</p>
          </div>

          <div className="relative z-10 space-y-4">
             <div className="flex justify-between text-sm font-bold">
               <span>Coletas Realizadas</span>
               <span>{researcherStats.total} / {researcherStats.goal}</span>
             </div>
             <div className="h-3 bg-white/20 rounded-full overflow-hidden">
               <div className="h-full bg-white rounded-full shadow-lg transition-all duration-1000" style={{ width: `${metaPct}%` }}></div>
             </div>
             <p className="text-[10px] text-emerald-100 uppercase font-bold text-center tracking-widest pt-2">
               {researcherStats.total >= researcherStats.goal ? 'Parabéns!' : `Faltam ${researcherStats.goal - researcherStats.total} respostas`}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
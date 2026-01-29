import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, Fingerprint, Clock, CheckCircle, XCircle, 
  Search, Filter, ChevronDown, Loader2, RefreshCw, BarChart3, Activity,
  MapPin, Smartphone, Zap, Eye, Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

// Helper para formatar data
const formatDate = (dateString: string) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
  }).format(date);
};

export default function FraudDetection() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<'pending' | 'confirmed' | 'dismissed'>('pending');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // KPIs
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    dismissed: 0,
    critical: 0
  });

  useEffect(() => {
    fetchAlerts();
  }, [filterStatus]); // Recarrega quando muda a aba principal

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // 1. Buscar Alertas com Join em Responses e Forms
      let query = supabase
        .from('fraud_alerts')
        .select(`
          *,
          responses (
            id,
            duration_seconds,
            lat,
            lng,
            created_at,
            metadata
          ),
          forms (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus) {
         // Mapeamento de status do front para o banco se necessário, ou uso direto
         // pending, confirmed, dismissed
         query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setAlerts(data || []);
      calculateStats();

    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    // Busca contagem rápida para os KPIs (independente do filtro atual da lista)
    const { data } = await supabase.from('fraud_alerts').select('status, severity');
    if (data) {
      setStats({
        pending: data.filter(a => a.status === 'pending').length,
        confirmed: data.filter(a => a.status === 'confirmed').length,
        dismissed: data.filter(a => a.status === 'dismissed').length,
        critical: data.filter(a => a.severity === 'critical' || a.severity === 'high').length
      });
    }
  };

  const handleResolveAlert = async (id: string, newStatus: 'confirmed' | 'dismissed') => {
    setProcessingId(id);
    try {
      // 1. Atualiza o alerta
      const { error } = await supabase
        .from('fraud_alerts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // 2. Opcional: Atualizar o status da resposta associada
      // Se for confirmado fraude -> response.status = 'rejected'
      // Se for descartado -> response.status = 'verified'
      const alert = alerts.find(a => a.id === id);
      if (alert && alert.response_id) {
         const responseStatus = newStatus === 'confirmed' ? 'rejected' : 'verified';
         await supabase.from('responses').update({ status: responseStatus }).eq('id', alert.response_id);
      }

      // 3. Atualiza UI localmente para feedback instantâneo
      setAlerts(prev => prev.filter(a => a.id !== id));
      
      // Atualiza KPIs
      calculateStats();

    } catch (err) {
      console.error('Erro ao resolver alerta:', err);
      alert('Erro ao processar ação.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtragem local (Busca e Severidade)
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.forms?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;

    return matchesSearch && matchesSeverity;
  });

  // Ícones e Cores por Tipo
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'fast_response': return { icon: Zap, label: 'Resposta Rápida Demais', color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'duplicate_ip': return { icon: Smartphone, label: 'IP Duplicado', color: 'text-orange-500', bg: 'bg-orange-50' };
      case 'pattern_match': return { icon: Activity, label: 'Padrão Repetitivo', color: 'text-red-500', bg: 'bg-red-50' };
      case 'location_mismatch': return { icon: MapPin, label: 'Localização Distante', color: 'text-purple-500', bg: 'bg-purple-50' };
      default: return { icon: AlertTriangle, label: type || 'Anomalia Detectada', color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-red-600 tracking-tight flex items-center gap-3">
             <ShieldAlert size={36} /> Alertas de Fraude
          </h2>
          <p className="text-slate-400 font-medium mt-1">Sistema inteligente de detecção e prevenção de fraudes</p>
        </div>
        <button 
          onClick={fetchAlerts}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className={`p-6 rounded-3xl border transition-all ${filterStatus === 'pending' ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-100' : 'bg-white border-slate-100'} cursor-pointer hover:shadow-lg`} onClick={() => setFilterStatus('pending')}>
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Alertas Pendentes</h3>
               <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle size={18}/></div>
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.pending}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{stats.pending === 0 ? 'Tudo limpo' : `${stats.pending} para revisar`}</p>
         </div>

         <div className={`p-6 rounded-3xl border transition-all ${filterStatus === 'confirmed' ? 'bg-red-50 border-red-200 ring-2 ring-red-100' : 'bg-white border-slate-100'} cursor-pointer hover:shadow-lg`} onClick={() => setFilterStatus('confirmed')}>
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Fraudes Confirmadas</h3>
               <div className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle size={18}/></div>
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.confirmed}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Bloqueadas</p>
         </div>

         <div className={`p-6 rounded-3xl border transition-all ${filterStatus === 'dismissed' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100' : 'bg-white border-slate-100'} cursor-pointer hover:shadow-lg`} onClick={() => setFilterStatus('dismissed')}>
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Alertas Descartados</h3>
               <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={18}/></div>
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.dismissed}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Falsos positivos</p>
         </div>

         <div className="p-6 rounded-3xl border bg-white border-slate-100">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Alertas Críticos</h3>
               <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Activity size={18}/></div>
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.critical}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Alta prioridade</p>
         </div>
      </div>

      {/* CHART SUMMARY (Visible only in Timeline Mode or always if preferred) */}
      <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-4">
                <Activity size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Tipos de Alertas Detectados pelo Sistema</h3>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                   { label: 'Resposta Rápida Demais', count: alerts.filter(a => a.alert_type === 'fast_response').length, icon: Zap, bg: 'bg-amber-100 text-amber-600' },
                   { label: 'IP Duplicado', count: alerts.filter(a => a.alert_type === 'duplicate_ip').length, icon: Smartphone, bg: 'bg-orange-100 text-orange-600' },
                   { label: 'Padrão Repetitivo', count: alerts.filter(a => a.alert_type === 'pattern_match').length, icon: BarChart3, bg: 'bg-red-100 text-red-600' },
                   { label: 'Horário Incomum', count: alerts.filter(a => a.alert_type === 'off_hours').length, icon: Clock, bg: 'bg-slate-100 text-slate-600' },
                   { label: 'Mesmo Dispositivo', count: alerts.filter(a => a.alert_type === 'same_device').length, icon: Smartphone, bg: 'bg-orange-100 text-orange-600' },
                   { label: 'Localização Próxima', count: alerts.filter(a => a.alert_type === 'geo_cluster').length, icon: MapPin, bg: 'bg-orange-100 text-orange-600' },
                   { label: 'Respostas Idênticas', count: alerts.filter(a => a.alert_type === 'identical_answers').length, icon: Users, bg: 'bg-orange-100 text-orange-600' },
                ].map((item, i) => (
                   <div key={i} className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm border border-slate-50">
                      <div className={`p-2 rounded-lg ${item.bg}`}><item.icon size={16}/></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-500 leading-tight mb-0.5">{item.label}</p>
                         <p className="text-lg font-black text-slate-800">{item.count}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
         <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por detalhes ou tipo..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none font-medium text-slate-600 text-sm"
            />
         </div>
         <div className="h-px w-full md:h-8 md:w-px bg-slate-100"></div>
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 px-2">
            <div className="relative">
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="appearance-none bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 outline-none pr-8 cursor-pointer hover:bg-slate-50 transition-all min-w-[140px]"
                >
                   <option value="pending">Pendente</option>
                   <option value="confirmed">Confirmado</option>
                   <option value="dismissed">Descartado</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <div className="relative">
                <select 
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value as any)}
                  className="appearance-none bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 outline-none pr-8 cursor-pointer hover:bg-slate-50 transition-all min-w-[150px]"
                >
                   <option value="all">Todas Gravidades</option>
                   <option value="critical">Crítica</option>
                   <option value="high">Alta</option>
                   <option value="medium">Média</option>
                   <option value="low">Baixa</option>
                </select>
                <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <div className="relative">
                <select 
                  className="appearance-none bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 outline-none pr-8 cursor-pointer hover:bg-slate-50 transition-all min-w-[150px]"
                >
                   <option value="all">Todos os Tipos</option>
                   <option value="fast_response">Resposta Rápida Demais</option>
                   <option value="duplicate_ip">IP Duplicado</option>
                   <option value="pattern_match">Padrão Repetitivo</option>
                   <option value="off_hours">Horário Incomum</option>
                   <option value="same_device">Mesmo Dispositivo</option>
                   <option value="geo_cluster">Localização Próxima</option>
                   <option value="identical_answers">Respostas Idênticas</option>
                </select>
                <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
         </div>
      </div>

      {/* TOGGLE VIEW */}
      <div className="flex justify-center mb-4">
         <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button 
               onClick={() => setViewMode('list')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <AlertTriangle size={14} className="inline mr-1 mb-0.5" /> Lista de Alertas
            </button>
            <button 
               onClick={() => setViewMode('timeline')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <Clock size={14} className="inline mr-1 mb-0.5" /> Timeline
            </button>
         </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-red-500" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Analisando Padrões...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center animate-in zoom-in duration-300">
           <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6">
              <ShieldAlert size={40} />
           </div>
           <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nenhum alerta {filterStatus === 'pending' ? 'pendente' : 'encontrado'}! 🎉</h3>
           <p className="text-slate-400 font-medium mt-2 max-w-md">
             {filterStatus === 'pending' 
                ? 'Todos os alertas foram revisados. O sistema está monitorando constantemente.' 
                : 'Tente ajustar os filtros para encontrar registros antigos.'}
           </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
           {filteredAlerts.map(alert => {
             const typeConfig = getTypeConfig(alert.alert_type);
             const TypeIcon = typeConfig.icon;
             const isProcessing = processingId === alert.id;

             return (
               <div key={alert.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all group relative overflow-hidden">
                  
                  {/* Gravidade Stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'}`}></div>

                  <div className="flex items-start gap-5 pl-2">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${typeConfig.bg} ${typeConfig.color}`}>
                        <TypeIcon size={24} />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h4 className="text-base font-bold text-slate-800">{typeConfig.label}</h4>
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${alert.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                              {alert.severity === 'critical' ? 'Crítico' : alert.severity === 'high' ? 'Alto' : 'Médio'}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mb-3">
                           Formulário: <span className="font-bold text-slate-700">{alert.forms?.title || 'Formulário Desconhecido'}</span>
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                              <Clock size={12} /> {formatDate(alert.created_at)}
                           </div>
                           {alert.responses?.duration_seconds && (
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                                <Zap size={12} /> Duração: {alert.responses.duration_seconds}s
                             </div>
                           )}
                           {/* Exibir IP se disponível no metadata (mock visual se não tiver) */}
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                                <Fingerprint size={12} /> IP: {alert.responses?.metadata?.ip || '192.168.x.x'}
                           </div>
                        </div>
                     </div>
                  </div>

                  {filterStatus === 'pending' && (
                    <div className="flex gap-3 md:border-l md:border-slate-50 md:pl-6 md:h-full items-center">
                       <button 
                         disabled={isProcessing}
                         onClick={() => handleResolveAlert(alert.id, 'dismissed')}
                         className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle size={16} />} 
                          <span className="hidden lg:inline">Legítimo</span>
                       </button>
                       <button 
                         disabled={isProcessing}
                         onClick={() => handleResolveAlert(alert.id, 'confirmed')}
                         className="px-5 py-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-xs uppercase hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <XCircle size={16} />} 
                          <span className="hidden lg:inline">Confirmar Fraude</span>
                       </button>
                    </div>
                  )}

                  {filterStatus !== 'pending' && (
                     <div className="px-6 py-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs uppercase border border-slate-100">
                        {filterStatus === 'confirmed' ? 'Bloqueado' : 'Validado'}
                     </div>
                  )}
               </div>
             );
           })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-[400px]">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity size={20} className="text-red-500" /> Linha do Tempo de Incidentes</h3>
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredAlerts.slice(0, 20).reverse().map(a => ({ time: new Date(a.created_at).toLocaleTimeString(), severity: a.severity === 'critical' ? 3 : a.severity === 'high' ? 2 : 1 }))}>
                <defs>
                  <linearGradient id="colorSev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius:'12px'}} />
                <Area type="step" dataKey="severity" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSev)" />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
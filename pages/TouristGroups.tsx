import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, MapPin, Loader2, X, User, Globe, Calendar, ChevronDown, 
  Search, Filter, CheckCircle2, BarChart3, MoreVertical, 
  FileText, Edit3, MessageSquare, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TouristGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data Sources
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);

  // Form States
  const [name, setName] = useState('');
  const [guideId, setGuideId] = useState('');
  const [guideNameFallback, setGuideNameFallback] = useState(''); // Fallback se não usar ID
  const [count, setCount] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchGuides();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tourist_groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setGroups(data);
      }
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuides = async () => {
    // Busca usuários com tipo 'Guia de Turismo'
    const { data } = await supabase.from('profiles').select('*').eq('type', 'Guia de Turismo');
    if (data) setAvailableGuides(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Encontrar o nome do guia baseado no ID selecionado (para redundância visual se necessário)
    const selectedGuideObj = availableGuides.find(g => g.id === guideId);
    const guideNameFinal = selectedGuideObj ? selectedGuideObj.name : guideNameFallback;

    try {
      const { error } = await supabase.from('tourist_groups').insert([{
        name,
        guide_id: guideId || null,
        guide: guideNameFinal, // Mantém o campo antigo texto para compatibilidade visual rápida
        count: parseInt(count) || 0,
        country,
        state,
        city,
        date: date || null,
        status,
        notes
      }]);

      if (!error) {
        await fetchGroups();
        setIsCreateModalOpen(false);
        resetForm();
      } else {
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este grupo? Todas as respostas e vínculos serão perdidos.")) return;
    
    setLoading(true);
    const { error } = await supabase.from('tourist_groups').delete().eq('id', id);
    if (!error) {
        setGroups(prev => prev.filter(g => g.id !== id));
    } else {
        alert("Erro ao excluir grupo.");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName(''); setGuideId(''); setGuideNameFallback(''); setCount(''); setCity(''); setDate(''); setNotes('');
    setCountry('Brasil'); setState(''); setStatus('Ativo');
  };

  // KPIs Calculados
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status === 'Ativo').length;
  const totalTourists = groups.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
  const totalResponses = groups.reduce((acc, curr) => acc + (curr.responses || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-extrabold text-sky-600 tracking-tight">Grupos de Turistas</h2>
          <p className="text-slate-400 font-medium mt-1">Gerencie grupos de visitantes e suas pesquisas</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-3 bg-sky-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all"
        >
          <Plus size={18} /> Novo Grupo
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Total de Grupos</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{totalGroups}</h3>
            </div>
            <div className="bg-sky-50 p-3 rounded-2xl text-sky-500"><Users size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Grupos Ativos</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{activeGroups}</h3>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-500"><CheckCircle2 size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Total de Turistas</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{totalTourists}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-500"><Globe size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Respostas Coletadas</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{totalResponses}</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-2xl text-purple-500"><BarChart3 size={24}/></div>
         </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-8 flex items-center gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              placeholder="Buscar grupos..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none font-medium text-slate-600 text-sm"
            />
         </div>
         <div className="h-8 w-px bg-slate-100"></div>
         <div className="flex gap-2 pr-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100">
               <Filter size={14} /> Todos os Status <ChevronDown size={12}/>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100">
               <User size={14} /> Todos os Guias <ChevronDown size={12}/>
            </button>
         </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-sky-600" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Grupos...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="w-full bg-white rounded-[2rem] border border-slate-100 p-24 flex flex-col items-center justify-center text-center shadow-sm min-h-[500px]">
          <div className="relative mb-6">
             <Users size={80} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Nenhum grupo encontrado</h3>
          <p className="text-slate-400 font-medium max-w-sm mt-2 mb-8">
            Comece criando seu primeiro grupo de turistas para gerenciar coletas.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#2A8CB4] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-sky-100 hover:bg-[#1a6b8a] transition-all"
          >
            <Plus size={16} /> Criar Primeiro Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {groups.map(group => (
             <div key={group.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all group relative">
                
                {/* Menu Action - Using trash icon instead of generic more */}
                <button 
                    onClick={() => handleDelete(group.id)}
                    className="absolute top-6 right-6 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                    title="Excluir Grupo"
                >
                   <Trash2 size={20} />
                </button>

                {/* Header Card */}
                <div className="flex items-start gap-4 mb-6">
                   <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0">
                      {group.name.charAt(0)}
                   </div>
                   <div className="pr-6">
                      <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-1">{group.name}</h3>
                      <div className="flex gap-2 mt-2">
                         <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${group.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {group.status}
                         </span>
                         <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-orange-50 text-orange-600 flex items-center gap-1">
                            <Users size={10} /> {group.count} Turistas
                         </span>
                      </div>
                   </div>
                </div>

                {/* Info List */}
                <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                   <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                      <User size={14} className="text-purple-400" />
                      Guia: {group.guide || 'Não atribuído'}
                   </div>
                   <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                      <MapPin size={14} className="text-sky-400" />
                      {group.city} - {group.state} ({group.country})
                   </div>
                   <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                      <Calendar size={14} className="text-orange-400" />
                      Visita: {group.date ? new Date(group.date).toLocaleDateString('pt-BR') : '--'}
                   </div>
                </div>

                {/* Footer Action */}
                <button className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group-hover:border-sky-200 group-hover:text-sky-700">
                   <Edit3 size={14} /> Gerenciar Grupo
                </button>
             </div>
           ))}
        </div>
      )}

      {/* MODAL CRIAR GRUPO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10">
              <X size={20} />
            </button>
            
            <div className="p-8 pb-4 border-b border-slate-50">
              <h3 className="text-2xl font-black text-sky-600 tracking-tight">Criar Novo Grupo</h3>
              <p className="text-slate-400 text-sm mt-1 font-medium">Preencha os detalhes do novo grupo de visitantes</p>
            </div>

            <form onSubmit={handleCreate} className="p-8 pt-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nome do Grupo *</label>
                <input 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Grupo Escolar São Paulo" 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none font-medium text-slate-700 transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                    <User size={14} className="text-sky-500" /> Guia Responsável *
                  </label>
                  <div className="relative">
                    <select 
                      value={guideId}
                      onChange={e => setGuideId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none appearance-none bg-white text-slate-600 font-medium cursor-pointer"
                    >
                      <option value="">Selecione um guia...</option>
                      {availableGuides.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.email})</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                    <Users size={14} className="text-orange-500" /> Tamanho do Grupo *
                  </label>
                  <input 
                    type="number" 
                    value={count}
                    onChange={e => setCount(e.target.value)}
                    placeholder="Nº de turistas" 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none font-medium text-slate-700 transition-all" 
                  />
                </div>
              </div>

              {/* ... Resto do formulário mantido para brevidade (país, estado, cidade, etc) ... */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                    <Globe size={14} className="text-sky-500" /> País de Origem
                  </label>
                  <div className="relative">
                    <select 
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none appearance-none bg-white text-slate-600 font-medium cursor-pointer"
                    >
                      <option>Brasil</option>
                      <option>Argentina</option>
                      <option>Portugal</option>
                      <option>EUA</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Estado</label>
                  <div className="relative">
                    <select 
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none appearance-none bg-white text-slate-600 font-medium cursor-pointer"
                    >
                      <option value="">Selecione o estado...</option>
                      <option value="SP">São Paulo</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="SE">Sergipe</option>
                      <option value="BA">Bahia</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <MapPin size={14} className="text-purple-500" /> Cidade de Origem
                </label>
                <input 
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ex: São Paulo" 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none font-medium text-slate-700 transition-all" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-50">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all bg-white">Cancelar</button>
                <button disabled={saving} type="submit" className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-100 transition-all flex items-center gap-2">
                   {saving && <Loader2 className="animate-spin" size={16} />} Criar Grupo
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
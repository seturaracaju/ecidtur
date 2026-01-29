import React, { useState, useEffect } from 'react';
import { 
  Plus, MapPin, Calendar, Settings2, BarChart, X, Save, Users, Target, Loader2, 
  ChevronDown, Search, Filter, LayoutGrid, MoreVertical, Clock, FileText, 
  CheckCircle2, AlertCircle, BarChart3, Edit3, Trash2, UserPlus, QrCode, Share2, Link, ExternalLink,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- MANAGE MODAL STATES ---
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [manageTab, setManageTab] = useState<'details' | 'team' | 'forms'>('details');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [linkedForms, setLinkedForms] = useState<any[]>([]);
  const [availableResearchers, setAvailableResearchers] = useState<any[]>([]);
  const [selectedResearcherToAdd, setSelectedResearcherToAdd] = useState('');
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);

  // QR Code Modal (dentro do Manage)
  const [qrModalForm, setQrModalForm] = useState<any>(null);
  const [qrTargetUser, setQrTargetUser] = useState<string>(''); // ID do pesquisador alvo para o QR Code

  // Form States (Create/Edit)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Outro');
  const [status, setStatus] = useState('Planejado');
  const [location, setLocation] = useState('');
  
  // Datetime States
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  
  const [goal, setGoal] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchResearchers();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (!error && data) setEvents(data);
    } catch (e) {
      console.error("Erro ao carregar eventos:", e);
    }
    setLoading(false);
  };

  const fetchResearchers = async () => {
      // Busca todos os usuários aptos para serem vinculados (Pesquisador, Guia, Analista)
      const { data } = await supabase
        .from('users')
        .select('*')
        .in('user_type', ['Pesquisador', 'Guia de Turismo', 'Analista']);
        
      if (data) setAvailableResearchers(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Tratamento básico para garantir que datas vazias vão como null
    const finalStart = startDateTime || null;
    const finalEnd = endDateTime || null;

    const { error } = await supabase.from('events').insert([{
      name, description, category, location, 
      start_date: finalStart, 
      end_date: finalEnd, 
      goal: parseInt(goal) || 1000,
      current: 0,
      status
    }]);

    if (!error) {
      setIsCreateModalOpen(false);
      fetchEvents();
      resetForm();
    } else {
      alert("Erro ao criar evento. Verifique os dados.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este evento? Todas as respostas e vínculos serão perdidos.")) return;
    
    setLoading(true);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
        setEvents(prev => prev.filter(e => e.id !== id));
        if (selectedEvent?.id === id) setIsManageModalOpen(false);
    } else {
        alert("Erro ao excluir evento.");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName(''); setDescription(''); setCategory('Outro'); setStatus('Planejado');
    setLocation(''); setStartDateTime(''); setEndDateTime(''); setGoal('');
  };

  // Helper para formatar data ISO para o input datetime-local (YYYY-MM-DDThh:mm)
  const toInputDate = (dateStr: string) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => n < 10 ? '0'+n : n;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // --- MANAGE LOGIC ---

  const openManageModal = async (event: any) => {
      setSelectedEvent(event);
      // Preenche os estados do formulário com os dados do evento para edição
      setName(event.name); setDescription(event.description || ''); setCategory(event.category || 'Outro');
      setStatus(event.status || 'Planejado'); setLocation(event.location || ''); 
      
      setStartDateTime(event.start_date ? toInputDate(event.start_date) : '');
      setEndDateTime(event.end_date ? toInputDate(event.end_date) : '');
      
      setGoal(event.goal || 1000);
      
      setManageTab('details');
      setIsManageModalOpen(true);
      fetchTeam(event.id);
      fetchLinkedForms(event.id);
  };

  const fetchTeam = async (eventId: string) => {
      setLoadingTeam(true);
      const { data, error } = await supabase
        .from('event_assignments')
        .select('*, users(*)')
        .eq('event_id', eventId);
      
      if (!error && data) {
          // Flatten structure
          const formatted = data.map((item: any) => ({
             assignment_id: item.event_id + item.user_id, // composite key simulation
             ...item.users,
             role_in_event: item.role_in_event
          }));
          setTeamMembers(formatted);
      }
      setLoadingTeam(false);
  };

  const fetchLinkedForms = async (eventId: string) => {
      setLoadingForms(true);
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('linked_event_id', eventId);
      
      if (!error && data) {
          setLinkedForms(data);
      }
      setLoadingForms(false);
  };

  const addMemberToEvent = async () => {
      if (!selectedResearcherToAdd || !selectedEvent) return;
      
      const { error } = await supabase.from('event_assignments').insert({
          event_id: selectedEvent.id,
          user_id: selectedResearcherToAdd,
          role_in_event: 'Coletor'
      });

      if (!error) {
          fetchTeam(selectedEvent.id);
          setSelectedResearcherToAdd('');
      } else {
          alert('Erro ao adicionar membro (pode já estar vinculado).');
      }
  };

  const removeMemberFromEvent = async (userId: string) => {
      const { error } = await supabase
        .from('event_assignments')
        .delete()
        .eq('event_id', selectedEvent.id)
        .eq('user_id', userId);
      
      if (!error) {
          fetchTeam(selectedEvent.id);
      }
  };

  const handleUpdateEvent = async () => {
      if (!selectedEvent) return;
      setSaving(true);
      
      const finalStart = startDateTime || null;
      const finalEnd = endDateTime || null;

      const { error } = await supabase.from('events').update({
          name, description, category, location, status,
          start_date: finalStart, 
          end_date: finalEnd,
          goal: parseInt(goal) || 1000
      }).eq('id', selectedEvent.id);

      if (!error) {
          fetchEvents();
          // Atualiza o objeto local para refletir na UI do modal
          setSelectedEvent({ ...selectedEvent, name, description, category, status });
          alert('Evento atualizado com sucesso!');
      }
      setSaving(false);
  };

  const generateFormQR = (formId: string, targetUserId?: string) => {
    const baseURL = window.location.origin + window.location.pathname;
    let url = `${baseURL}#/public/form/${formId}`;
    
    // Se selecionou um pesquisador específico, adiciona a ref
    if (targetUserId) {
        url += `?ref=${targetUserId}`;
    }

    return {
        url: url,
        qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`
    };
  };

  // KPIs
  const totalEvents = events.length;
  const inProgress = events.filter(e => e.status === 'Em Andamento').length;
  const completed = events.filter(e => e.status === 'Concluído').length;
  const totalResponses = events.reduce((acc, curr) => acc + (curr.current || 0), 0);

  // Helper de Cores
  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Em Andamento': return 'bg-emerald-100 text-emerald-700';
      case 'Concluído': return 'bg-slate-100 text-slate-600';
      case 'Planejado': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Helper para formatar data e hora para exibição no card
  const formatEventDateTime = (isoString: string) => {
      if (!isoString) return '--';
      const d = new Date(isoString);
      return `${d.toLocaleDateString()} às ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-extrabold text-purple-600 tracking-tight">Eventos</h2>
          <p className="text-slate-400 font-medium mt-1">Gerencie eventos turísticos e vincule pesquisas</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Novo Evento
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Total de Eventos</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{totalEvents}</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-2xl text-purple-500"><Calendar size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Em Andamento</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{inProgress}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-500"><Clock size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Concluídos</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{completed}</h3>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-500"><CheckCircle2 size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Respostas Coletadas</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{totalResponses}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-500"><BarChart3 size={24}/></div>
         </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-8 flex items-center gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar eventos..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none font-medium text-slate-600 text-sm"
            />
         </div>
         <div className="h-8 w-px bg-slate-100"></div>
         <div className="flex gap-2 pr-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all">
               <Filter size={14} /> Todos os Status <ChevronDown size={12}/>
            </button>
         </div>
      </div>

      {/* EVENT GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-purple-600" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Eventos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.length === 0 && (
             <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
               <Calendar size={48} className="text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum evento registrado ainda.</p>
             </div>
          )}
          {events.map(event => {
            const current = event.current || 0;
            const goal = event.goal || 1000;
            const progress = Math.min((current / goal) * 100, 100);
            
            return (
              <div key={event.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all group">
                 
                 {/* Header */}
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                       <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                          <Calendar size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{event.name}</h3>
                          <div className="flex gap-2 mt-2">
                             <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${getStatusColor(event.status)}`}>
                                {event.status}
                             </span>
                             <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-purple-50 text-purple-600">
                                {event.category}
                             </span>
                          </div>
                       </div>
                    </div>
                    {/* Botão de Excluir no Card */}
                    <button 
                        onClick={() => handleDelete(event.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                        title="Excluir Evento"
                    >
                        <Trash2 size={20} />
                    </button>
                 </div>

                 <p className="text-slate-400 text-xs line-clamp-2 mb-6 h-8">{event.description || 'Sem descrição.'}</p>

                 {/* Info List */}
                 <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                       <MapPin size={16} className="text-purple-400" />
                       {event.location}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                       <Calendar size={16} className="text-blue-400" />
                       <div className="flex flex-col">
                           <span>Início: {formatEventDateTime(event.start_date)}</span>
                           {event.end_date && <span>Fim: {formatEventDateTime(event.end_date)}</span>}
                       </div>
                    </div>
                 </div>

                 {/* Progress */}
                 <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                       <span className="flex items-center gap-1"><Target size={12} className="text-emerald-500"/> Meta de Respostas</span>
                       <span className="text-slate-800">{current} / {goal}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                       <div className="h-full bg-slate-800 rounded-full" style={{width: `${progress}%`}}></div>
                    </div>
                    <p className="text-[10px] text-right text-slate-400">{progress.toFixed(0)}% da meta</p>
                 </div>
                 
                 {/* Action */}
                 <div className="mt-auto">
                    <button 
                        onClick={() => openManageModal(event)}
                        className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold uppercase hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group-hover:border-purple-200 group-hover:text-purple-700"
                    >
                       <Edit3 size={14} /> Gerenciar Evento
                    </button>
                 </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* --- MODAL GERENCIAR EVENTO (DETALHES / EQUIPE / FORMS) --- */}
      {isManageModalOpen && selectedEvent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)}></div>
              <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl relative animate-in zoom-in duration-200 overflow-hidden flex flex-col">
                  
                  {/* Header */}
                  <div className="bg-purple-600 p-8 flex justify-between items-start shrink-0 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><Calendar size={120} /></div>
                      <div className="relative z-10">
                          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm border border-white/20 mb-3 inline-block">
                              {selectedEvent.category}
                          </span>
                          <h2 className="text-3xl font-black text-white leading-tight mb-1">{selectedEvent.name}</h2>
                          <p className="text-purple-100 text-sm font-medium flex items-center gap-2">
                              <MapPin size={14} /> {selectedEvent.location}
                          </p>
                      </div>
                      <button onClick={() => setIsManageModalOpen(false)} className="text-white/60 hover:text-white relative z-10 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={24}/></button>
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-slate-50 p-2 border-b border-slate-100 shrink-0 gap-2 px-8 overflow-x-auto">
                      <button 
                        onClick={() => setManageTab('details')}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${manageTab === 'details' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <Settings2 size={16} /> Detalhes
                      </button>
                      <button 
                        onClick={() => setManageTab('team')}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${manageTab === 'team' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <Users size={16} /> Equipe
                      </button>
                      <button 
                        onClick={() => setManageTab('forms')}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${manageTab === 'forms' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <FileText size={16} /> Formulários & QR
                      </button>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-8">
                      
                      {/* --- TAB DETALHES --- */}
                      {manageTab === 'details' && (
                          <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
                              <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700">Nome do Evento</label>
                                      <input value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium" />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700">Categoria</label>
                                      <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium bg-white">
                                          <option>Outro</option><option>Festival</option><option>Show</option><option>Feira</option><option>Esportivo</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-slate-700">Descrição</label>
                                  <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium h-24 resize-none" />
                              </div>
                              
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-slate-700">Local</label>
                                  <input value={location} onChange={e=>setLocation(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium" />
                              </div>

                              {/* Data e Hora com Layout Grid */}
                              <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                          <Calendar size={14} className="text-blue-500"/> Data e Hora de Início *
                                      </label>
                                      <input 
                                        type="datetime-local" 
                                        value={startDateTime} 
                                        onChange={e=>setStartDateTime(e.target.value)} 
                                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium text-slate-600" 
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                          <Clock size={14} className="text-orange-500"/> Data e Hora de Término
                                      </label>
                                      <input 
                                        type="datetime-local" 
                                        value={endDateTime} 
                                        onChange={e=>setEndDateTime(e.target.value)} 
                                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium text-slate-600" 
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700">Status</label>
                                      <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium bg-white">
                                          <option>Planejado</option><option>Em Andamento</option><option>Concluído</option>
                                      </select>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700">Meta de Respostas</label>
                                      <input type="number" value={goal} onChange={e=>setGoal(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium" />
                                  </div>
                              </div>
                              <div className="pt-6 border-t border-slate-50 flex justify-end">
                                  <button onClick={handleUpdateEvent} disabled={saving} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-purple-700 flex items-center gap-2">
                                      {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar Alterações
                                  </button>
                              </div>
                          </div>
                      )}
                      
                      {/* --- TAB EQUIPE --- */}
                      {manageTab === 'team' && (
                          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                              <div className="flex flex-col md:flex-row gap-8">
                                  
                                  {/* Add Member Panel */}
                                  <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-3xl border border-slate-100 h-fit">
                                      <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><UserPlus size={18} className="text-purple-600"/> Adicionar Pesquisador</h4>
                                      <p className="text-xs text-slate-500 mb-4">Vincule pesquisadores para que eles possam pontuar neste evento.</p>
                                      
                                      <div className="space-y-3">
                                          <div className="relative">
                                              <select 
                                                value={selectedResearcherToAdd}
                                                onChange={e => setSelectedResearcherToAdd(e.target.value)}
                                                className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 outline-none focus:border-purple-500 appearance-none bg-white"
                                              >
                                                  <option value="">Selecione um pesquisador...</option>
                                                  {availableResearchers.map(r => (
                                                      <option key={r.id} value={r.id}>{r.full_name} ({r.user_type})</option>
                                                  ))}
                                              </select>
                                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                          </div>
                                          <button 
                                            onClick={addMemberToEvent}
                                            disabled={!selectedResearcherToAdd}
                                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md"
                                          >
                                              Vincular ao Evento
                                          </button>
                                      </div>
                                  </div>

                                  {/* Team List */}
                                  <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                          Membros Vinculados 
                                          <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">{teamMembers.length}</span>
                                      </h4>
                                      
                                      {loadingTeam ? (
                                          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-600" /></div>
                                      ) : teamMembers.length === 0 ? (
                                          <div className="border-2 border-dashed border-slate-100 rounded-3xl p-10 text-center">
                                              <Users size={32} className="text-slate-200 mx-auto mb-2" />
                                              <p className="text-slate-400 font-bold text-xs uppercase">Nenhum membro vinculado</p>
                                          </div>
                                      ) : (
                                          <div className="space-y-3">
                                              {teamMembers.map(member => (
                                                  <div key={member.assignment_id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-purple-100 transition-all group">
                                                      <div className="flex items-center gap-3">
                                                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                                              {member.full_name?.charAt(0)}
                                                          </div>
                                                          <div>
                                                              <p className="font-bold text-slate-800 text-sm">{member.full_name}</p>
                                                              <p className="text-xs text-slate-400">{member.email}</p>
                                                          </div>
                                                      </div>
                                                      <div className="flex items-center gap-4">
                                                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-lg border border-emerald-100">
                                                              {member.role_in_event || 'Coletor'}
                                                          </span>
                                                          <button 
                                                            onClick={() => removeMemberFromEvent(member.id)}
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Remover do evento"
                                                          >
                                                              <Trash2 size={16} />
                                                          </button>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      {/* --- TAB FORMULÁRIOS VINCULADOS --- */}
                      {manageTab === 'forms' && (
                          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                                  <div className="bg-white p-2 rounded-lg text-sky-500"><QrCode size={24}/></div>
                                  <div>
                                      <h4 className="text-sky-800 font-bold mb-1">Central de QR Codes</h4>
                                      <p className="text-sky-700/80 text-xs">
                                          Cada formulário possui seu próprio QR Code. Os entrevistadores devem utilizar o QR Code do formulário específico que desejam aplicar durante o evento.
                                      </p>
                                  </div>
                              </div>

                              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  Formulários Vinculados
                                  <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">{linkedForms.length}</span>
                              </h4>

                              {loadingForms ? (
                                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-600" /></div>
                              ) : linkedForms.length === 0 ? (
                                  <div className="border-2 border-dashed border-slate-100 rounded-3xl p-10 text-center">
                                      <FileText size={32} className="text-slate-200 mx-auto mb-2" />
                                      <p className="text-slate-400 font-bold text-xs uppercase">Nenhum formulário vinculado a este evento.</p>
                                      <p className="text-slate-400 text-xs mt-2">Vá em "Formulários" e edite um formulário para vinculá-lo aqui.</p>
                                  </div>
                              ) : (
                                  <div className="space-y-4">
                                      {linkedForms.map(form => (
                                          <div key={form.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-purple-200 transition-all flex flex-col md:flex-row justify-between items-center gap-6">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">
                                                      <FileText size={24} />
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-slate-800 text-lg">{form.title}</h4>
                                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase mt-1 inline-block ${form.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                          {form.status}
                                                      </span>
                                                  </div>
                                              </div>
                                              <button 
                                                onClick={() => { setQrTargetUser(''); setQrModalForm(form); }}
                                                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                                              >
                                                  <QrCode size={16} /> Gerar QR Code
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL DE QR CODE ESPECÍFICO --- */}
      {qrModalForm && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setQrModalForm(null)}></div>
             <div className="bg-white rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in w-full max-w-md text-center">
                 <button onClick={() => setQrModalForm(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={24}/></button>
                 
                 <h3 className="text-2xl font-black text-slate-800 mb-2">Acesso Rápido</h3>
                 <p className="text-slate-400 text-sm font-medium mb-6">Escaneie para acessar o formulário</p>
                 
                 {/* Seletor de Personalização */}
                 <div className="mb-6 bg-purple-50 p-4 rounded-2xl border border-purple-100 text-left">
                     <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Personalizar QR para Membro (Opcional)</label>
                     <div className="relative">
                        <select 
                            value={qrTargetUser} 
                            onChange={(e) => setQrTargetUser(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pl-3 text-xs font-bold text-slate-700 outline-none appearance-none"
                        >
                            <option value="">Link Genérico (Sem Atribuição)</option>
                            {teamMembers.map(m => (
                                <option key={m.id} value={m.id}>Para: {m.full_name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                     </div>
                     {qrTargetUser && (
                         <p className="text-[10px] text-purple-600 font-bold mt-2 flex items-center gap-1">
                             <UserCheck size={10} /> Link atribuído a {teamMembers.find(m => m.id === qrTargetUser)?.full_name}
                         </p>
                     )}
                 </div>

                 <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-200 inline-block mb-8 shadow-inner">
                     <img src={generateFormQR(qrModalForm.id, qrTargetUser).qrImage} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                 </div>
                 
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left mb-6">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Link Público</p>
                     <p className="text-xs text-purple-600 font-bold truncate">{generateFormQR(qrModalForm.id, qrTargetUser).url}</p>
                 </div>

                 <div className="flex gap-3">
                     <button 
                       onClick={() => navigator.clipboard.writeText(generateFormQR(qrModalForm.id, qrTargetUser).url)}
                       className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                     >
                         <Link size={16} /> Copiar
                     </button>
                     <a 
                       href={generateFormQR(qrModalForm.id, qrTargetUser).url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                     >
                         <ExternalLink size={16} /> Abrir
                     </a>
                 </div>
             </div>
         </div>
      )}

      {/* MODAL CRIAR EVENTO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative animate-in zoom-in duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <h3 className="text-xl font-extrabold text-purple-600">Criar Novo Evento</h3>
               <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
               <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Nome do Evento *</label>
                    <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Carnaval 2025" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Local</label>
                    <input value={location} onChange={e=>setLocation(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-medium" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-700 mb-2 block">Início (Data e Hora) *</label>
                        <input 
                          type="datetime-local" 
                          value={startDateTime} 
                          onChange={e=>setStartDateTime(e.target.value)} 
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-600 font-medium" 
                        />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-700 mb-2 block">Fim (Data e Hora)</label>
                        <input 
                          type="datetime-local" 
                          value={endDateTime} 
                          onChange={e=>setEndDateTime(e.target.value)} 
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-600 font-medium" 
                        />
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 border border-slate-200 bg-white">Cancelar</button>
                    <button disabled={saving} type="submit" className="px-8 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
                      {saving && <Loader2 className="animate-spin" size={16} />} Criar Evento
                    </button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
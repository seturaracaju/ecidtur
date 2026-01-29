import React, { useState, useEffect } from 'react';
import { 
  UserPlus, X, Mail, Phone, ChevronDown, Check, Edit3, MoreVertical, 
  Star, Flame, Award, Clipboard, MessageSquare, Calendar, Loader2, 
  AlertCircle, Shield, Crown, Bookmark, BarChart3, Search, Filter,
  Users, User, Trophy, Zap, Plus, CheckSquare, Square, Ban, CheckCircle2,
  Trash2, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  type: string;
  status: string;
  points: number;
  level: number;
  level_label: string;
  forms_count: number;
  streak: number;
  responses_count: number;
}

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Novo estado para senha
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Usuário');
  const [type, setType] = useState('Pesquisador');
  const [status, setStatus] = useState('Ativo');
  
  // Assignment States
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]); // IDs de Eventos ou Grupos selecionados

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMembers();
    fetchAuxiliaryData();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name');
      
      if (!error && data) {
          const formatted = data.map((u: any) => ({
              ...u,
              name: u.full_name,
              type: u.user_type || 'Pesquisador',
              status: u.status || 'Ativo',
              role: u.role || 'Usuário'
          }));
          setMembers(formatted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    const { data: events } = await supabase.from('events').select('id, name');
    if (events) setAllEvents(events);

    const { data: groups } = await supabase.from('tourist_groups').select('id, name');
    if (groups) setAllGroups(groups);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedMemberId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = async (member: Member) => {
    setIsEditMode(true);
    setSelectedMemberId(member.id);
    
    // Populate Form
    setName(member.name || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setRole(member.role || 'Usuário');
    setType(member.type || 'Pesquisador');
    setStatus(member.status || 'Ativo');
    setPassword(''); // Senha vazia na edição (não alteramos senha por aqui por segurança)

    // Fetch Current Assignments based on Type
    setAssignedIds([]); 
    
    if (member.type === 'Pesquisador') {
        const { data } = await supabase.from('event_assignments').select('event_id').eq('user_id', member.id);
        if (data) setAssignedIds(data.map(d => d.event_id));
    } else if (member.type === 'Guia de Turismo') {
        const { data } = await supabase.from('tourist_groups').select('id').eq('guide_id', member.id);
        if (data) setAssignedIds(data.map(d => d.id));
    }

    setIsModalOpen(true);
  };

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setPassword('');
    setRole('Usuário'); setType('Pesquisador'); setStatus('Ativo');
    setAssignedIds([]);
  };

  const toggleAssignment = (id: string) => {
    if (assignedIds.includes(id)) {
      setAssignedIds(prev => prev.filter(item => item !== id));
    } else {
      setAssignedIds(prev => [...prev, id]);
    }
  };

  const handleDelete = async () => {
    if (!selectedMemberId) return;
    
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este membro? Esta ação removerá o acesso dele ao sistema.");
    if (!confirmDelete) return;

    setSaving(true);
    try {
        const { error } = await supabase.from('users').delete().eq('id', selectedMemberId);
        
        if (error) throw error;

        // Atualiza lista local
        setMembers(prev => prev.filter(m => m.id !== selectedMemberId));
        setIsModalOpen(false);
    } catch (err) {
        console.error("Erro ao excluir:", err);
        alert("Erro ao excluir membro. Verifique se existem registros vinculados.");
    } finally {
        setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let userId = selectedMemberId;

    try {
      const profileData = { 
          full_name: name, 
          email, 
          phone, 
          role, 
          user_type: type, 
          status 
      };
      
      if (isEditMode && userId) {
        // Atualização de Perfil Existente
        await supabase.from('users').update(profileData).eq('id', userId);
      } else {
        // Criação de Novo Usuário (Auth + Perfil)
        if (!password) {
            alert("A senha é obrigatória para novos usuários.");
            setSaving(false);
            return;
        }

        // 1. Criar Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });

        if (authError) {
            throw authError;
        }

        if (authData.user) {
            userId = authData.user.id;
            // 2. Inserir na tabela pública 'users' usando o mesmo ID do Auth
            const { error: profileError } = await supabase.from('users').insert([{
                id: userId,
                ...profileData
            }]);

            if (profileError) {
                // Se der erro ao criar perfil (ex: trigger duplicado), tentamos atualizar caso o trigger já tenha criado
                if (profileError.code === '23505') { 
                    await supabase.from('users').update(profileData).eq('id', userId);
                } else {
                    throw profileError;
                }
            }
        }
      }

      // 3. Handle Assignments
      if (userId) {
        if (type === 'Pesquisador') {
           await supabase.from('event_assignments').delete().eq('user_id', userId);
           if (assignedIds.length > 0) {
              const inserts = assignedIds.map(eventId => ({
                 event_id: eventId,
                 user_id: userId,
                 role_in_event: 'Coletor'
              }));
              await supabase.from('event_assignments').insert(inserts);
           }
        } else if (type === 'Guia de Turismo') {
           await supabase.from('tourist_groups').update({ guide_id: null }).eq('guide_id', userId);
           if (assignedIds.length > 0) {
              await supabase.from('tourist_groups').update({ guide_id: userId, guide: name }).in('id', assignedIds);
           }
        }
      }

      await fetchMembers();
      setIsModalOpen(false);

    } catch (err: any) {
      console.error("Erro ao salvar membro:", err);
      alert(`Erro ao salvar: ${err.message || 'Verifique os dados.'}`);
    } finally {
      setSaving(false);
    }
  };

  // KPIs
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Ativo').length;
  const researchers = members.filter(m => m.type === 'Pesquisador').length;
  const guides = members.filter(m => m.type === 'Guia de Turismo').length;

  const filteredMembers = members.filter(m => 
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-extrabold text-[#6366f1] tracking-tight">Equipe E-CIDTUR</h2>
          <p className="text-slate-400 font-medium mt-1">Gerencie pesquisadores, guias e administradores</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#6366f1] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4f46e5] transition-all"
        >
          <UserPlus size={18} /> Adicionar Membro
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Total de Membros</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{totalMembers}</h3>
            </div>
            <div className="bg-indigo-50 p-3 rounded-2xl text-[#6366f1]"><Users size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Membros Ativos</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{activeMembers}</h3>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-500"><CheckCircle2 size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Pesquisadores</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{researchers}</h3>
            </div>
            <div className="bg-sky-50 p-3 rounded-2xl text-sky-500"><Bookmark size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase">Guias de Turismo</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{guides}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-500"><Users size={24}/></div>
         </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-8 flex items-center gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou email..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none font-medium text-slate-600 text-sm"
            />
         </div>
         <div className="h-8 w-px bg-slate-100"></div>
         <div className="flex gap-2 pr-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all">
               <Shield size={14} /> Cargos <ChevronDown size={12}/>
            </button>
         </div>
      </div>

      {/* MEMBERS GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-[#6366f1]" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando Membros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col relative group hover:border-[#6366f1]/30 transition-all">
              <button onClick={() => openEditModal(member)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600">
                <Edit3 size={20} />
              </button>

              {/* Header: Avatar & Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold uppercase shrink-0 ${member.status === 'Ativo' ? 'bg-[#6366f1]' : 'bg-slate-300'}`}>
                  {member.name ? member.name.charAt(0) : 'U'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight truncate">{member.name || 'Sem Nome'}</h3>
                  <p className="text-slate-400 text-xs truncate">{member.email}</p>
                </div>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">
                  <Shield size={10} /> {member.role}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600 border border-blue-100">
                  <Bookmark size={10} /> {member.type}
                </span>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold border ${member.status === 'Ativo' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {member.status === 'Ativo' ? <CheckCircle2 size={10}/> : <Ban size={10}/>} {member.status}
                </span>
              </div>

              {/* Level & Points Bar */}
              <div className="mb-6 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <Trophy size={14} className="text-amber-400" /> Nível {member.level || 1}
                  </div>
                  <span className="bg-slate-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wide">
                    {member.level_label || 'NOVATO'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                   <span>Pontos</span>
                   <span className="text-[#6366f1]">{member.points || 0}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#6366f1] w-[5%] rounded-full"></div>
                </div>
              </div>

              <button 
                onClick={() => openEditModal(member)}
                className="w-full mt-auto flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold uppercase hover:bg-slate-50 transition-all"
              >
                <Edit3 size={14} /> Editar Membro
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CONFIGURAR MEMBRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative animate-in zoom-in duration-200 overflow-hidden flex flex-col">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"><X size={20} /></button>
            
            <div className="p-8 pb-4 shrink-0">
              <h3 className="text-2xl font-black text-[#6366f1] leading-tight">
                 {isEditMode ? 'Editar Membro da Equipe' : 'Configurar Novo Membro'}
              </h3>
              <p className="text-slate-500 text-sm mt-1 font-medium">Atualize as informações, permissões e atribuições.</p>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2 space-y-6">
              
              {/* Infos Básicas */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Nome Completo *</label>
                  <input required value={name} onChange={e=>setName(e.target.value)} className="w-full border-2 border-[#6366f1] rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Email *</label>
                  <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#6366f1] outline-none font-medium" />
                </div>
              </div>

              {/* Campo de Senha (Apenas Criação) */}
              {!isEditMode && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><Lock size={14} className="text-emerald-500"/> Senha de Acesso *</label>
                    <input 
                        required 
                        type="password" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        placeholder="Mínimo 6 caracteres"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none font-medium" 
                    />
                    <p className="text-[10px] text-slate-400">Esta senha será usada para login no sistema.</p>
                </div>
              )}

              <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Telefone</label>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(79) 99999-9999" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#6366f1] outline-none font-medium" />
              </div>

              {/* Cargos e Tipos */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><Shield size={14} className="text-amber-500" /> Cargo *</label>
                  <div className="relative">
                    <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#6366f1] outline-none appearance-none bg-white font-medium cursor-pointer">
                        <option>Usuário</option>
                        <option>Administrador</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><Bookmark size={14} className="text-[#3b82f6]" /> Tipo de Usuário</label>
                  <div className="relative">
                    <select value={type} onChange={e=>setType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#6366f1] outline-none appearance-none bg-white font-medium cursor-pointer">
                        <option>Pesquisador</option>
                        <option>Guia de Turismo</option>
                        <option>Analista</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Status do Usuário */}
              <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Status da Conta</label>
                  <div className="relative">
                    <select 
                        value={status} 
                        onChange={e=>setStatus(e.target.value)} 
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none appearance-none bg-white font-bold cursor-pointer ${status === 'Ativo' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}
                    >
                        <option value="Ativo">Ativo (Acesso Liberado)</option>
                        <option value="Inativo">Inativo (Acesso Bloqueado)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
              </div>
              
              {/* Área de Atribuição (Condicional) */}
              <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                      {type === 'Pesquisador' ? <Calendar size={18} className="text-blue-500" /> : <Users size={18} className="text-blue-500" />}
                      <h4 className="font-bold text-slate-800 text-sm">
                          {type === 'Pesquisador' ? 'Eventos Atribuídos' : 'Grupos Turísticos Vinculados'}
                      </h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 mb-4">
                      Selecione os {type === 'Pesquisador' ? 'eventos que este pesquisador irá cobrir' : 'grupos que este guia irá liderar'}.
                  </p>

                  <div className="bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                      {(type === 'Pesquisador' ? allEvents : allGroups).length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">Nenhum item disponível</div>
                      ) : (
                          (type === 'Pesquisador' ? allEvents : allGroups).map(item => {
                              const isChecked = assignedIds.includes(item.id);
                              return (
                                  <label key={item.id} className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                      <div onClick={(e) => { e.preventDefault(); toggleAssignment(item.id); }}>
                                          {isChecked 
                                            ? <CheckSquare className="text-[#6366f1]" size={20} /> 
                                            : <Square className="text-slate-300" size={20} />
                                          }
                                      </div>
                                  </label>
                              )
                          })
                      )}
                  </div>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-slate-50">
                {isEditMode && (
                   <button 
                     type="button" 
                     onClick={handleDelete}
                     className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 border border-red-100 transition-all flex items-center gap-2"
                   >
                       <Trash2 size={16} /> Excluir
                   </button>
                )}
                
                <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all bg-white">Cancelar</button>
                    <button disabled={saving} type="submit" className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#a78bfa] hover:bg-[#8b5cf6] shadow-lg shadow-purple-100 transition-all flex items-center gap-2">
                    {saving && <Loader2 className="animate-spin" size={16} />} 
                    {isEditMode ? 'Salvar Alterações' : 'Criar Membro'}
                    </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Plus, Search, Filter, ChevronDown, Loader2, FileText, 
  Trash2, Edit3, MessageSquare, BarChart2, Calendar, 
  Users, X, Save, ArrowLeft, GripVertical, Settings, 
  Smartphone, LayoutList, Star, MapPin, MousePointerClick, 
  Type, Mail, Phone, Image as ImageIcon, ChevronUp, Copy,
  CheckCircle2, LayoutTemplate, Briefcase, GraduationCap,
  Banknote, Plane, Hotel, Clock, ShieldCheck, Sparkles, DollarSign,
  Eye, ArrowRight, Play, Palette, Upload, Check, Share2, QrCode, Link as LinkIcon, ExternalLink,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FORM_OPTIONS } from '../constants';
import { AuthContext } from '../App';

// --- DEFINIÇÃO DA BIBLIOTECA DE PERGUNTAS ---

const BI_ITEMS = [
  {
    category: 'Perfil do Turista',
    items: [
      { type: 'geo_complete', label: 'Origem Completa', icon: MapPin, defaultText: 'De onde você vem? (País/Estado/Cidade)' },
      { type: 'demo_gender', label: 'Gênero', icon: Users, defaultText: 'Qual seu gênero?', hasOptions: true, fixedOptions: true },
      { type: 'demo_age_range', label: 'Faixa Etária', icon: Users, defaultText: 'Qual sua faixa etária?', hasOptions: true, fixedOptions: true },
      { type: 'demo_education', label: 'Escolaridade', icon: GraduationCap, defaultText: 'Qual seu grau de escolaridade?', hasOptions: true, fixedOptions: true },
      { type: 'demo_occupation', label: 'Profissão/Ocupação', icon: Briefcase, defaultText: 'Qual sua ocupação atual?', hasOptions: true, fixedOptions: true },
      { type: 'demo_income', label: 'Faixa de Renda', icon: Banknote, defaultText: 'Qual sua faixa de renda mensal?', hasOptions: true, fixedOptions: true },
      { type: 'demo_company', label: 'Acompanhantes', icon: Users, defaultText: 'Com quem você está viajando?', hasOptions: true, fixedOptions: true },
    ]
  },
  {
    category: 'Dados da Viagem',
    items: [
      { type: 'geo_transport', label: 'Meio de Transporte', icon: Plane, defaultText: 'Como você chegou ao destino?', hasOptions: true, fixedOptions: true },
      { type: 'trip_accommodation', label: 'Hospedagem', icon: Hotel, defaultText: 'Onde você está hospedado?', hasOptions: true, fixedOptions: true },
      { type: 'trip_motive', label: 'Motivo da Viagem', icon: Briefcase, defaultText: 'Qual o principal motivo da sua viagem?', hasOptions: true, fixedOptions: true },
      { type: 'trip_stay', label: 'Permanência', icon: Clock, defaultText: 'Quanto tempo pretende ficar?', hasOptions: true, fixedOptions: true },
    ]
  },
  {
    category: 'Satisfação & Avaliação',
    items: [
      { type: 'sat_nps', label: 'NPS (0-10)', icon: BarChart2, defaultText: 'Qual a probabilidade de você nos recomendar?' },
      { type: 'sat_overall', label: 'Satisfação Geral (Estrelas)', icon: Star, defaultText: 'Como você avalia sua experiência geral?' },
      { type: 'sat_cleaning', label: 'Avaliação: Limpeza', icon: Sparkles, defaultText: 'Como você avalia a limpeza pública?', hasOptions: true, fixedOptions: true },
      { type: 'sat_security', label: 'Avaliação: Segurança', icon: ShieldCheck, defaultText: 'Como você avalia a sensação de segurança?', hasOptions: true, fixedOptions: true },
      { type: 'sat_prices', label: 'Avaliação: Preços', icon: DollarSign, defaultText: 'Como você avalia os preços na cidade?', hasOptions: true, fixedOptions: true },
    ]
  }
];

const BASIC_ITEMS = [
  {
    category: 'Campos de Texto',
    items: [
      { type: 'basic_text_short', label: 'Texto Curto', icon: Type, defaultText: 'Nome Completo' },
      { type: 'basic_text_long', label: 'Texto Longo', icon: FileText, defaultText: 'Deixe seu comentário' },
    ]
  },
  {
    category: 'Contato',
    items: [
      { type: 'basic_email', label: 'E-mail', icon: Mail, defaultText: 'Seu melhor e-mail' },
      { type: 'basic_phone', label: 'Telefone', icon: Phone, defaultText: 'WhatsApp para contato' },
    ]
  },
  {
    category: 'Seleção',
    items: [
      { type: 'basic_select_single', label: 'Seleção Única', icon: MousePointerClick, defaultText: 'Selecione uma opção', hasOptions: true },
      { type: 'basic_select_multi', label: 'Seleção Múltipla', icon: LayoutList, defaultText: 'Selecione as opções', hasOptions: true },
      { type: 'basic_yes_no', label: 'Sim / Não', icon: CheckCircle2, defaultText: 'Você confirma?' },
    ]
  },
  {
    category: 'Mídia',
    items: [
      { type: 'basic_image', label: 'Upload de Imagem', icon: ImageIcon, defaultText: 'Envie uma foto' },
    ]
  }
];

// --- COMPONENTE DE PREVIEW INTERNO (Mini Wizard Completo) ---
const PreviewWizard = ({ questions, metadata, themeColor = '#2A8CB4' }: any) => {
    const [step, setStep] = useState(0);
    const [started, setStarted] = useState(false);
    const [finished, setFinished] = useState(false);
    const [answers, setAnswers] = useState<any>({});
    
    // Reset ao mudar metadados
    useEffect(() => { 
      setStep(0); 
      setStarted(false); 
      setFinished(false);
      setAnswers({}); 
    }, [questions.length, metadata]);

    const handleNext = () => { 
      if (step < questions.length - 1) {
        setStep(step + 1); 
      } else {
        setFinished(true);
      }
    };
    
    const handlePrev = () => { 
      if (step > 0) setStep(step - 1); 
    };

    // --- TELA DE BOAS VINDAS ---
    if (!started) {
      return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-900">
           {metadata.background_image && (
              <img src={metadata.background_image} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="bg" />
           )}
           <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
              {metadata.logo_image && (
                 <img src={metadata.logo_image} className="w-20 h-20 rounded-2xl mb-6 bg-white p-2 object-contain shadow-lg" alt="logo" />
              )}
              <h1 className="text-2xl font-black text-white mb-4 leading-tight">{metadata.title || 'Título do Formulário'}</h1>
              <p className="text-slate-300 text-sm mb-8 font-medium">{metadata.welcome_message || 'Bem-vindo! Toque abaixo para começar.'}</p>
              <button 
                onClick={() => setStarted(true)}
                className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white shadow-xl hover:scale-105 transition-all"
                style={{ backgroundColor: themeColor }}
              >
                Iniciar Coleta
              </button>
           </div>
        </div>
      );
    }

    // --- TELA FINAL ---
    if (finished) {
       return (
         <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#f0f4f8] relative overflow-hidden">
            <div className="w-full h-2 absolute top-0 left-0" style={{backgroundColor: themeColor}}></div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in" style={{backgroundColor: `${themeColor}20`, color: themeColor}}>
               <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">Obrigado!</h2>
            <p className="text-slate-500 text-sm">{metadata.thank_you_message || 'Sua resposta foi registrada com sucesso.'}</p>
            <button 
               onClick={() => { setStarted(false); setFinished(false); setStep(0); }}
               className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600"
            >
               Reiniciar Preview
            </button>
         </div>
       );
    }

    // --- TELA DE PERGUNTAS ---
    if (!questions || questions.length === 0) return <div className="p-8 text-center text-slate-400">Adicione perguntas.</div>;

    const question = questions[step];
    const progress = ((step + 1) / questions.length) * 100;

    const renderPreviewInput = () => {
        // Lógica simplificada de renderização para preview
        if (question.type === 'geo_complete') {
            return (
                <div className="space-y-3 w-full">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 flex justify-between">País (Brasil) <ChevronDown size={14}/></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 flex justify-between">Estado... <ChevronDown size={14}/></div>
                </div>
            );
        }
        if (question.type === 'sat_nps') {
            return <div className="grid grid-cols-6 gap-2">{[0,2,4,6,8,10].map(n=><div key={n} className="aspect-square border rounded-lg flex items-center justify-center text-[10px] text-slate-400">{n}</div>)}</div>;
        }
        return <div className="w-full h-20 rounded-xl border-2 border-slate-100 bg-white p-3 text-xs text-slate-400">Campo de resposta...</div>;
    };

    return (
        <div className="h-full flex flex-col bg-[#f0f4f8]">
            <div className="bg-white p-6 rounded-b-[2rem] shadow-sm mb-4 shrink-0">
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
                    <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: themeColor }}></div>
                </div>
                <h3 className="text-lg font-black text-slate-800 leading-tight">{question.label}</h3>
            </div>
            
            <div className="flex-1 p-6 flex flex-col justify-center overflow-y-auto">
                {renderPreviewInput()}
            </div>

            <div className="p-6 shrink-0 flex gap-3">
                 <button onClick={handlePrev} disabled={step===0} className="p-3 rounded-xl bg-white text-slate-400 disabled:opacity-50"><ArrowLeft size={20}/></button>
                 <button onClick={handleNext} className="flex-1 py-3 rounded-xl font-bold text-white text-xs uppercase tracking-widest shadow-lg" style={{backgroundColor: themeColor}}>
                    {step===questions.length-1 ? 'Finalizar' : 'Próxima'}
                 </button>
            </div>
        </div>
    );
};

export default function FormBuilder() {
  const { user } = useContext(AuthContext); // Acesso ao usuário logado para personalização do link
  
  // --- DASHBOARD STATES ---
  const [view, setView] = useState<'dashboard' | 'editor' | 'preview'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // --- EDITOR STATES ---
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  
  // METADADOS DO FORMULÁRIO (Incluindo Design)
  const [formMetadata, setFormMetadata] = useState({ 
    title: '', 
    description: '', 
    status: 'Rascunho',
    welcome_message: '',
    thank_you_message: '',
    logo_image: '',
    background_image: '',
    theme_color: '#2A8CB4'
  });

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toolboxTab, setToolboxTab] = useState<'bi' | 'basic' | 'design'>('bi');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Aux Data
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [linkedData, setLinkedData] = useState({ eventId: '', groupId: '' });

  useEffect(() => {
    fetchForms();
    fetchAuxData();
  }, []);

  // --- API CALLS ---
  const fetchForms = async () => {
    setLoading(true);
    const { data } = await supabase.from('forms').select('*, events(name), tourist_groups(name)').order('created_at', { ascending: false });
    
    if (data) {
        const withCounts = await Promise.all(data.map(async (f) => {
             const { count } = await supabase.from('responses').select('*', { count: 'exact', head: true }).eq('form_id', f.id);
             return { ...f, response_count: count || 0 };
        }));
        setForms(withCounts);
    }
    setLoading(false);
  };

  const fetchAuxData = async () => {
    const { data: ev } = await supabase.from('events').select('id, name');
    if (ev) setEvents(ev);
    const { data: gr } = await supabase.from('tourist_groups').select('id, name');
    if (gr) setGroups(gr);
  };

  // --- ACTIONS ---
  const handleOpenEditor = (form?: any) => {
    if (form) {
      setActiveFormId(form.id);
      setFormMetadata({ 
        title: form.title, 
        description: form.description || '', 
        status: form.status || 'Rascunho',
        welcome_message: form.welcome_message_pt || '',
        thank_you_message: form.thank_you_message_pt || '',
        logo_image: form.logo_image || '',
        background_image: form.background_image || '',
        theme_color: form.theme_color || '#2A8CB4'
      });
      setQuestions(form.questions || []);
      setLinkedData({ eventId: form.linked_event_id || '', groupId: form.linked_group_id || '' });
    } else {
      setActiveFormId(null);
      setFormMetadata({ 
        title: 'Novo Formulário', 
        description: '', 
        status: 'Rascunho',
        welcome_message: '',
        thank_you_message: '',
        logo_image: '',
        background_image: '',
        theme_color: '#2A8CB4'
      });
      setQuestions([]);
      setLinkedData({ eventId: '', groupId: '' });
    }
    setView('editor');
    setSelectedQuestionId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title: formMetadata.title,
      description: formMetadata.description,
      status: formMetadata.status,
      welcome_message_pt: formMetadata.welcome_message,
      thank_you_message_pt: formMetadata.thank_you_message,
      logo_image: formMetadata.logo_image,
      background_image: formMetadata.background_image,
      theme_color: formMetadata.theme_color,
      questions: questions,
      linked_event_id: linkedData.eventId || null,
      linked_group_id: linkedData.groupId || null
    };

    try {
      if (activeFormId) {
        await supabase.from('forms').update(payload).eq('id', activeFormId);
      } else {
        const { data } = await supabase.from('forms').insert([payload]).select().single();
        if (data) setActiveFormId(data.id);
      }
      await fetchForms();
      setView('dashboard');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir este formulário?")) return;
    await supabase.from('forms').delete().eq('id', id);
    setForms(prev => prev.filter(f => f.id !== id));
  };

  // --- IMAGE HANDLER (Base64 for simplicity) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_image' | 'background_image') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormMetadata(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- QUESTION LOGIC ---
  const addQuestion = (item: any) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newQ = {
      id: newId,
      type: item.type,
      label: item.defaultText,
      bi_tag: `q_${Date.now()}`,
      required: true,
      options: item.hasOptions && !item.fixedOptions ? ['Opção 1', 'Opção 2'] : undefined,
      fixedOptions: item.fixedOptions || false
    };
    setQuestions([...questions, newQ]);
    setSelectedQuestionId(newId);
  };

  const updateQuestion = (id: string, field: string, val: any) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: val } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (selectedQuestionId === id) setSelectedQuestionId(null);
  };

  const duplicateQuestion = (id: string) => {
    const q = questions.find(q => q.id === id);
    if (q) {
      const newId = Math.random().toString(36).substr(2, 9);
      const newQ = { ...q, id: newId, label: `${q.label} (Cópia)`, bi_tag: `q_${Date.now()}` };
      setQuestions([...questions, newQ]);
      setSelectedQuestionId(newId);
    }
  };

  const moveQuestion = (idx: number, direction: -1 | 1) => {
    if (idx + direction < 0 || idx + direction >= questions.length) return;
    const newQ = [...questions];
    const temp = newQ[idx];
    newQ[idx] = newQ[idx + direction];
    newQ[idx + direction] = temp;
    setQuestions(newQ);
  };

  // Gerador de Link Inteligente
  const getPublicLink = () => {
      if (!activeFormId) return '';
      const baseURL = window.location.origin + window.location.pathname;
      let url = `${baseURL}#/public/form/${activeFormId}`;
      
      // Se tiver usuário logado, adiciona automaticamente a referência
      if (user && user.id) {
          url += `?ref=${user.id}`;
      }
      return url;
  };

  // --- RENDER DASHBOARD ---
  if (view === 'dashboard') {
    const filtered = forms.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (
      <div className="animate-in fade-in pb-20">
        <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-4xl font-extrabold text-[#2A8CB4] tracking-tight">Formulários</h2>
              <p className="text-slate-400 font-medium mt-1">Crie, gerencie e analise suas pesquisas turísticas</p>
            </div>
            <button 
                onClick={() => handleOpenEditor()}
                className="flex items-center gap-2 bg-[#2A8CB4] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-sky-100 hover:bg-[#1a6b8a] transition-all"
            >
              <Plus size={18} /> Novo Formulário
            </button>
        </div>

        {/* LIST */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-8 flex gap-4">
             <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar formulários..." className="w-full pl-12 pr-4 py-3 bg-transparent outline-none font-medium text-slate-600 text-sm" />
             </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#2A8CB4]" size={40}/></div> : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(form => (
                  <div key={form.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative group hover:shadow-lg transition-all h-[320px]">
                      <div className="absolute top-6 right-6 flex gap-2">
                          <button onClick={() => handleDelete(form.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                      </div>
                      <div className="mb-4 pr-10">
                          <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-2 min-h-[3.5rem]">{form.title}</h3>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${form.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{form.status}</span>
                      </div>
                      <div className="mb-6">
                           {(form.events?.name || form.tourist_groups?.name) ? (
                               <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-2 rounded-xl text-[10px] font-bold uppercase">
                                   <Calendar size={12} /> {form.events?.name || form.tourist_groups?.name}
                               </div>
                           ) : <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-400 px-3 py-2 rounded-xl text-[10px] font-bold uppercase"><LayoutTemplate size={12}/> Geral</div>}
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 mt-auto mb-4">
                           <div><p className="text-[10px] font-bold text-slate-400 uppercase">Respostas</p><p className="text-xl font-black text-slate-800">{form.response_count}</p></div>
                           <div><p className="text-[10px] font-bold text-slate-400 uppercase">Conclusão</p><p className="text-xl font-black text-slate-800">{form.response_count > 0 ? '100%' : '0%'}</p></div>
                      </div>
                      <button onClick={() => handleOpenEditor(form)} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold uppercase text-xs hover:bg-slate-50 flex items-center justify-center gap-2">
                          <Edit3 size={14} /> Editar
                      </button>
                  </div>
              ))}
           </div>
        )}
      </div>
    );
  }

  // --- RENDER PREVIEW MODE ---
  if (view === 'preview') {
      return (
          <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <button onClick={() => setView('editor')} className="absolute top-8 right-8 text-white/50 hover:text-white"><X size={32}/></button>
              
              <div className="w-full max-w-sm h-[80vh] bg-black rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
                  
                  {/* Screen Content */}
                  <div className="flex-1 bg-white overflow-hidden relative">
                      <PreviewWizard 
                        questions={questions} 
                        metadata={formMetadata}
                        themeColor={formMetadata.theme_color} 
                      />
                  </div>

                  {/* Phone Chin */}
                  <div className="h-2 bg-black w-full shrink-0"></div>
              </div>

              <div className="absolute bottom-10 text-white text-center">
                  <p className="font-bold text-lg">Modo de Visualização</p>
                  <p className="text-white/60 text-sm">É assim que o turista verá o formulário no celular.</p>
              </div>
          </div>
      );
  }

  // --- RENDER EDITOR (3 PANE STUDIO) ---
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const currentToolbox = toolboxTab === 'bi' ? BI_ITEMS : BASIC_ITEMS;

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] flex flex-col animate-in fade-in duration-300">
       
       {/* 1. TOP BAR */}
       <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={20}/></button>
             <div className="h-6 w-px bg-slate-200"></div>
             <input 
               value={formMetadata.title} 
               onChange={e => setFormMetadata({...formMetadata, title: e.target.value})}
               className="font-black text-slate-800 text-lg outline-none bg-transparent placeholder:text-slate-300 w-96" 
               placeholder="Título do Formulário" 
             />
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setView('preview')} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2">
                 <Eye size={16}/> Visualizar
             </button>
             {activeFormId && (
                <button onClick={() => setIsShareModalOpen(true)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2">
                    <Share2 size={16}/> Compartilhar
                </button>
             )}
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <span className={`w-2 h-2 rounded-full ${formMetadata.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                <select 
                  value={formMetadata.status}
                  onChange={e => setFormMetadata({...formMetadata, status: e.target.value})}
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer uppercase"
                >
                   <option>Rascunho</option>
                   <option>Ativo</option>
                   <option>Pausado</option>
                </select>
             </div>
             <button onClick={handleSave} disabled={saving} className="bg-[#2A8CB4] text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-sky-100 hover:bg-[#1a6b8a] transition-all flex items-center gap-2">
                 {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Salvar
             </button>
          </div>
       </div>

       {/* 2. MAIN WORKSPACE (3 COLUMNS) */}
       <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: TOOLBOX & DESIGN */}
          <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar z-10">
             
             {/* TABS SELECTOR */}
             <div className="p-4 flex gap-1 border-b border-slate-50">
                 <button 
                   onClick={() => setToolboxTab('bi')}
                   title="Métricas BI"
                   className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${toolboxTab === 'bi' ? 'bg-[#2A8CB4] text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                 >
                    BI
                 </button>
                 <button 
                   onClick={() => setToolboxTab('basic')}
                   title="Campos Básicos"
                   className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${toolboxTab === 'basic' ? 'bg-[#2A8CB4] text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                 >
                    Básico
                 </button>
                 <button 
                   onClick={() => setToolboxTab('design')}
                   title="Design e Aparência"
                   className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${toolboxTab === 'design' ? 'bg-[#2A8CB4] text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                 >
                    <Palette size={16} className="mx-auto"/>
                 </button>
             </div>

             <div className="p-6">
                
                {toolboxTab === 'design' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Aparência do Formulário</h4>
                        
                        {/* Imagem de Fundo */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">Imagem de Fundo</label>
                            <label className="block w-full h-32 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer overflow-hidden relative">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'background_image')} />
                                {formMetadata.background_image ? (
                                    <img src={formMetadata.background_image} className="w-full h-full object-cover" alt="bg" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon size={24} />
                                        <span className="text-[10px] mt-1 font-bold">Enviar Imagem</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Logo */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">Logotipo</label>
                            <label className="block w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer overflow-hidden relative">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo_image')} />
                                {formMetadata.logo_image ? (
                                    <img src={formMetadata.logo_image} className="w-full h-full object-contain p-2" alt="logo" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                        <Upload size={24} />
                                        <span className="text-[10px] mt-1 font-bold">Enviar Logo</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Mensagens */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">Mensagem de Boas-vindas</label>
                            <textarea 
                                value={formMetadata.welcome_message}
                                onChange={e => setFormMetadata({...formMetadata, welcome_message: e.target.value})}
                                placeholder="Ex: Olá! Responda nossa pesquisa e ajude a melhorar o turismo."
                                className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-[#2A8CB4] min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">Mensagem de Agradecimento</label>
                            <textarea 
                                value={formMetadata.thank_you_message}
                                onChange={e => setFormMetadata({...formMetadata, thank_you_message: e.target.value})}
                                placeholder="Ex: Obrigado pela sua participação!"
                                className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-[#2A8CB4] min-h-[80px]"
                            />
                        </div>

                        {/* Cor do Tema */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">Cor Principal</label>
                            <div className="flex gap-2 flex-wrap">
                                {['#2A8CB4', '#79954C', '#6366f1', '#ec4899', '#f59e0b', '#0f172a'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setFormMetadata({...formMetadata, theme_color: c})}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${formMetadata.theme_color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                ) : (
                    <>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                            {toolboxTab === 'bi' ? 'Inteligência Turística' : 'Campos Gerais'}
                        </h4>
                        
                        {currentToolbox.map((cat, i) => (
                        <div key={i} className="mb-8 animate-in fade-in slide-in-from-left-4">
                            <p className="text-[10px] font-bold text-[#2A8CB4] uppercase mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#2A8CB4]"></span>
                                {cat.category}
                            </p>
                            <div className="space-y-2">
                                {cat.items.map(item => (
                                    <button 
                                    key={item.type}
                                    onClick={() => addQuestion(item)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-[#2A8CB4] hover:bg-sky-50 hover:shadow-sm transition-all group text-left bg-slate-50/50"
                                    >
                                    <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-[#2A8CB4] shadow-sm transition-colors border border-slate-100">
                                        <item.icon size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800">{item.label}</span>
                                    <Plus size={14} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        ))}
                    </>
                )}
             </div>
          </div>

          {/* CENTER: CANVAS */}
          <div className="flex-1 bg-slate-100 overflow-y-auto custom-scrollbar p-10 flex flex-col items-center relative">
             <div className="w-full max-w-2xl pb-32 space-y-4">
                
                {/* Header Card (Static) */}
                <div className="bg-white p-8 rounded-t-[2rem] rounded-b-xl border-t-8 border-[#2A8CB4] shadow-sm" style={{borderColor: formMetadata.theme_color}}>
                   <h1 className="text-3xl font-black text-slate-800">{formMetadata.title || 'Sem Título'}</h1>
                   <textarea 
                     value={formMetadata.description}
                     onChange={e => setFormMetadata({...formMetadata, description: e.target.value})}
                     placeholder="Digite uma descrição para o formulário..."
                     className="w-full mt-4 text-sm text-slate-500 outline-none resize-none bg-transparent border-b border-transparent focus:border-slate-200 transition-colors"
                   />
                </div>

                {/* Questions List */}
                {questions.length === 0 ? (
                   <div className="border-2 border-dashed border-slate-300 rounded-[2rem] p-12 text-center bg-slate-50/50">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm"><LayoutTemplate size={32}/></div>
                      <h3 className="text-lg font-bold text-slate-500">Formulário Vazio</h3>
                      <p className="text-slate-400 text-sm mt-1">Selecione métricas inteligentes ou configure o design à esquerda.</p>
                   </div>
                ) : (
                   questions.map((q, idx) => {
                      // Encontrar metadata do item original para pegar ícone
                      const originalItem = [...BI_ITEMS, ...BASIC_ITEMS].flatMap(c => c.items).find(i => i.type === q.type);
                      const Icon = originalItem?.icon || FileText;

                      return (
                          <div 
                            key={q.id}
                            onClick={() => setSelectedQuestionId(q.id)}
                            className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all cursor-pointer group relative ${selectedQuestionId === q.id ? 'border-[#2A8CB4] ring-4 ring-sky-50 z-10' : 'border-transparent hover:border-slate-200'}`}
                            style={{borderColor: selectedQuestionId === q.id ? formMetadata.theme_color : undefined, boxShadow: selectedQuestionId === q.id ? `0 0 0 4px ${formMetadata.theme_color}20` : undefined}}
                          >
                            <div className="flex items-start gap-4">
                                <div className="mt-1 cursor-grab text-slate-300 hover:text-slate-500"><GripVertical size={20}/></div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className={`p-1.5 rounded-md ${q.fixedOptions ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                          <Icon size={14} />
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                          Questão {idx + 1} • {originalItem?.label}
                                      </p>
                                  </div>
                                  <p className="font-bold text-slate-800 text-lg">{q.label}</p>
                                  {q.required && <span className="text-red-500 text-xs font-bold mt-1 inline-block">* Obrigatório</span>}
                                  
                                  {/* Mock Visualization */}
                                  <div className="mt-4 pointer-events-none opacity-50">
                                      {q.fixedOptions ? (
                                         <div className="bg-purple-50 border border-purple-100 rounded-lg p-2 text-[10px] font-bold text-purple-600 inline-flex items-center gap-1">
                                             <Sparkles size={10} /> Opções Padronizadas pelo Sistema E-CIDTUR
                                         </div>
                                      ) : q.options ? (
                                        <div className="flex gap-2">
                                            {q.options.slice(0,3).map((o:string, i:number) => (
                                              <div key={i} className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50">{o}</div>
                                            ))}
                                            {q.options.length > 3 && <span className="text-xs text-slate-400">...</span>}
                                        </div>
                                      ) : (
                                        <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
                                      )}
                                  </div>
                                </div>
                            </div>
                            
                            {selectedQuestionId === q.id && (
                                <div className="absolute -right-12 top-0 flex flex-col gap-2 animate-in slide-in-from-left-2 fade-in">
                                  <button onClick={(e) => {e.stopPropagation(); duplicateQuestion(q.id)}} className="p-2 bg-white text-slate-500 hover:text-[#2A8CB4] rounded-full shadow-md border border-slate-100"><Copy size={16}/></button>
                                  <button onClick={(e) => {e.stopPropagation(); deleteQuestion(q.id)}} className="p-2 bg-white text-slate-500 hover:text-red-500 rounded-full shadow-md border border-slate-100"><Trash2 size={16}/></button>
                                  <div className="h-px bg-slate-300 w-4 mx-auto my-1"></div>
                                  <button onClick={(e) => {e.stopPropagation(); moveQuestion(idx, -1)}} disabled={idx===0} className="p-2 bg-white text-slate-500 hover:text-slate-800 rounded-full shadow-md border border-slate-100 disabled:opacity-50"><ChevronUp size={16}/></button>
                                  <button onClick={(e) => {e.stopPropagation(); moveQuestion(idx, 1)}} disabled={idx===questions.length-1} className="p-2 bg-white text-slate-500 hover:text-slate-800 rounded-full shadow-md border border-slate-100 rotate-180 disabled:opacity-50"><ChevronUp size={16}/></button>
                                </div>
                            )}
                          </div>
                      );
                   })
                )}
             </div>
          </div>

          {/* RIGHT: PROPERTIES */}
          <div className="w-[320px] bg-white border-l border-slate-200 flex flex-col z-10">
             {selectedQuestion ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                   <div className="mb-6 flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Propriedades</h4>
                      <button onClick={() => deleteQuestion(selectedQuestion.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Pergunta</label>
                         <textarea 
                           className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-[#2A8CB4] outline-none font-medium min-h-[80px]"
                           value={selectedQuestion.label}
                           onChange={e => updateQuestion(selectedQuestion.id, 'label', e.target.value)}
                         />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <span className="text-sm font-bold text-slate-700">Obrigatória</span>
                         <button 
                           onClick={() => updateQuestion(selectedQuestion.id, 'required', !selectedQuestion.required)}
                           className={`w-10 h-6 rounded-full p-1 transition-colors ${selectedQuestion.required ? 'bg-[#2A8CB4]' : 'bg-slate-300'}`}
                           style={{backgroundColor: selectedQuestion.required ? formMetadata.theme_color : undefined}}
                         >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${selectedQuestion.required ? 'translate-x-4' : ''}`}></div>
                         </button>
                      </div>

                      {/* Options Editor (Only if NOT fixed options) */}
                      {selectedQuestion.options && !selectedQuestion.fixedOptions && (
                         <div className="space-y-3 pt-4 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-500 uppercase">Opções de Resposta</label>
                            <div className="space-y-2">
                               {selectedQuestion.options.map((opt: string, idx: number) => (
                                  <div key={idx} className="flex gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5"></div>
                                     <input 
                                       value={opt}
                                       onChange={e => {
                                          const newOpts = [...selectedQuestion.options];
                                          newOpts[idx] = e.target.value;
                                          updateQuestion(selectedQuestion.id, 'options', newOpts);
                                       }}
                                       className="flex-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#2A8CB4] outline-none text-sm font-medium text-slate-700 pb-1"
                                     />
                                     <button 
                                        onClick={() => {
                                            const newOpts = [...selectedQuestion.options];
                                            newOpts.splice(idx, 1);
                                            updateQuestion(selectedQuestion.id, 'options', newOpts);
                                        }}
                                        className="text-slate-300 hover:text-red-500"
                                     ><X size={14}/></button>
                                  </div>
                               ))}
                            </div>
                            <button 
                              onClick={() => updateQuestion(selectedQuestion.id, 'options', [...selectedQuestion.options, 'Nova Opção'])}
                              className="text-xs font-bold text-[#2A8CB4] flex items-center gap-1 hover:underline"
                              style={{color: formMetadata.theme_color}}
                            >
                               <Plus size={12} /> Adicionar Opção
                            </button>
                         </div>
                      )}
                      
                      {selectedQuestion.fixedOptions && (
                          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-xs text-purple-700 font-medium">
                              <p className="font-bold mb-1 flex items-center gap-2"><Sparkles size={12}/> Opções Gerenciadas pelo Sistema</p>
                              As opções desta pergunta são padronizadas globalmente para garantir a integridade dos relatórios de BI.
                          </div>
                      )}

                      {/* Advanced Settings */}
                      <div className="pt-6 border-t border-slate-100 space-y-4">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase">Avançado</h5>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">BI Tag (Variável)</label>
                            <input 
                              value={selectedQuestion.bi_tag}
                              disabled
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400">Identificador único usado para relatórios de BI.</p>
                         </div>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                   <Settings size={48} className="text-slate-200 mb-4" />
                   <p className="text-slate-400 font-bold text-xs uppercase">Nenhuma questão selecionada</p>
                   <p className="text-slate-400 text-xs mt-2">Clique em uma questão no centro para editar seus detalhes.</p>
                </div>
             )}

             {/* FORM SETTINGS */}
             <div className="p-6 border-t border-slate-200 bg-slate-50">
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Vínculos</h4>
                 <div className="space-y-3">
                     <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Evento</label>
                         <select 
                           value={linkedData.eventId} 
                           onChange={e => setLinkedData({...linkedData, eventId: e.target.value})}
                           className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                         >
                            <option value="">Nenhum</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                         </select>
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Grupo</label>
                         <select 
                           value={linkedData.groupId} 
                           onChange={e => setLinkedData({...linkedData, groupId: e.target.value})}
                           className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                         >
                            <option value="">Nenhum</option>
                            {groups.map(gr => <option key={gr.id} value={gr.id}>{gr.name}</option>)}
                         </select>
                     </div>
                 </div>
             </div>
          </div>
       </div>

       {/* MODAL DE COMPARTILHAMENTO */}
       {isShareModalOpen && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}></div>
             <div className="bg-white rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in w-full max-w-md text-center">
                 <button onClick={() => setIsShareModalOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={24}/></button>
                 
                 <h3 className="text-2xl font-black text-slate-800 mb-2">Compartilhar Formulário</h3>
                 <p className="text-slate-400 text-sm font-medium mb-8">Utilize o QR Code abaixo para coletas em campo.</p>
                 
                 <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-200 inline-block mb-8 shadow-inner">
                     <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getPublicLink())}`} 
                       alt="QR Code" 
                       className="w-48 h-48 mix-blend-multiply" 
                     />
                 </div>
                 
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left mb-6">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                        Link de Coleta
                        {user?.id && <span className="text-[#2A8CB4] flex items-center gap-1"><UserCheck size={10} /> Identificado como {user.name}</span>}
                     </p>
                     <p className="text-xs text-[#2A8CB4] font-bold truncate">{getPublicLink()}</p>
                 </div>

                 <div className="flex gap-3">
                     <button 
                       onClick={() => navigator.clipboard.writeText(getPublicLink())}
                       className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                     >
                         <LinkIcon size={16} /> Copiar
                     </button>
                     <a 
                       href={getPublicLink()}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex-1 py-3 bg-[#2A8CB4] text-white rounded-xl font-bold text-xs uppercase hover:bg-[#1a6b8a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
                     >
                         <ExternalLink size={16} /> Abrir
                     </a>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-6 max-w-xs mx-auto">
                    {user?.id 
                        ? "Este QR Code é exclusivo seu. Todas as coletas feitas por ele contarão para sua meta."
                        : "Nota: Pesquisadores logados devem usar o QR Code do seu próprio perfil para contabilizar pontos. Este link é genérico."
                    }
                 </p>
             </div>
         </div>
      )}
    </div>
  );
}
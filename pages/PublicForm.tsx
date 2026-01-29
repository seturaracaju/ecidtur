import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Star, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Loader2, MapPin, ChevronDown, Check, FileUp, Phone, Mail, Calendar, CheckSquare, Image as ImageIcon } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import { LOGOS, FORM_OPTIONS } from '../constants';
import { Country, State, City } from 'country-state-city';

// --- COMPONENTE DE CARD SELECIONÁVEL (UX Mobile First) ---
interface SelectionCardProps {
  value: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  themeColor: string;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ value, label, selected, onClick, themeColor }) => (
  <button
    onClick={onClick}
    className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group transform active:scale-[0.98] ${
      selected 
        ? 'bg-white border-transparent shadow-lg relative overflow-hidden' 
        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
    }`}
    style={{ borderColor: selected ? themeColor : undefined }}
  >
    {/* Background Tint quando selecionado */}
    {selected && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: themeColor }}></div>}

    <span className={`text-base font-bold relative z-10 ${selected ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
      {label}
    </span>
    
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all relative z-10 ${
      selected ? 'border-transparent' : 'border-slate-200 bg-slate-50'
    }`} style={{ backgroundColor: selected ? themeColor : undefined }}>
      {selected && <Check size={14} className="text-white animate-in zoom-in duration-200" />}
    </div>
  </button>
);

export default function PublicForm() {
  const [searchParams] = useSearchParams();
  const { id: formId } = useParams();
  const surveyorId = searchParams.get('ref');

  const [form, setForm] = useState<any>(null);
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [loadingForm, setLoadingForm] = useState(true);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  // Geo States (Controle local para dropdowns dependentes)
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  // Ref para timer do Auto-Advance
  const autoAdvanceRef = useRef<any>(null);
  
  useEffect(() => {
    fetchForm();
    captureLocation();
    
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [formId]);

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Localização negada ou indisponível")
      );
    }
  };

  const fetchForm = async () => {
    setLoadingForm(true);
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    
    if (!error && data) setForm(data);
    setLoadingForm(false);
  };

  const handleNext = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    
    if (currentStep < (form?.questions?.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
      // Resetar estados temporários de Geo para a próxima pergunta (se houver)
      setSelectedCountry('');
      setSelectedState('');
    } else {
      submitAndFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      setCurrentStep(currentStep - 1);
    }
  };

  // Lógica de Seleção com Auto-Advance
  const handleSelection = (key: string, value: any, shouldAutoAdvance = true) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    
    // Só avança se não for a última pergunta e se o modo auto-advance estiver ativo
    if (shouldAutoAdvance && currentStep < (form?.questions?.length || 0) - 1) {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      
      // Delay de 450ms para o usuário perceber visualmente a seleção antes de trocar
      autoAdvanceRef.current = setTimeout(() => {
        handleNext();
      }, 450);
    }
  };

  const submitAndFinish = async () => {
    setIsFinished(true);
    setLoadingIA(true);

    try {
      await supabase.from('responses').insert([{
        form_id: formId,
        surveyor_id: surveyorId,
        answers: answers, // CORREÇÃO: 'answers' em vez de 'content'
        lat: location?.lat,
        lng: location?.lng,
        created_at: new Date().toISOString()
      }]);

      if (surveyorId) {
        // Tenta incrementar pontos via RPC, se falhar não trava o fluxo
        try {
          await supabase.rpc('increment_user_points', { 
            user_id: surveyorId, 
            points_to_add: 10 
          });
        } catch (err) { console.error("Erro ao pontuar:", err); }
      }

      const result = await geminiService.generateItinerary(answers);
      setItinerary(result);
    } catch (e) {
      console.error(e);
      setItinerary("Obrigado! Suas respostas ajudarão a melhorar o turismo em Aracaju.");
    } finally {
      setLoadingIA(false);
    }
  };

  // Função utilitária para conversão de imagem para base64
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Armazena string base64
        setAnswers(prev => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const themeColor = form?.theme_color || '#2A8CB4';

  // --- RENDERIZADOR DE INPUTS INTELIGENTE ---
  const renderInput = (question: any) => {
    // 0. NOVOS TIPOS BÁSICOS
    
    if (question.type === 'basic_yes_no') {
      return (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in">
           {['Sim', 'Não'].map(opt => (
             <button 
               key={opt}
               onClick={() => handleSelection(question.bi_tag, opt)}
               className={`p-8 rounded-3xl border-2 font-black text-2xl transition-all ${answers[question.bi_tag] === opt ? 'bg-white shadow-xl border-transparent scale-105' : 'bg-white border-slate-100 hover:border-slate-200'}`}
               style={{ color: answers[question.bi_tag] === opt ? themeColor : '#94a3b8', borderColor: answers[question.bi_tag] === opt ? themeColor : undefined }}
             >
               {opt}
             </button>
           ))}
        </div>
      );
    }

    if (question.type === 'basic_text_short') {
       return <input className="w-full p-6 rounded-3xl bg-white border-2 border-slate-100 outline-none font-bold text-xl text-slate-700 shadow-sm focus:border-current transition-all" placeholder="Sua resposta..." style={{borderColor: answers[question.bi_tag] ? themeColor : undefined}} value={answers[question.bi_tag]||''} onChange={e=>setAnswers({...answers, [question.bi_tag]: e.target.value})} />;
    }

    if (question.type === 'basic_text_long') {
      return <textarea className="w-full p-6 rounded-3xl bg-white border-2 border-slate-100 outline-none font-bold text-xl h-48 resize-none text-slate-700 shadow-sm focus:border-current transition-all" placeholder="Digite sua resposta detalhada..." style={{borderColor: answers[question.bi_tag] ? themeColor : undefined}} value={answers[question.bi_tag]||''} onChange={e=>setAnswers({...answers, [question.bi_tag]: e.target.value})} />;
    }

    if (question.type === 'basic_email') {
      return <div className="relative"><Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} /><input type="email" className="w-full pl-16 p-6 rounded-3xl bg-white border-2 border-slate-100 outline-none font-bold text-xl text-slate-700 shadow-sm focus:border-current transition-all" placeholder="exemplo@email.com" style={{borderColor: answers[question.bi_tag] ? themeColor : undefined}} value={answers[question.bi_tag]||''} onChange={e=>setAnswers({...answers, [question.bi_tag]: e.target.value})} /></div>;
    }

    if (question.type === 'basic_phone') {
      return <div className="relative"><Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} /><input type="tel" className="w-full pl-16 p-6 rounded-3xl bg-white border-2 border-slate-100 outline-none font-bold text-xl text-slate-700 shadow-sm focus:border-current transition-all" placeholder="(00) 00000-0000" style={{borderColor: answers[question.bi_tag] ? themeColor : undefined}} value={answers[question.bi_tag]||''} onChange={e=>setAnswers({...answers, [question.bi_tag]: e.target.value})} /></div>;
    }

    if (question.type === 'basic_date') {
      return <div className="relative"><Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} /><input type="date" className="w-full pl-16 p-6 rounded-3xl bg-white border-2 border-slate-100 outline-none font-bold text-xl text-slate-700 shadow-sm focus:border-current transition-all" style={{borderColor: answers[question.bi_tag] ? themeColor : undefined}} value={answers[question.bi_tag]||''} onChange={e=>setAnswers({...answers, [question.bi_tag]: e.target.value})} /></div>;
    }

    if (question.type === 'basic_select_single') {
       const opts = question.options || [];
       return (
        <div className="grid grid-cols-1 gap-3 w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
           {opts.map((opt: string) => (
             <SelectionCard 
                key={opt}
                value={opt}
                label={opt}
                selected={answers[question.bi_tag] === opt}
                onClick={() => handleSelection(question.bi_tag, opt)}
                themeColor={themeColor}
             />
           ))}
        </div>
       );
    }

    if (question.type === 'basic_select_multi') {
       const opts = question.options || [];
       const currentSelection = answers[question.bi_tag] || [];
       
       const toggleOption = (val: string) => {
          const newSelection = currentSelection.includes(val)
             ? currentSelection.filter((i:string) => i !== val)
             : [...currentSelection, val];
          setAnswers({...answers, [question.bi_tag]: newSelection});
       };

       return (
        <div className="grid grid-cols-1 gap-3 w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
           {opts.map((opt: string) => {
             const isSelected = currentSelection.includes(opt);
             return (
               <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group transform active:scale-[0.98] ${
                    isSelected 
                      ? 'bg-white border-transparent shadow-lg' 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                  style={{ borderColor: isSelected ? themeColor : undefined }}
                >
                  <span className={`text-base font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                    {opt}
                  </span>
                  {isSelected ? <CheckSquare size={24} style={{color: themeColor}} /> : <div className="w-6 h-6 border-2 border-slate-200 rounded-md"></div>}
               </button>
             );
           })}
           <div className="text-center text-xs text-slate-400 font-bold uppercase mt-4">Pode selecionar várias opções</div>
        </div>
       );
    }

    if (question.type === 'basic_image') {
       const preview = answers[question.bi_tag];
       return (
         <div className="w-full animate-in zoom-in">
            <label className={`w-full h-64 rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 relative overflow-hidden ${preview ? 'border-transparent' : 'border-slate-200'}`}>
               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, question.bi_tag)} />
               {preview ? (
                 <>
                   <img src={preview as string} alt="Preview" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold flex items-center gap-2"><ImageIcon /> Trocar Imagem</span>
                   </div>
                 </>
               ) : (
                 <div className="text-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                       <FileUp size={32} />
                    </div>
                    <p className="font-black uppercase tracking-widest text-xs">Toque para enviar foto</p>
                    <p className="text-xs mt-2">Formatos: JPG, PNG</p>
                 </div>
               )}
            </label>
         </div>
       );
    }

    // MAPA DE TIPOS BI (Atualizado com novos campos deconstants.tsx)
    const OPTIONS_MAP: Record<string, string[]> = {
      'demo_gender': FORM_OPTIONS.gender,
      'demo_age_range': FORM_OPTIONS.ageRanges,
      'demo_education': FORM_OPTIONS.education,
      'demo_income': FORM_OPTIONS.income,
      'demo_occupation': FORM_OPTIONS.occupation,
      'geo_transport': FORM_OPTIONS.transport,
      'demo_company': FORM_OPTIONS.company,
      'trip_accommodation': FORM_OPTIONS.accommodation,
      'trip_motive': FORM_OPTIONS.tripMotive,
      'trip_stay': FORM_OPTIONS.stayDuration,
      'sat_cleaning': ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'],
      'sat_security': ['Muito Inseguro', 'Inseguro', 'Neutro', 'Seguro', 'Muito Seguro'],
      'sat_prices': ['Muito Caro', 'Caro', 'Justo', 'Barato', 'Muito Barato'],
      'sat_service': ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']
    };

    const optionsList = OPTIONS_MAP[question.type];

    // 1. INPUTS DE SELEÇÃO (CARDS ou DROPDOWN)
    if (optionsList) {
      const useCards = optionsList.length <= 6;

      if (useCards) {
        return (
          <div className="grid grid-cols-1 gap-3 w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
             {optionsList.map((opt) => (
               <SelectionCard 
                  key={opt}
                  value={opt}
                  label={opt}
                  selected={answers[question.bi_tag] === opt}
                  onClick={() => handleSelection(question.bi_tag, opt)}
                  themeColor={themeColor}
               />
             ))}
          </div>
        );
      } else {
        return (
          <div className="w-full relative animate-in slide-in-from-bottom-4 fade-in duration-500">
             <div className="relative group">
               <select 
                 className="w-full p-6 pr-12 rounded-3xl bg-white border-2 border-slate-100 outline-none font-bold text-lg text-slate-700 appearance-none focus:border-current transition-all shadow-sm cursor-pointer hover:border-slate-300"
                 style={{ borderColor: answers[question.bi_tag] ? themeColor : undefined }}
                 value={answers[question.bi_tag] || ''}
                 onChange={(e) => handleSelection(question.bi_tag, e.target.value, false)}
               >
                 <option value="">Toque para selecionar...</option>
                 {optionsList.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
               <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none p-2 bg-slate-50 rounded-full group-hover:bg-slate-100 transition-colors">
                 <ChevronDown className="text-slate-400" size={20} />
               </div>
             </div>
             {answers[question.bi_tag] && (
               <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest animate-in fade-in text-slate-400">
                 <CheckCircle2 size={14} style={{ color: themeColor }} /> Opção registrada
               </div>
             )}
          </div>
        );
      }
    }

    // 2. SATISFAÇÃO GERAL (Estrelas)
    if (question.type === 'sat_overall') {
      return (
        <div className="flex flex-col items-center animate-in zoom-in duration-500">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <Star 
                key={s} 
                size={48} 
                className={`cursor-pointer transition-all hover:scale-110 active:scale-95 ${answers[question.bi_tag] >= s ? 'drop-shadow-md' : 'text-slate-100'}`} 
                style={{ color: answers[question.bi_tag] >= s ? '#F59E0B' : undefined }} 
                fill={answers[question.bi_tag] >= s ? 'currentColor' : 'none'}
                onClick={() => handleSelection(question.bi_tag, s)} 
              />
            ))}
          </div>
          <p className="text-slate-400 text-sm font-bold">
            {answers[question.bi_tag] ? `${answers[question.bi_tag]} de 5 estrelas` : 'Toque nas estrelas para avaliar'}
          </p>
        </div>
      );
    }

    // 3. NPS (0 a 10)
    if (question.type === 'sat_nps') {
      return (
        <div className="animate-in zoom-in duration-500">
          <div className="grid grid-cols-6 gap-2 sm:gap-3 justify-items-center">
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
              <button 
                key={n} 
                onClick={() => handleSelection(question.bi_tag, n)} 
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 font-black transition-all text-sm sm:text-base ${
                  answers[question.bi_tag] === n 
                  ? 'text-white scale-110 shadow-lg' 
                  : 'border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={{ 
                  backgroundColor: answers[question.bi_tag] === n ? themeColor : undefined, 
                  borderColor: answers[question.bi_tag] === n ? themeColor : undefined 
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between w-full mt-4 px-2 text-[10px] font-black uppercase text-slate-300 tracking-widest">
            <span>Não Recomendaria</span>
            <span>Com certeza</span>
          </div>
        </div>
      );
    }

    // 4. GEO COMPLETE (País, Estado, Cidade)
    if (question.type === 'geo_complete') {
       const countries = Country.getAllCountries();
       const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
       const cities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : [];
       const currentVal = answers[question.bi_tag] || {}; 

       return (
         <div className="space-y-4 w-full animate-in slide-in-from-bottom-2 fade-in">
            {/* PAÍS */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">País de Origem</label>
               <div className="relative">
                  <select 
                    className="w-full bg-white p-4 pr-10 rounded-2xl border-2 border-slate-100 outline-none font-bold text-slate-700 appearance-none focus:border-current transition-all"
                    style={{ borderColor: selectedCountry ? themeColor : undefined }}
                    value={selectedCountry}
                    onChange={(e) => {
                      const iso = e.target.value;
                      const name = countries.find(c => c.isoCode === iso)?.name;
                      setSelectedCountry(iso);
                      setSelectedState(''); 
                      setAnswers({ ...answers, [question.bi_tag]: { ...currentVal, country: name }});
                    }}
                  >
                    <option value="">Selecione...</option>
                    {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
               </div>
            </div>

            {/* ESTADO (Condicional) */}
            {selectedCountry && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado / Província</label>
                 <div className="relative">
                    <select 
                      className="w-full bg-white p-4 pr-10 rounded-2xl border-2 border-slate-100 outline-none font-bold text-slate-700 appearance-none focus:border-current transition-all"
                      style={{ borderColor: selectedState ? themeColor : undefined }}
                      value={selectedState}
                      onChange={(e) => {
                        const iso = e.target.value;
                        const name = states.find(s => s.isoCode === iso)?.name;
                        setSelectedState(iso);
                        setAnswers({ ...answers, [question.bi_tag]: { ...currentVal, state: name }});
                      }}
                    >
                      <option value="">Selecione...</option>
                      {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                 </div>
              </div>
            )}

            {/* CIDADE (Condicional) */}
            {selectedState && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cidade</label>
                 <div className="relative">
                    <select 
                      className="w-full bg-white p-4 pr-10 rounded-2xl border-2 border-slate-100 outline-none font-bold text-slate-700 appearance-none focus:border-current transition-all"
                      style={{ borderColor: (currentVal.city) ? themeColor : undefined }}
                      onChange={(e) => {
                        setAnswers({ ...answers, [question.bi_tag]: { ...currentVal, city: e.target.value }});
                      }}
                    >
                      <option value="">Selecione...</option>
                      {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                 </div>
              </div>
            )}
         </div>
       );
    }

    // 5. CAMPO DE TEXTO (Fallback)
    return (
      <div className="w-full animate-in fade-in">
        <textarea 
          className="w-full p-6 rounded-3xl bg-white border-2 border-slate-100 outline-none font-bold text-xl min-h-[180px] shadow-sm focus:border-current transition-all text-slate-700 resize-none placeholder:text-slate-300" 
          placeholder="Digite sua resposta aqui..." 
          style={{ borderColor: answers[question.bi_tag] ? themeColor : undefined }}
          value={answers[question?.bi_tag] || ''}
          onChange={(e) => setAnswers({...answers, [question.bi_tag]: e.target.value})} 
        />
      </div>
    );
  };

  // --- RENDERING DO APP ---

  if (loadingForm) return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
       <Loader2 className="animate-spin text-white" size={48} />
       <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Carregando Formulário...</p>
    </div>
  );

  if (!form) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 text-center">
       <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
         <h2 className="text-2xl font-black text-slate-800 mb-2">Formulário Indisponível</h2>
         <p className="text-slate-400 font-medium">O link pode estar expirado ou incorreto.</p>
       </div>
    </div>
  );

  const question = form.questions[currentStep];
  const progress = ((currentStep + 1) / (form.questions?.length || 1)) * 100;
  
  // Validação para habilitar botão "Próxima"
  let canProceed = false;
  if (!question) canProceed = false;
  else if (question.type === 'geo_complete') {
     const val = answers[question.bi_tag];
     canProceed = val && val.country && val.state && val.city;
  } else if (question.type === 'sat_overall') {
     canProceed = (answers[question.bi_tag] || 0) > 0;
  } else if (question.type === 'basic_select_multi') {
     const val = answers[question.bi_tag];
     canProceed = val && val.length > 0;
  } else {
     // Validação genérica (string não vazia ou definido)
     canProceed = answers[question.bi_tag] !== undefined && answers[question.bi_tag] !== '';
  }

  // TELA INICIAL
  if (!started) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center relative p-6 overflow-hidden">
         {form.background_image ? (
            <div className="absolute inset-0 z-0 animate-in fade-in duration-1000">
               <img src={form.background_image} className="w-full h-full object-cover opacity-40 scale-105" alt="Background" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent"></div>
            </div>
         ) : (
            <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center overflow-hidden">
                <img src={LOGOS.ECIDTUR} className="w-[150%] max-w-none rotate-12 blur-sm" alt="Watermark" />
            </div>
         )}

         <div className="bg-white/95 backdrop-blur-xl p-10 lg:p-16 rounded-[3.5rem] shadow-2xl text-center relative z-10 animate-in zoom-in duration-500 max-w-xl w-full border border-white/20">
            <img src={form.logo_image || LOGOS.ECIDTUR} className="w-24 h-24 mx-auto mb-8 rounded-3xl shadow-lg object-contain bg-white p-2" alt="Logo" />
            <h1 className="text-3xl lg:text-4xl font-black text-[#0F172A] mb-6 tracking-tight leading-tight uppercase">
              {form.title}
            </h1>
            <div className="w-16 h-1.5 rounded-full mx-auto mb-8" style={{ backgroundColor: themeColor }}></div>
            <p className="text-slate-500 mb-10 font-medium text-lg leading-relaxed">{form.welcome_message_pt || form.description}</p>
            
            <button 
              onClick={() => setStarted(true)}
              style={{ backgroundColor: themeColor, boxShadow: `0 20px 40px -10px ${themeColor}66` }}
              className="text-white w-full py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              INICIAR COLETA
            </button>
            
            {location && (
              <div className="mt-8 flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest text-emerald-600 bg-emerald-50 py-2 px-4 rounded-full w-fit mx-auto">
                <MapPin size={12} /> Localização Detectada
              </div>
            )}
         </div>
      </div>
    );
  }

  // TELA FINAL
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white rounded-[3.5rem] shadow-2xl p-12 text-center animate-in fade-in duration-700 border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: themeColor }}></div>
          
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
            <CheckCircle2 size={48} />
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Obrigado!</h2>
          <p className="text-slate-500 font-medium text-lg">{form.thank_you_message_pt || "Sua contribuição ajuda a transformar o futuro de Aracaju."}</p>
          
          {/* CONCIERGE CARD */}
          <div className="mt-12 text-left relative group">
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] opacity-10 group-hover:opacity-15 transition-opacity blur-xl"></div>
             <div className="bg-white relative p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Concierge Digital</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recomendação Personalizada</p>
                    </div>
                </div>

                {loadingIA ? (
                  <div className="py-8 flex flex-col items-center gap-4 text-center">
                      <Loader2 className="animate-spin text-indigo-500" size={32} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Analisando seu perfil...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                      <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{itinerary}</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  // TELA DE PERGUNTAS
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4 lg:p-6 transition-colors duration-500">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-8 lg:p-14 border border-white relative overflow-hidden transition-all duration-300 flex flex-col min-h-[600px]">
        
        {/* Barra de Progresso */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
          <div className="h-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, backgroundColor: themeColor }}></div>
        </div>
        
        {/* Cabeçalho da Pergunta */}
        <div className="mb-8 mt-2 animate-in slide-in-from-left duration-500">
           <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-4 opacity-70" style={{ color: themeColor }}>
             Questão {currentStep + 1} / {form.questions?.length || 0}
           </span>
           <h2 className="text-2xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">
             {question?.label}
           </h2>
        </div>

        {/* Área de Resposta */}
        <div className="flex-1 flex flex-col justify-center py-4">
          {renderInput(question)}
        </div>

        {/* Rodapé de Navegação */}
        <div className="flex justify-between mt-8 items-center pt-8 border-t border-slate-50">
          <button 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest px-4 py-3 rounded-xl transition-all ${
              currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          
          <button 
            onClick={handleNext} 
            disabled={!canProceed}
            style={{ 
              backgroundColor: canProceed ? themeColor : '#e2e8f0',
              color: canProceed ? '#ffffff' : '#94a3b8',
              boxShadow: canProceed ? `0 10px 20px -5px ${themeColor}66` : 'none'
            }}
            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all transform active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            {currentStep === (form.questions?.length || 0) - 1 ? 'Finalizar' : 'Próxima'} 
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
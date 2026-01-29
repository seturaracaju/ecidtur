import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LOGOS } from '../constants';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        if (loginError.message === 'Invalid login credentials') {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else if (loginError.message === 'Email not confirmed') {
          setError('E-mail não confirmado. Verifique sua caixa de entrada.');
        } else {
          setError(loginError.message);
        }
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('Erro ao conectar com o servidor. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f0f4f8] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-sky-100 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60"></div>

      <div className="m-auto w-full max-w-[1100px] flex bg-white/80 backdrop-blur-xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-700">
        
        <div className="hidden lg:flex w-1/2 bg-[#2A8CB4] relative p-16 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A8CB4] to-[#1a6b8a] opacity-90"></div>
          
          <div className="relative z-10">
            {/* Logo Container corrigido para fundo branco */}
            <div className="bg-white p-4 rounded-[1.5rem] shadow-2xl mb-8 inline-block">
               <img src={LOGOS.ECIDTUR} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              E-CIDTUR
            </h2>
            <p className="text-sky-100 mt-6 max-w-sm text-xl font-medium leading-relaxed">
              A Central de Inteligência de Dados do Turismo.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 self-start">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#2A8CB4]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Acesso Seguro</p>
              <p className="text-sky-100 text-[10px] mt-1 uppercase tracking-widest font-semibold">Criptografia Gov</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel de Acesso</h3>
            <p className="text-slate-500 mt-2 font-medium">Insira suas credenciais para gerenciar indicadores e estratégias.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm animate-in slide-in-from-top-4">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">E-mail Institucional</label>
              <div className="relative">
                <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="email"
                  required
                  placeholder="seu.nome@aracaju.se.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#2A8CB4]/20 focus:bg-white rounded-[2rem] outline-none transition-all text-slate-700 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Sua Senha</label>
              <div className="relative">
                <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#2A8CB4]/20 focus:bg-white rounded-[2rem] outline-none transition-all text-slate-700 font-semibold"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#2A8CB4] text-white py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-sky-100 hover:bg-[#1a6b8a] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  Validando...
                </>
              ) : (
                <>
                  Acessar Painel
                  <ArrowRight size={22} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 flex justify-center">
            <img src={LOGOS.SETUR} alt="Setur" className="h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
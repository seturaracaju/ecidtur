import React, { useState, useEffect, useContext, createContext, PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, Calendar, Users, 
  Users2, BarChart3, ShieldAlert, LogOut, ChevronRight 
} from 'lucide-react';
import { User, UserRole } from './types';
import { LOGOS, SUPER_ADMIN_EMAIL } from './constants';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BI from './pages/BI';
import FormBuilder from './pages/FormBuilder';
import FraudDetection from './pages/FraudDetection';
import PublicForm from './pages/PublicForm';
import Events from './pages/Events';
import Team from './pages/Team';
import TouristGroups from './pages/TouristGroups';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {}
});

const Sidebar = ({ user, logout }: { user: User; logout: () => void }) => {
  const location = useLocation();
  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();
  
  // Garantia absoluta para o seu e-mail ou cargos de admin
  const isAdmin = role.includes('ADMIN') || role.includes('ANALYST') || email === SUPER_ADMIN_EMAIL;

  const menuItems = [
    { path: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard, show: true },
    { path: '/forms', label: 'FORMULÁRIOS', icon: ClipboardList, show: true },
    { path: '/events', label: 'EVENTOS', icon: Calendar, show: true },
    { path: '/groups', label: 'GRUPOS DE TURISTAS', icon: Users, show: true },
    { path: '/team', label: 'EQUIPE', icon: Users2, show: isAdmin },
    { path: '/bi', label: 'BUSINESS INTELLIGENCE', icon: BarChart3, show: isAdmin },
    { path: '/fraud', label: 'ALERTAS DE FRAUDE', icon: ShieldAlert, show: isAdmin }
  ];

  return (
    <aside className="w-[340px] bg-white h-screen fixed left-0 top-0 border-r border-slate-100 flex flex-col z-50 shadow-2xl shadow-slate-200/20">
      <div className="p-8 pb-4 flex items-center gap-4">
        <img src={LOGOS.ECIDTUR} alt="Logo" className="h-14 w-14 rounded-2xl object-cover shadow-md" />
        <div>
          <h1 className="font-extrabold text-lg text-[#0F172A] leading-none">E-CIDTUR</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ARACAJU - SERGIPE</p>
        </div>
      </div>

      <div className="h-px bg-slate-50 mx-8 my-4"></div>

      <div className="px-8 py-4 flex-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">NAVEGAÇÃO PRINCIPAL</p>
        <nav className="space-y-1">
          {menuItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-[#2A8CB4] text-white shadow-xl shadow-sky-100' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon size={22} className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-[#2A8CB4]'} />
                  <span className="font-extrabold text-[13px] tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-8 border-t border-slate-50">
        <div className="flex items-center gap-4 mb-4 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
          <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase shadow-sm shrink-0">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-slate-800 uppercase leading-none truncate">{user.name || 'Usuário'}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full py-3 bg-white border border-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> SAIR DO SISTEMA
        </button>
      </div>
    </aside>
  );
};

const PrivateRoute = ({ children }: PropsWithChildren) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <div className="w-16 h-16 border-4 border-sky-100 border-t-[#2A8CB4] rounded-full animate-spin mb-4"></div>
      <p className="text-[#2A8CB4] font-black tracking-widest text-xs uppercase animate-pulse">Carregando Inteligência...</p>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      // Alterado de 'profiles' para 'users' para bater com o print do banco
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback para permitir navegação mesmo sem perfil no DB
        const isMaster = email?.toLowerCase() === SUPER_ADMIN_EMAIL;
        setUser({
          id: userId,
          name: email?.split('@')[0] || 'Usuário',
          email: email || '',
          role: isMaster ? UserRole.SUPER_ADMIN : UserRole.RESEARCHER,
          points: 0,
          level: 1,
          streak_days: 0
        });
      } else {
        // Mapeando colunas do banco (full_name) para o objeto User (name)
        setUser({
            ...data,
            name: data.full_name || data.name, // Suporte para ambos os casos
            role: data.role || 'RESEARCHER'
        });
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/public/form/:id" element={<PublicForm />} />
          <Route path="/*" element={
            <PrivateRoute>
              <div className="flex min-h-screen">
                <Sidebar user={user!} logout={logout} />
                <main className="flex-1 ml-[340px] bg-[#f8fafc] p-12 overflow-y-auto max-h-screen custom-scrollbar">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/forms" element={<FormBuilder />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/groups" element={<TouristGroups />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/bi" element={<BI />} />
                    <Route path="/fraud" element={<FraudDetection />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}
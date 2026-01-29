
import React from 'react';
import { Trophy, Medal, Flame, Target, Star, ChevronRight } from 'lucide-react';

const ranking = [
  { rank: 1, name: 'Samuel Hipólito', points: 15420, streak: 12, avatar: 'SH', type: 'Super Admin' },
  { rank: 2, name: 'Juliana Castro', points: 12850, streak: 8, avatar: 'JC', type: 'Pesquisador' },
  { rank: 3, name: 'Marcos Almeida', points: 11200, streak: 15, avatar: 'MA', type: 'Pesquisador' },
  { rank: 4, name: 'Fernanda Lima', points: 9800, streak: 3, avatar: 'FL', type: 'Guia' },
  { rank: 5, name: 'Rodrigo Soares', points: 8540, streak: 0, avatar: 'RS', type: 'Analista' },
];

export default function Gamification() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Gamificação & Elite</h2>
          <p className="text-slate-400 font-medium mt-1">Reconhecendo a excelência no trabalho de campo.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-[1.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
             <Flame className="text-orange-500" />
             <span className="font-bold text-slate-800">Streak: 12 dias</span>
           </div>
           <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-[1.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
             <Star className="text-amber-400" />
             <span className="font-bold text-slate-800">Pontos: 15.420</span>
           </div>
        </div>
      </header>

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        {/* Rank 2 */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 flex flex-col items-center text-center order-2 md:order-1 h-[320px] relative overflow-hidden group hover:scale-[1.05] transition-all duration-500">
           <div className="absolute top-0 left-0 w-full h-2 bg-slate-300"></div>
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-2xl font-extrabold mb-4 shadow-xl">🥈</div>
           <h4 className="text-xl font-bold text-slate-800">{ranking[1].name}</h4>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{ranking[1].type}</p>
           <div className="mt-8">
             <p className="text-3xl font-black text-slate-800 tracking-tight">{ranking[1].points}</p>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pontos acumulados</p>
           </div>
        </div>

        {/* Rank 1 */}
        <div className="bg-slate-900 p-12 rounded-[4rem] shadow-2xl flex flex-col items-center text-center order-1 md:order-2 h-[420px] relative overflow-hidden group hover:scale-[1.05] transition-all duration-500 border-4 border-amber-400/20">
           <div className="absolute top-0 left-0 w-full h-4 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]"></div>
           <div className="w-28 h-28 bg-amber-400 rounded-full flex items-center justify-center text-white text-5xl font-extrabold mb-6 shadow-2xl shadow-amber-400/20 animate-bounce">🥇</div>
           <h4 className="text-2xl font-black text-white tracking-tight">{ranking[0].name}</h4>
           <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mt-2">{ranking[0].type}</p>
           <div className="mt-10">
             <p className="text-5xl font-black text-white tracking-tight">{ranking[0].points}</p>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Elite Master</p>
           </div>
        </div>

        {/* Rank 3 */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 flex flex-col items-center text-center order-3 md:order-3 h-[300px] relative overflow-hidden group hover:scale-[1.05] transition-all duration-500">
           <div className="absolute top-0 left-0 w-full h-2 bg-amber-700/30"></div>
           <div className="w-20 h-20 bg-amber-700/10 rounded-full flex items-center justify-center text-amber-700 text-2xl font-extrabold mb-4 shadow-xl">🥉</div>
           <h4 className="text-xl font-bold text-slate-800">{ranking[2].name}</h4>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{ranking[2].type}</p>
           <div className="mt-8">
             <p className="text-3xl font-black text-slate-800 tracking-tight">{ranking[2].points}</p>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pontos acumulados</p>
           </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50">
        <div className="flex items-center justify-between mb-10">
           <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Ranking Completo</h3>
           <div className="flex gap-4">
              <button className="text-sm font-bold text-[#2A8CB4] bg-sky-50 px-6 py-2 rounded-xl">Mensal</button>
              <button className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all">Geral</button>
           </div>
        </div>

        <div className="space-y-4">
           {ranking.map((person) => (
             <div key={person.rank} className="flex items-center justify-between p-6 rounded-[2rem] hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-6">
                   <span className="w-8 text-center font-black text-slate-300 text-xl group-hover:text-slate-800 transition-all">#{person.rank}</span>
                   <div className="h-14 w-14 bg-[#79954C] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                      {person.avatar}
                   </div>
                   <div>
                     <p className="font-extrabold text-slate-800">{person.name}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{person.type}</p>
                   </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="text-center">
                     <div className="flex items-center gap-2 text-orange-500 font-black">
                       <Flame size={16} /> {person.streak}
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Streak</p>
                   </div>
                   <div className="text-right w-24">
                     <p className="font-black text-slate-800">{person.points.toLocaleString('pt-BR')}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Pontos</p>
                   </div>
                   <ChevronRight size={20} className="text-slate-300" />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

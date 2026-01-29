
export enum UserRole {
  ADMIN = 'ADMIN',
  RESEARCHER = 'RESEARCHER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  ANALYST = 'ANALYST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  points: number;
  level: number;
  streak_days: number;
  avatar?: string;
}

export interface Event {
  id: string;
  name: string;
  category: string;
  location: string;
  startDate: string;
  goal: number;
  current: number;
  status: 'Em Andamento' | 'Concluído' | 'Planejado';
}

export interface TouristGroup {
  id: string;
  name: string;
  agency: string;
  count: number;
  date: string;
}

export interface Question {
  id: string;
  type: string;
  label: string;
  bi_tag: string;
  options?: string[];
}

export interface Form {
  id: string;
  title: string;
  questions: Question[];
  linkedEventId?: string;
  linkedGroupId?: string;
  status: 'Ativo' | 'Rascunho' | 'Pausado';
}

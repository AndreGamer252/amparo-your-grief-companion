import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile, DailyCheckIn, ChatMessage, Memory, MoodLevel } from '@/types/amparo';
import type { AuthUser } from '@/types/auth';
import { getCurrentUser } from '@/lib/auth';

interface AmparoContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  todayMood: MoodLevel | null;
  setTodayMood: (mood: MoodLevel) => void;
  checkIns: DailyCheckIn[];
  addCheckIn: (checkIn: DailyCheckIn) => void;
  updateCheckIn: (date: string, mood: MoodLevel) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  memories: Memory[];
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  sosOpen: boolean;
  setSosOpen: (open: boolean) => void;
}

const AmparoContext = createContext<AmparoContextType | undefined>(undefined);

const STORAGE_KEY = 'amparo_user';
const CHECKINS_STORAGE_KEY = 'amparo_checkins';

export function AmparoProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [authUser, setAuthUserState] = useState<AuthUser | null>(() => {
    return getCurrentUser();
  });
  const [todayMood, setTodayMood] = useState<MoodLevel | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => {
    const stored = localStorage.getItem(CHECKINS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<Memory[]>([
    {
      id: '1',
      title: 'Carta para você',
      content: 'Hoje senti sua falta mais do que nunca. Lembrei do seu sorriso quando acordávamos juntos nas manhãs de domingo. Você sempre sabia como fazer tudo parecer melhor.',
      date: '2024-12-15',
      type: 'carta',
      createdAt: new Date('2024-12-15'),
    },
    {
      id: '2',
      title: 'Nosso último Natal',
      content: 'A árvore de Natal que você decorou ainda está na foto. Seus enfeites preferidos ainda brilham na minha memória.',
      date: '2023-12-25',
      type: 'lembranca',
      createdAt: new Date('2024-01-10'),
    },
  ]);
  const [sosOpen, setSosOpen] = useState(false);

  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const setAuthUser = (newAuthUser: AuthUser | null) => {
    setAuthUserState(newAuthUser);
    // O serviço de auth já gerencia o localStorage
  };

  const addCheckIn = (checkIn: DailyCheckIn) => {
    setCheckIns((prev) => {
      // Verifica se já existe um check-in para esta data
      const existingIndex = prev.findIndex(c => c.date === checkIn.date);
      let updated: DailyCheckIn[];
      
      if (existingIndex >= 0) {
        // Atualiza o check-in existente
        updated = [...prev];
        updated[existingIndex] = checkIn;
      } else {
        // Adiciona novo check-in
        updated = [...prev, checkIn];
      }
      
      // Salva no localStorage
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateCheckIn = (date: string, mood: MoodLevel) => {
    setCheckIns((prev) => {
      const existingIndex = prev.findIndex(c => c.date === date);
      let updated: DailyCheckIn[];
      
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], mood };
      } else {
        // Se não existe, cria um novo
        updated = [...prev, { date, mood }];
      }
      
      // Salva no localStorage
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const addMemory = (memory: Memory) => {
    setMemories((prev) => [memory, ...prev]);
  };

  const updateMemory = (id: string, updates: Partial<Memory>) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <AmparoContext.Provider
      value={{
        user,
        setUser,
        authUser,
        setAuthUser,
        todayMood,
        setTodayMood,
        checkIns,
        addCheckIn,
        updateCheckIn,
        messages,
        addMessage,
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        sosOpen,
        setSosOpen,
      }}
    >
      {children}
    </AmparoContext.Provider>
  );
}

export function useAmparo() {
  const context = useContext(AmparoContext);
  if (context === undefined) {
    throw new Error('useAmparo must be used within an AmparoProvider');
  }
  return context;
}

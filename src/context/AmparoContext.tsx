import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile, DailyCheckIn, ChatMessage, Memory, MoodLevel } from '@/types/amparo';

interface AmparoContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  todayMood: MoodLevel | null;
  setTodayMood: (mood: MoodLevel) => void;
  checkIns: DailyCheckIn[];
  addCheckIn: (checkIn: DailyCheckIn) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  memories: Memory[];
  addMemory: (memory: Memory) => void;
  deleteMemory: (id: string) => void;
  sosOpen: boolean;
  setSosOpen: (open: boolean) => void;
}

const AmparoContext = createContext<AmparoContextType | undefined>(undefined);

const STORAGE_KEY = 'amparo_user';

export function AmparoProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [todayMood, setTodayMood] = useState<MoodLevel | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
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

  const addCheckIn = (checkIn: DailyCheckIn) => {
    setCheckIns((prev) => [...prev, checkIn]);
  };

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const addMemory = (memory: Memory) => {
    setMemories((prev) => [memory, ...prev]);
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <AmparoContext.Provider
      value={{
        user,
        setUser,
        todayMood,
        setTodayMood,
        checkIns,
        addCheckIn,
        messages,
        addMessage,
        memories,
        addMemory,
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

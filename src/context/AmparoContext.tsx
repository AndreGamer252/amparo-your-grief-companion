import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile, DailyCheckIn, ChatMessage, Memory, MoodLevel } from '@/types/amparo';
import type { AuthUser } from '@/types/auth';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sosOpen, setSosOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega dados do Supabase quando o usuário está autenticado
  useEffect(() => {
    const loadData = async () => {
      if (!authUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Carrega check-ins
        if (supabase) {
          const { data: checkInsData, error: checkInsError } = await supabase
            .from('check_ins')
            .select('*')
            .eq('user_id', authUser.id)
            .order('date', { ascending: false });

          if (!checkInsError && checkInsData) {
            setCheckIns(
              checkInsData.map((c) => ({
                date: c.date,
                mood: c.mood as MoodLevel,
                note: c.note || undefined,
              }))
            );
          }

          // Carrega memórias
          const { data: memoriesData, error: memoriesError } = await supabase
            .from('memories')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false });

          if (!memoriesError && memoriesData) {
            setMemories(
              memoriesData.map((m) => ({
                id: m.id,
                title: m.title,
                content: m.content,
                date: m.date,
                type: m.type as 'carta' | 'lembranca',
                imageUrl: m.image_url || undefined,
                createdAt: new Date(m.created_at),
              }))
            );
          }
        } else {
          // Fallback: localStorage
          const storedCheckIns = localStorage.getItem(CHECKINS_STORAGE_KEY);
          if (storedCheckIns) {
            setCheckIns(JSON.parse(storedCheckIns));
          }

          const storedMemories = localStorage.getItem('amparo_memories');
          if (storedMemories) {
            setMemories(JSON.parse(storedMemories));
          } else {
            // Memórias padrão apenas se não houver nenhuma
            setMemories([
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
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authUser?.id]);

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

  const addCheckIn = async (checkIn: DailyCheckIn) => {
    if (!authUser?.id) return;

    // Usa Supabase se disponível
    if (supabase) {
      try {
        // Verifica se já existe
        const { data: existing } = await supabase
          .from('check_ins')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('date', checkIn.date)
          .single();

        if (existing) {
          // Atualiza
          const { error } = await supabase
            .from('check_ins')
            .update({
              mood: checkIn.mood,
              note: checkIn.note || null,
            })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Insere novo
          const { error } = await supabase
            .from('check_ins')
            .insert({
              user_id: authUser.id,
              date: checkIn.date,
              mood: checkIn.mood,
              note: checkIn.note || null,
            });

          if (error) throw error;
        }

        // Atualiza estado local
        setCheckIns((prev) => {
          const existingIndex = prev.findIndex(c => c.date === checkIn.date);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = checkIn;
            return updated;
          }
          return [...prev, checkIn];
        });
      } catch (error) {
        console.error('Erro ao salvar check-in:', error);
        // Fallback para localStorage
      }
    }

    // Fallback: localStorage
    setCheckIns((prev) => {
      const existingIndex = prev.findIndex(c => c.date === checkIn.date);
      let updated: DailyCheckIn[];
      
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = checkIn;
      } else {
        updated = [...prev, checkIn];
      }
      
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateCheckIn = async (date: string, mood: MoodLevel) => {
    await addCheckIn({ date, mood });
  };

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const addMemory = async (memory: Memory) => {
    if (!authUser?.id) {
      // Fallback: apenas estado local
      setMemories((prev) => [memory, ...prev]);
      return;
    }

    // Usa Supabase se disponível
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .insert({
            user_id: authUser.id,
            title: memory.title,
            content: memory.content,
            date: memory.date,
            type: memory.type,
            image_url: memory.imageUrl || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Atualiza estado local com o ID do banco
        const newMemory: Memory = {
          ...memory,
          id: data.id,
          createdAt: new Date(data.created_at),
        };
        setMemories((prev) => [newMemory, ...prev]);
        return;
      } catch (error) {
        console.error('Erro ao salvar memória:', error);
        // Fallback para localStorage
      }
    }

    // Fallback: localStorage
    setMemories((prev) => [memory, ...prev]);
    const stored = localStorage.getItem('amparo_memories');
    const allMemories = stored ? JSON.parse(stored) : [];
    localStorage.setItem('amparo_memories', JSON.stringify([memory, ...allMemories]));
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    if (!authUser?.id) {
      // Fallback: apenas estado local
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      return;
    }

    // Usa Supabase se disponível
    if (supabase) {
      try {
        const updateData: any = {};
        if (updates.title) updateData.title = updates.title;
        if (updates.content) updateData.content = updates.content;
        if (updates.date) updateData.date = updates.date;
        if (updates.type) updateData.type = updates.type;
        if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl || null;

        const { error } = await supabase
          .from('memories')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', authUser.id);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao atualizar memória:', error);
        // Fallback para localStorage
      }
    }

    // Atualiza estado local
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

    // Fallback: localStorage
    const stored = localStorage.getItem('amparo_memories');
    if (stored) {
      const allMemories: Memory[] = JSON.parse(stored);
      const updated = allMemories.map((m) => (m.id === id ? { ...m, ...updates } : m));
      localStorage.setItem('amparo_memories', JSON.stringify(updated));
    }
  };

  const deleteMemory = async (id: string) => {
    if (!authUser?.id) {
      // Fallback: apenas estado local
      setMemories((prev) => prev.filter((m) => m.id !== id));
      return;
    }

    // Usa Supabase se disponível
    if (supabase) {
      try {
        const { error } = await supabase
          .from('memories')
          .delete()
          .eq('id', id)
          .eq('user_id', authUser.id);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao deletar memória:', error);
        // Fallback para localStorage
      }
    }

    // Atualiza estado local
    setMemories((prev) => prev.filter((m) => m.id !== id));

    // Fallback: localStorage
    const stored = localStorage.getItem('amparo_memories');
    if (stored) {
      const allMemories: Memory[] = JSON.parse(stored);
      const filtered = allMemories.filter((m) => m.id !== id);
      localStorage.setItem('amparo_memories', JSON.stringify(filtered));
    }
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

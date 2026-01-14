import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile, DailyCheckIn, ChatMessage, Memory, MoodLevel } from '@/types/amparo';
import type { AuthUser } from '@/types/auth';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AmparoContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => Promise<void>;
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  todayMood: MoodLevel | null;
  setTodayMood: (mood: MoodLevel) => void;
  checkIns: DailyCheckIn[];
  addCheckIn: (checkIn: DailyCheckIn) => void;
  updateCheckIn: (date: string, mood: MoodLevel) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage, tokens?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) => Promise<void>;
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string) => void;
  startNewConversation: () => string;
  memories: Memory[];
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  sosOpen: boolean;
  setSosOpen: (open: boolean) => void;
}

const AmparoContext = createContext<AmparoContextType | undefined>(undefined);

export function AmparoProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [authUser, setAuthUserState] = useState<AuthUser | null>(() => getCurrentUser());
  const [todayMood, setTodayMood] = useState<MoodLevel | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sosOpen, setSosOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const LEGACY_CONVERSATION_ID = 'legacy';
  const getConversationStorageKey = (userId: string) => `amparo_active_conversation:${userId}`;
  const generateConversationId = () => {
    try {
      // Navegadores modernos
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
    } catch {
      // ignore
    }
    // Fallback simples
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const setActiveConversationId = (conversationId: string) => {
    setActiveConversationIdState(conversationId);
    if (authUser?.id) {
      localStorage.setItem(getConversationStorageKey(authUser.id), conversationId);
    }
  };

  const startNewConversation = () => {
    const newId = generateConversationId();
    setActiveConversationId(newId);
    return newId;
  };

  // Sincroniza estado de auth com Supabase Auth (inclui recarregamentos de página)
  useEffect(() => {
    if (!supabase) return;

    const hydrateAuthFromSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user) {
        // Busca dados complementares em public.users
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!userError && userRow) {
          const hydrated: AuthUser = {
            id: userRow.id,
            email: userRow.email,
            name: userRow.name,
            createdAt: userRow.created_at,
            lastLoginAt: userRow.last_login_at || undefined,
            subscriptionActive: userRow.subscription_active,
            subscriptionExpiresAt: userRow.subscription_expires_at || undefined,
            totalTokensUsed: userRow.total_tokens_used || 0,
            inputTokensUsed: userRow.input_tokens_used || 0,
            outputTokensUsed: userRow.output_tokens_used || 0,
            tokenLimit: userRow.token_limit || undefined,
          };
          setAuthUserState(hydrated);
          // Espelha no storage usado pelo app (para ProtectedRoute)
          localStorage.setItem('amparo_auth', JSON.stringify({ user: hydrated, token: session.access_token }));
          return;
        }
      }

      // Se não há sessão, tenta fallback armazenado
      const stored = getCurrentUser();
      setAuthUserState(stored);
    };

    hydrateAuthFromSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        hydrateAuthFromSession();
      } else {
        setAuthUserState(null);
        localStorage.removeItem('amparo_auth');
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  // Carrega dados do Supabase quando o usuário está autenticado
  useEffect(() => {
    const loadData = async () => {
      if (!authUser?.id) {
        // Limpa dados sensíveis ao deslogar
        setUserState(null);
        setCheckIns([]);
        setMemories([]);
        setMessages([]);
        setActiveConversationIdState(null);
        setIsLoading(false);
        return;
      }

      try {
        // Carrega perfil do usuário
        if (supabase) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('profile_data, name')
            .eq('id', authUser.id)
            .single();

          if (!userError && userData && userData.profile_data) {
            const profileData = userData.profile_data as any;
            // Verifica se tem onboardingComplete no profile_data
            if (profileData.onboardingComplete) {
              setUserState({
                name: profileData.name || userData.name || '',
                lossType: profileData.lossType,
                lovedOneName: profileData.lovedOneName,
                timeSinceLoss: profileData.timeSinceLoss,
                relationshipDescription: profileData.relationshipDescription,
                lovedOneDescription: profileData.lovedOneDescription,
                currentFeelings: profileData.currentFeelings,
                onboardingComplete: profileData.onboardingComplete || false,
              });
            }
          }

          // Carrega check-ins
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

          // Carrega mensagens do chat
          const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', authUser.id)
            .order('timestamp', { ascending: true });

          if (!messagesError && messagesData) {
            const mapped = messagesData.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.role === 'user' ? 'user' : 'amparo',
              timestamp: new Date(msg.timestamp),
              conversationId: msg.conversation_id || LEGACY_CONVERSATION_ID,
            })) as ChatMessage[];

            setMessages(mapped);

            // Define conversa ativa: localStorage > última conversa existente > nova conversa vazia
            const stored = localStorage.getItem(getConversationStorageKey(authUser.id));
            const conversationIds = Array.from(new Set(mapped.map((m) => m.conversationId || LEGACY_CONVERSATION_ID)));
            if (stored && conversationIds.includes(stored)) {
              setActiveConversationIdState(stored);
            } else if (conversationIds.length > 0) {
              // Pega a conversa da mensagem mais recente
              const last = mapped[mapped.length - 1]?.conversationId || LEGACY_CONVERSATION_ID;
              setActiveConversationIdState(last);
              localStorage.setItem(getConversationStorageKey(authUser.id), last);
            } else {
              const fresh = generateConversationId();
              setActiveConversationIdState(fresh);
              localStorage.setItem(getConversationStorageKey(authUser.id), fresh);
            }
          }
        } else {
          console.error('Supabase não está configurado');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authUser?.id]);

  const setUser = async (newUser: UserProfile | null) => {
    setUserState(newUser);

    // Salva no Supabase se o usuário estiver autenticado
    if (newUser && authUser?.id && supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            profile_data: {
              name: newUser.name,
              lossType: newUser.lossType,
              lovedOneName: newUser.lovedOneName,
              timeSinceLoss: newUser.timeSinceLoss,
              relationshipDescription: newUser.relationshipDescription,
              lovedOneDescription: newUser.lovedOneDescription,
              currentFeelings: newUser.currentFeelings,
              onboardingComplete: newUser.onboardingComplete,
            },
          })
          .eq('id', authUser.id);

        if (error) {
          console.error('Erro ao salvar perfil do usuário:', error);
        }
      } catch (error) {
        console.error('Erro ao salvar perfil do usuário:', error);
      }
    }
  };

  const setAuthUser = (newAuthUser: AuthUser | null) => {
    setAuthUserState(newAuthUser);
    if (!newAuthUser) {
      localStorage.removeItem('amparo_auth');
    } else {
      const stored = localStorage.getItem('amparo_auth');
      const token = stored ? (() => { try { return JSON.parse(stored).token || ''; } catch { return ''; } })() : '';
      localStorage.setItem('amparo_auth', JSON.stringify({ user: newAuthUser, token }));
    }
  };

  const addCheckIn = async (checkIn: DailyCheckIn) => {
    if (!authUser?.id || !supabase) {
      console.error('Usuário não autenticado ou Supabase não configurado');
      return;
    }

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
      throw error;
    }
  };

  const updateCheckIn = async (date: string, mood: MoodLevel) => {
    await addCheckIn({ date, mood });
  };

  const addMessage = async (message: ChatMessage, tokens?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) => {
    // Sempre adiciona ao estado local primeiro para exibição imediata
    const messageWithConversation: ChatMessage = {
      ...message,
      conversationId: message.conversationId || activeConversationId || LEGACY_CONVERSATION_ID,
    };
    setMessages((prev) => [...prev, messageWithConversation]);

    if (!authUser?.id || !supabase) {
      console.warn('Usuário não autenticado ou Supabase não configurado - mensagem não será salva');
      return;
    }

    try {
      // Converte 'sender' para 'role' (user -> user, amparo -> assistant)
      const role = message.sender === 'user' ? 'user' : 'assistant';
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: authUser.id,
          conversation_id: messageWithConversation.conversationId === LEGACY_CONVERSATION_ID ? null : messageWithConversation.conversationId,
          role,
          content: messageWithConversation.content,
          timestamp: messageWithConversation.timestamp.toISOString(),
          prompt_tokens: tokens?.prompt_tokens || 0,
          completion_tokens: tokens?.completion_tokens || 0,
          total_tokens: tokens?.total_tokens || 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualiza a mensagem no estado local com o ID do banco
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? { ...msg, id: data.id } : msg))
      );
    } catch (error) {
      console.error('Erro ao salvar mensagem no Supabase:', error);
      // Mensagem já está no estado local, apenas loga o erro
    }
  };

  const addMemory = async (memory: Memory) => {
    if (!authUser?.id || !supabase) {
      console.error('Usuário não autenticado ou Supabase não configurado');
      throw new Error('Não é possível salvar memória sem autenticação');
    }

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
    } catch (error) {
      console.error('Erro ao salvar memória:', error);
      throw error;
    }
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    if (!authUser?.id || !supabase) {
      console.error('Usuário não autenticado ou Supabase não configurado');
      throw new Error('Não é possível atualizar memória sem autenticação');
    }

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

      // Atualiza estado local
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
    } catch (error) {
      console.error('Erro ao atualizar memória:', error);
      throw error;
    }
  };

  const deleteMemory = async (id: string) => {
    if (!authUser?.id || !supabase) {
      console.error('Usuário não autenticado ou Supabase não configurado');
      throw new Error('Não é possível deletar memória sem autenticação');
    }

    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id)
        .eq('user_id', authUser.id);

      if (error) throw error;

      // Atualiza estado local
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Erro ao deletar memória:', error);
      throw error;
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
        activeConversationId,
        setActiveConversationId,
        startNewConversation,
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

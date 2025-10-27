import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'operacional' | 'comercial' | 'parceiro';
  empresa_id: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  trialDaysLeft: number | null;
  isTrialActive: boolean;
  paymentStatus: 'ativo' | 'pendente' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(5);
  const [isTrialActive, setIsTrialActive] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'ativo' | 'pendente' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock issues
          setTimeout(async () => {
            try {
              const { data: userData, error } = await supabase
                .from('usuarios')
                .select('id, nome, email, funcao, permissao, empresa_id, ativo, empresas(status_pagamento, acesso_vitalicio, data_criacao)')
                .eq('id', session.user.id)
                .single();

              if (error) {
                console.error('Erro ao buscar dados do usuário:', error);
                // Fallback to basic user data if query fails
                setUser({
                  id: session.user.id,
                  name: session.user.user_metadata?.name || session.user.email || 'Usuário',
                  email: session.user.email || '',
                  role: 'admin',
                  empresa_id: '',
                  avatar_url: undefined
                });
              } else if (userData) {
                setUser({
                  id: userData.id,
                  name: userData.nome,
                  email: userData.email,
                  role: userData.permissao as 'admin' | 'gestor' | 'operacional' | 'comercial' | 'parceiro',
                  empresa_id: userData.empresa_id || '',
                  avatar_url: undefined
                });

                // Verificar status de pagamento
                if (userData.empresas) {
                  const empresa = Array.isArray(userData.empresas) ? userData.empresas[0] : userData.empresas;
                  
                  if (empresa.acesso_vitalicio) {
                    setPaymentStatus('ativo');
                    setTrialDaysLeft(null);
                    setIsTrialActive(false);
                  } else {
                    setPaymentStatus(empresa.status_pagamento);
                    
                    // Calcular dias de trial
                    if (empresa.data_criacao) {
                      const dataCriacao = new Date(empresa.data_criacao);
                      const hoje = new Date();
                      const diffTime = hoje.getTime() - dataCriacao.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      const diasRestantes = Math.max(0, 15 - diffDays);
                      setTrialDaysLeft(diasRestantes);
                      setIsTrialActive(diasRestantes > 0);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Erro inesperado ao buscar usuário:', error);
              // Fallback to basic user data
              setUser({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email || 'Usuário',
                email: session.user.email || '',
                role: 'admin',
                empresa_id: '',
                avatar_url: undefined
              });
            }
          }, 0);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Erro inesperado ao fazer login' };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Erro inesperado ao criar conta' };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Erro inesperado ao enviar link mágico' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Erro inesperado ao enviar reset de senha' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      signup,
      signInWithMagicLink,
      resetPassword,
      logout,
      isLoading,
      trialDaysLeft,
      isTrialActive,
      paymentStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
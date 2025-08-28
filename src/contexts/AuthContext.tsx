import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  trialDaysLeft: number | null;
  isTrialActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(5); // Mock trial
  const [isTrialActive, setIsTrialActive] = useState(true);

  // Mock authentication for demo
  useEffect(() => {
    // Simulate checking for existing session
    const mockUser = localStorage.getItem('progestor-user');
    if (mockUser) {
      setUser(JSON.parse(mockUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Mock login - replace with Supabase auth
    const mockUser: User = {
      id: '1',
      name: 'João Silva',
      email: email,
      role: 'admin',
      empresa_id: '1',
      avatar_url: undefined
    };
    
    setUser(mockUser);
    localStorage.setItem('progestor-user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('progestor-user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      trialDaysLeft,
      isTrialActive
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
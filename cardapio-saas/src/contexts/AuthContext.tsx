"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

interface SignInResult {
  error: AuthError | null;
  data: { session: Session | null; user: User | null } | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Memorizamos a checagem para evitar recriação da função
  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Função para atualizar os estados de uma vez só
    const updateAuthState = async (newSession: Session | null) => {
      const newUser = newSession?.user ?? null;

      // SÓ ATUALIZA SE O USUÁRIO MUDOU (evita o loop de re-render)
      if (newUser?.id === user?.id && session !== null && !isLoading) {
        return;
      }

      if (newUser) {
        const adminStatus = await checkAdminRole(newUser.id);
        if (isMounted) {
          setIsAdmin(adminStatus);
          setUser(newUser);
          setSession(newSession);
          setIsLoading(false);
        }
      } else {
        if (isMounted) {
          setIsAdmin(false);
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) updateAuthState(initialSession);
    });

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('AuthProvider: Evento detectado:', event);

        if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsAdmin(false);
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (isMounted) updateAuthState(currentSession);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id, session, isLoading, checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return { error: result.error, data: result.data };
  };

  const signUp = async (email: string, password: string) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : '',
      },
    });
    return { error: result.error, data: result.data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, cpf: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: cpf // Using CPF as password for now
      });

      if (error) {
        console.error("Login failed:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Login error:", e);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    loading,
    login,
    logout
  };
};
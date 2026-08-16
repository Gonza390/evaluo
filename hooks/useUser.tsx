import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  getUserName: () => string;
  getUserInitials: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getUserName = useCallback((): string => {
    if (!user) return 'Estudiante';
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Estudiante'
    );
  }, [user]);

  const getUserInitials = useCallback((): string => {
    const name = getUserName();
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0].toUpperCase()}${names[1][0].toUpperCase()}`;
    }
    return name.slice(0, 2).toUpperCase();
  }, [getUserName]);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<UserContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      getUserName,
      getUserInitials,
    }),
    [getUserInitials, getUserName, loading, user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

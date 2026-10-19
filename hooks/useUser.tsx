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
  initialUser?: User | null;
}

function isSameUserSnapshot(currentUser: User | null, nextUser: User | null) {
  if (currentUser === nextUser) return true;
  if (!currentUser || !nextUser) return false;

  return (
    currentUser.id === nextUser.id &&
    currentUser.email === nextUser.email &&
    currentUser.updated_at === nextUser.updated_at &&
    currentUser.last_sign_in_at === nextUser.last_sign_in_at &&
    JSON.stringify(currentUser.app_metadata ?? {}) === JSON.stringify(nextUser.app_metadata ?? {}) &&
    JSON.stringify(currentUser.user_metadata ?? {}) === JSON.stringify(nextUser.user_metadata ?? {})
  );
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const hasServerSnapshot = initialUser !== undefined;
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!hasServerSnapshot);

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

    const applySessionUser = (nextUser: User | null) => {
      setUser((currentUser) =>
        isSameUserSnapshot(currentUser, nextUser) ? currentUser : nextUser
      );
      setLoading(false);
    };

    if (!hasServerSnapshot) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        applySessionUser(session?.user ?? null);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      applySessionUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hasServerSnapshot]);

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

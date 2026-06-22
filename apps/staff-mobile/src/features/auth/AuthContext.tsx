/* eslint-disable react-refresh/only-export-components */

import type { UserSummary } from '@cocktail/shared-types';
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchCurrentUser, loginWithPassword, logoutRequest } from '../../services/auth';
import { clearStoredSession, readStoredSession, writeStoredSession } from './auth-storage';
import type { AuthSession, LoginPayload } from './types';

interface AuthContextValue {
  session: AuthSession | null;
  user: UserSummary | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(readStoredSession()));
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const storedSession = readStoredSession();

    if (!storedSession) {
      return undefined;
    }

    fetchCurrentUser()
      .then((user) => {
        if (isCancelled) {
          return;
        }

        const nextSession: AuthSession = {
          ...storedSession,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            roleCode: user.role.code,
            roleName: user.role.name,
          },
        };

        writeStoredSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        if (!isCancelled) {
          clearStoredSession();
          setSession(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  async function login(payload: LoginPayload) {
    setIsLoggingIn(true);

    try {
      const nextSession = await loginWithPassword(payload);
      writeStoredSession(nextSession);
      startTransition(() => {
        setSession(nextSession);
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function logout() {
    setIsLoggingOut(true);

    try {
      await logoutRequest();
    } catch {
      // Local session cleanup is the source of truth for this app.
    } finally {
      clearStoredSession();
      startTransition(() => {
        setSession(null);
      });
      setIsLoggingOut(false);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isBootstrapping,
      isLoggingIn,
      isLoggingOut,
      login,
      logout,
    }),
    [session, isBootstrapping, isLoggingIn, isLoggingOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

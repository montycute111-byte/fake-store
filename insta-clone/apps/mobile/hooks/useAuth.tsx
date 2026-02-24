import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearTokens, getTokens } from "../lib/storage";
import * as api from "../lib/api";

type User = {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  petName: string | null;
  petBio: string | null;
  petAvatarUrl: string | null;
  isPrivate: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { email: string; username: string; password: string; name: string }) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const profile = await api.me();
    setUser(profile);
  };

  useEffect(() => {
    (async () => {
      try {
        const tokens = await getTokens();
        if (!tokens.accessToken) {
          setLoading(false);
          return;
        }
        await refreshMe();
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email: string, password: string) => {
        const data = await api.login({ email, password });
        setUser(data.user);
      },
      signup: async (payload: { email: string; username: string; password: string; name: string }) => {
        const data = await api.signup(payload);
        setUser(data.user);
      },
      refreshMe,
      logout: async () => {
        await api.logout();
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

type User = { email: string };
type Ctx = { user: User | null; signIn: (email: string) => void; signOut: () => void };
const AuthContext = createContext<Ctx | null>(null);
const KEY = "verba:session";
const SIGNED_OUT = "verba:signed-out";
export const DEMO_EMAIL = "marina@semear.example";

function initialUser(): User | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null") as User | null;
    const forced = /[?&]demo\b/.test(window.location.search + window.location.hash);
    if (saved && !forced) return saved;
    if (forced || !localStorage.getItem(SIGNED_OUT)) {
      const demo = { email: DEMO_EMAIL };
      localStorage.setItem(KEY, JSON.stringify(demo));
      localStorage.removeItem(SIGNED_OUT);
      return demo;
    }
  } catch {
    return { email: DEMO_EMAIL };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);
  const signIn = useCallback((email: string) => {
    const u = { email };
    localStorage.setItem(KEY, JSON.stringify(u));
    localStorage.removeItem(SIGNED_OUT);
    setUser(u);
  }, []);
  const signOut = useCallback(() => {
    localStorage.removeItem(KEY);
    localStorage.setItem(SIGNED_OUT, "1");
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth needs AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

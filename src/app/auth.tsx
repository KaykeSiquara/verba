import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

type User = { email: string };
type Ctx = { user: User | null; signIn: (email: string) => void; signOut: () => void };
const AuthContext = createContext<Ctx | null>(null);
const KEY = "verba:session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } });
  const signIn = useCallback((email: string) => { const u = { email }; localStorage.setItem(KEY, JSON.stringify(u)); setUser(u); }, []);
  const signOut = useCallback(() => { localStorage.removeItem(KEY); setUser(null); }, []);
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

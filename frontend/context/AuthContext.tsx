"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "../lib/api";
import { User } from "../types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, rememberMe: boolean) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const fetchUser = useCallback(
    async (accessToken: string) => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        // If valid token but user fetch fails (e.g. 401), logout
        logout();
      } finally {
        setLoading(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    // Check localStorage first, then sessionStorage
    const storedToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  const login = (newToken: string, newUser: User, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem("access_token", newToken);
    } else {
      sessionStorage.setItem("access_token", newToken);
    }
    setToken(newToken);
    setUser(newUser);
    router.push("/"); // Redirect to dashboard
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, refreshUser, loading }}
    >
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

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api, setAuthToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        if (!token) {
          if (mounted) setLoading(false);
          return;
        }

        const res = await api.get("/auth/me");
        if (!mounted) return;

        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } catch (e) {
        if (!mounted) return;
        setToken("");
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthToken(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  }

  async function register({ name, email, password, avatar }) {
    const res = await api.post("/auth/register", { name, email, password, avatar });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      setUser,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// shared/context/UserContext.tsx

// This is for user context

"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface ILoggedinUser {
  id: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  type?: string;
  photo?: string;
}

interface IUserContext {
  user: ILoggedinUser | null;
  login: (userData: ILoggedinUser) => void;
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<IUserContext>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  // ✅ Initialize from localStorage synchronously (avoid UI flash)
  const [user, setUser] = useState<ILoggedinUser | null>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user");
        return raw ? (JSON.parse(raw) as ILoggedinUser) : null;
      }
    } catch {
      localStorage.removeItem("user");
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  // ✅ login: update state + localStorage
  const login = (userData: ILoggedinUser) => {
    setUser(userData);
    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch {}
  };

  // ✅ logout: clear local state + localStorage and notify backend
  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem("user");
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
  };

  // ✅ On mount: if no local user, try to fetch '/api/v1/auth/me' to rehydrate from cookie
  useEffect(() => {
    let mounted = true;
    async function rehydrate() {
      // if already have a user from localStorage, skip remote fetch
      if (user) return;
      setLoading(true);
      try {
        const res = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const payload = await res.json();
        // your success helper uses { success: true, message, data }
        if (payload?.success && payload.data) {
          // map DB shape (if backend uses _id) to `id`
          const serverUser = payload.data;
          const mapped: ILoggedinUser = {
            id: serverUser.id ?? serverUser._id ?? String(serverUser._id ?? ""),
            name: serverUser.name,
            email: serverUser.email,
            phoneNumber: serverUser.phoneNumber,
            type: serverUser.type,
            photo: serverUser.photo,
          };
          if (mounted) login(mapped);
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    rehydrate();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);


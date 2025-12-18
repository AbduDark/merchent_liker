import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Merchant } from "@shared/schema";

interface AuthContextType {
  merchant: Merchant | null;
  isLoading: boolean;
  login: (merchant: Merchant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setMerchant(data);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function login(merchantData: Merchant) {
    setMerchant(merchantData);
  }

  function logout() {
    setMerchant(null);
    fetch("/api/auth/logout", { method: "POST" });
  }

  return (
    <AuthContext.Provider value={{ merchant, isLoading, login, logout }}>
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

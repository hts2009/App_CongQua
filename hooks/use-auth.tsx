// This is a MOCK auth hook. In a real application, you'd integrate with a proper auth system.
"use client";

import { UserRole, type User } from "@/types";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  login: (username: string) => Promise<void>; // Simplified login
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, User> = {
  admin: {
    id: "admin-user-id",
    username: "admin",
    role: UserRole.Admin,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  receptionist: {
    id: "receptionist-user-id",
    username: "receptionist",
    role: UserRole.Receptionist,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem("currentUser");
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = MOCK_USERS[username.toLowerCase()];
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      router.push("/dashboard");
    } else {
      setIsLoading(false);
      throw new Error("Invalid credentials");
    }
    setIsLoading(false);
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("currentUser");
    router.push("/login");
  }, [router]);

  // Alias the Provider component
  const ProviderComponent = AuthContext.Provider;

  return (
    <ProviderComponent value={{ user, login, logout, isLoading }}>
      {children}
    </ProviderComponent>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

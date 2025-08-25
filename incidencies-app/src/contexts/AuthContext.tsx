import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void; // We'll pass the Google token here later
  logout: () => void;
  // We can add user info here later, like name, email, role
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (token: string) => {
    // In a real scenario, we would validate the token with a backend
    // and fetch user roles from the Google Sheet.
    // For now, we'll just simulate a successful login.
    console.log("User logged in with token:", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Here we would also clear any stored tokens
    console.log("User logged out");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

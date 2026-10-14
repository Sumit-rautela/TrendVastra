import { createContext, useContext, useState } from "react";
import { authApi } from "../services/authApi";
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("tv-user") || "null"),
  );
  const authenticate = async (mode, payload) => {
    const response = await authApi[mode](payload);
    const next = response.user || {
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
    };
    setUser(next);
    localStorage.setItem("tv-user", JSON.stringify(next));
    if (response.token) localStorage.setItem("tv-token", response.token);
    return next;
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("tv-user");
    localStorage.removeItem("tv-token");
  };
  return (
    <AuthContext.Provider value={{ user, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

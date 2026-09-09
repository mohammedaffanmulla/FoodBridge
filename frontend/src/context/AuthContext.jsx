import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fb_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("fb_token"))
      .finally(() => setLoading(false));
  }, []);

  const applySession = ({ token, user }) => {
    localStorage.setItem("fb_token", token);
    setUser(user);
  };

  const login = async (emailOrPhone, password) => {
    const { data } = await api.post("/auth/login", { emailOrPhone, password });
    applySession(data);
    return data.user;
  };

  const requestOtp = (emailOrPhone) => api.post("/auth/otp/request", { emailOrPhone });

  const verifyOtp = async (emailOrPhone, otp) => {
    const { data } = await api.post("/auth/otp/verify", { emailOrPhone, otp });
    applySession(data);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    applySession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("fb_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, requestOtp, verifyOtp, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

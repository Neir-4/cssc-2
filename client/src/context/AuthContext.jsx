import { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token and validate user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("cssc-token");

      if (token) {
        try {
          apiService.setToken(token);
          const response = await apiService.getCurrentUser();
          // Normalize role names to avoid frontend inconsistencies (admin -> komting, dosen -> mahasiswa)
          const normalizeUserRole = (u) => {
            if (!u) return u;
            let role = (u.role || "").toString().toLowerCase();
            if (role === "admin") role = "komting";
            if (role === "dosen") role = "mahasiswa";
            return { ...u, role };
          };
          setUser(normalizeUserRole(response.user));
        } catch (error) {
          console.error("Token validation failed:", error);
          // Clear invalid token
          localStorage.removeItem("cssc-token");
          apiService.setToken(null);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const register = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.register(data);

      const normalizeUserRole = (u) => {
        if (!u) return u;
        let role = (u.role || "").toString().toLowerCase();
        if (role === "admin") role = "komting";
        if (role === "dosen") role = "mahasiswa";
        return { ...u, role };
      };

      const normalizedUser = normalizeUserRole(response.user);
      setUser(normalizedUser);
      localStorage.setItem("cssc-token", response.token);
      localStorage.setItem(
        "cssc-registered-user",
        JSON.stringify(normalizedUser)
      );

      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ name, email, password }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.login(email, password);

      const normalizeUserRole = (u) => {
        if (!u) return u;
        let role = (u.role || "").toString().toLowerCase();
        if (role === "admin") role = "komting";
        if (role === "dosen") role = "mahasiswa";
        return { ...u, role };
      };

      const normalizedUser = normalizeUserRole(response.user);
      setUser(normalizedUser);
      localStorage.setItem("cssc-token", response.token);
      localStorage.setItem(
        "cssc-registered-user",
        JSON.stringify(normalizedUser)
      );

      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (newData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.updateProfile(newData);

      const normalizeUserRole = (u) => {
        if (!u) return u;
        let role = (u.role || "").toString().toLowerCase();
        if (role === "admin") role = "komting";
        if (role === "dosen") role = "mahasiswa";
        return { ...u, role };
      };

      const normalizedUser = normalizeUserRole(response.user);
      setUser(normalizedUser);

      // Update localStorage to maintain consistency
      localStorage.setItem("cssc-current-user", JSON.stringify(normalizedUser));
      localStorage.setItem(
        "cssc-registered-user",
        JSON.stringify(normalizedUser)
      );

      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cssc-current-user");
    localStorage.removeItem("cssc-registered-user");
    localStorage.removeItem("cssc-token");
    apiService.setToken(null);
    setError(null);
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        updateUser,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

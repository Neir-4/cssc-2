import React, { createContext, useContext, useState, useCallback } from "react";
import AlertCard from "../components/AlertCard";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((payload) => {
    // payload: { type: 'success'|'error'|'info', message, timeout }
    setAlert({ type: payload.type || "info", message: payload.message });
    const t = payload.timeout || 4000;
    if (t > 0) {
      setTimeout(() => setAlert(null), t);
    }
  }, []);

  const hideAlert = useCallback(() => setAlert(null), []);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
      <div className="fixed top-4 right-4 z-50">
        {alert && (
          <AlertCard
            type={alert.type}
            message={alert.message}
            onClose={hideAlert}
          />
        )}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);

export default AlertContext;

import React from "react";

const variantStyles = {
  success: "bg-green-100 border-green-400 text-green-800",
  error: "bg-red-100 border-red-400 text-red-800",
  info: "bg-blue-100 border-blue-400 text-blue-800",
};

export default function AlertCard({ type = "info", message, onClose }) {
  const cls = variantStyles[type] || variantStyles.info;
  return (
    <div
      className={`max-w-md p-3 rounded shadow-md border ${cls}`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="mr-4">{message}</div>
        <button
          onClick={onClose}
          className="text-sm font-medium opacity-75 hover:opacity-100"
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-close after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 ${bgColor}`}>
      <span className="text-xl">{icon}</span>
      <p className="font-bold tracking-wide">{message}</p>
      <button onClick={onClose} className="ml-4 hover:scale-125 transition-transform">
        &times;
      </button>
    </div>
  );
};

export default Toast;
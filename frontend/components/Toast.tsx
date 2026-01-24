import React, { useEffect, useState } from 'react';

interface ToastItem {
  id: string;
  message: string;
  level: 'info' | 'success' | 'error';
}

const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const { message, level } = e.detail || {};
      if (!message) return;
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
      setToasts(prev => [{ id, message, level }, ...prev]);
      // auto-remove after 5s
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    window.addEventListener('app-toast', handler as EventListener);
    return () => window.removeEventListener('app-toast', handler as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 1000 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          marginBottom: 8,
          minWidth: 260,
          padding: '10px 14px',
          borderRadius: 8,
          color: '#fff',
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
          background: t.level === 'success' ? '#16a34a' : t.level === 'info' ? '#2563eb' : '#dc2626',
          animation: 'slideInRight 0.3s ease-out, fadeIn 0.3s ease-out'
        }} className="animate-in slide-in-from-right-4 fade-in duration-300">
          <div style={{ fontWeight: 700, fontSize: 13 }}>{t.level.toUpperCase()}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{t.message}</div>
        </div>
      ))}
    </div>
  );
};

export default Toast;

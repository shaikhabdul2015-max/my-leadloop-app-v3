import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md transition-all transform animate-in fade-in slide-in-from-bottom-5 max-w-md ${
      toast.type === 'warning'
        ? 'bg-amber-50/95 border-amber-200 text-amber-950 dark:bg-amber-950/95 dark:border-amber-800 dark:text-amber-100'
        : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800'
    }`}>
      {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
      {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />}
      {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 animate-bounce" />}
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{toast.message}</span>
    </div>
  );
};

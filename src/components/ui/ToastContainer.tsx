'use client';

import { useToastStore } from '@/lib/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colors = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#6366f1',
};

export function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium min-w-[260px]"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: colors[toast.type] }} />
              <span>{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

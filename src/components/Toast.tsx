import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  showToast: { message: string, type: 'success' | 'error' } | null;
}

const Toast: React.FC<ToastProps> = ({ showToast }) => {
  return (
    <AnimatePresence>
      {showToast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-24 left-6 right-6 p-4 rounded-2xl flex items-center gap-3 z-[100] shadow-2xl ${showToast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        >
          {showToast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold text-sm">{showToast.message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

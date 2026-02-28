import React from 'react';
import { motion } from 'motion/react';
import { Notification } from '../types';
import { Timestamp } from 'firebase/firestore';
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface NotificationsTabProps {
  notifications: Notification[];
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'error': return <XCircle size={18} className="text-red-500" />;
      default: return <Info size={18} className="text-primary" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500';
      case 'warning': return 'border-yellow-500';
      case 'error': return 'border-red-500';
      default: return 'border-primary';
    }
  };

  return (
    <motion.div 
      key="notifications"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Bell className="text-primary" />
          নোটিফিকেশন
        </h1>
        <p className="text-white/40 text-sm">আপনার সর্বশেষ আপডেট</p>
      </div>

      <div className="space-y-4">
        {notifications.map(n => (
          <div key={n.id} className={`glass p-4 rounded-2xl border-l-4 ${getBorderColor(n.type)}`}>
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-2">
                {getIcon(n.type)}
                <p className="font-bold text-sm">{n.title}</p>
              </div>
              <span className="text-[10px] text-white/40">
                {n.created_at instanceof Timestamp ? n.created_at.toDate().toLocaleString('bn-BD') : new Date(n.created_at).toLocaleString('bn-BD')}
              </span>
            </div>
            <p className="text-xs text-white/60 ml-7">{n.message}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-20 text-white/20">
            কোন নোটিফিকেশন নেই
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationsTab;

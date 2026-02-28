import React from 'react';
import { Trophy, Wallet, Bell } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000155659.png?alt=media&token=53ad9bd9-dc3b-4194-808e-4dc60f9f7143" 
            alt="Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h2 className="font-bold text-sm leading-tight">বিএফএফটি</h2>
          <p className="text-[10px] text-white/40">অফিসিয়াল প্ল্যাটফর্ম</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2">
          <Wallet size={14} className="text-primary" />
          <span className="text-xs font-bold">৳{user.balance}</span>
        </div>
        <button className="text-white/60 hover:text-white">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;

import React from 'react';
import { Home, Wallet, LayoutDashboard, Bell, User as UserIcon, Trophy } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isAdmin }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-around items-center z-50">
    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-primary' : 'text-white/50'}`}>
      <Home size={24} />
      <span className="text-[10px]">হোম</span>
    </button>
    <button onClick={() => setActiveTab('my-matches')} className={`flex flex-col items-center gap-1 ${activeTab === 'my-matches' ? 'text-primary' : 'text-white/50'}`}>
      <Trophy size={24} />
      <span className="text-[10px]">ম্যাচ</span>
    </button>
    <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-primary' : 'text-white/50'}`}>
      <Wallet size={24} />
      <span className="text-[10px]">ওয়ালেট</span>
    </button>
    {isAdmin && (
      <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-1 ${activeTab === 'admin' ? 'text-primary' : 'text-white/50'}`}>
        <LayoutDashboard size={24} />
        <span className="text-[10px]">এডমিন</span>
      </button>
    )}
    <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center gap-1 ${activeTab === 'notifications' ? 'text-primary' : 'text-white/50'}`}>
      <Bell size={24} />
      <span className="text-[10px]">নোটিফিকেশন</span>
    </button>
    <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-primary' : 'text-white/50'}`}>
      <UserIcon size={24} />
      <span className="text-[10px]">প্রোফাইল</span>
    </button>
  </nav>
);

export default Navbar;

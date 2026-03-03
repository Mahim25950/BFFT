import React from 'react';
import { Home, Wallet, LayoutDashboard, Bell, User as UserIcon, Trophy } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-around items-center z-50">
    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-primary' : 'text-white/50'}`}>
      <Home size={24} />
      <span className="text-[10px]">হোম</span>
    </button>
    <button onClick={() => setActiveTab('leaderboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'leaderboard' ? 'text-primary' : 'text-white/50'}`}>
      <Trophy size={24} />
      <span className="text-[10px]">লিডারবোর্ড</span>
    </button>
    <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-primary' : 'text-white/50'}`}>
      <UserIcon size={24} />
      <span className="text-[10px]">প্রোফাইল</span>
    </button>
  </nav>
);

export default Navbar;

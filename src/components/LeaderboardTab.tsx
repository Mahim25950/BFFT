import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, ChevronLeft, Search, Clock, Trophy, Target } from 'lucide-react';
import { User, LeaderboardPrizes } from '../types';

interface LeaderboardTabProps {
  users: User[];
  prizes: LeaderboardPrizes | null;
  currentUser: User | null;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ users, prizes, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Mock countdown timer for reset
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const reset = new Date();
      reset.setHours(24, 0, 0, 0); // Reset at midnight
      
      const diff = reset.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sort and filter users
  const allSortedUsers = useMemo(() => {
    return [...users]
      .filter(u => (u.total_kills || 0) >= 0)
      .sort((a, b) => (b.total_kills || 0) - (a.total_kills || 0));
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = allSortedUsers;
    if (searchTerm) {
      list = list.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.ff_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [allSortedUsers, searchTerm]);

  const topThree = filteredUsers.slice(0, 3);
  const remainingUsers = filteredUsers.slice(3, 50);

  // Find current user's rank
  const myRank = allSortedUsers.findIndex(u => u.id === currentUser?.id) + 1;
  const myData = allSortedUsers.find(u => u.id === currentUser?.id);

  const tabs: ('Daily' | 'Weekly' | 'Monthly')[] = ['Daily', 'Weekly', 'Monthly'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 min-h-screen bg-gradient-to-b from-[#001a33] to-[#000d1a]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <button className="text-white/80 hover:text-white transition-colors">
          <ChevronLeft size={28} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Clock size={12} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-widest">Resets in: {timeLeft}</span>
          </div>
        </div>
        <div className="w-7" />
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search player name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs font-black uppercase tracking-widest transition-all py-3 rounded-2xl border ${
              activeTab === tab 
                ? 'text-white bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : 'text-white/30 border-white/5 hover:border-white/10 hover:text-white/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Weekly Prizes Display */}
      <AnimatePresence>
        {prizes && activeTab === 'Weekly' && !searchTerm && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 mb-10 max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-br from-[#004080]/30 to-transparent p-5 rounded-[2rem] border border-white/10 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy size={60} className="text-yellow-500" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">Weekly Prize Pool</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] text-white/40 uppercase font-black">1st Place</p>
                  <p className="text-lg font-black text-white">৳{prizes.prize_1st}</p>
                </div>
                <div className="space-y-1 border-x border-white/10 px-4">
                  <p className="text-[9px] text-white/40 uppercase font-black">2nd Place</p>
                  <p className="text-lg font-black text-white">৳{prizes.prize_2nd}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-white/40 uppercase font-black">3rd Place</p>
                  <p className="text-lg font-black text-white">৳{prizes.prize_3rd}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium */}
      {!searchTerm && filteredUsers.length >= 3 && (
        <div className="flex justify-center items-end gap-1 sm:gap-4 mb-16 px-4 max-w-2xl mx-auto relative">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center flex-1"
          >
            <div className="relative mb-4">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xl font-black text-white/40">2</span>
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[3px] border-white/20 overflow-hidden bg-[#002b55] shadow-2xl relative group">
                {topThree[1].avatar ? (
                  <img src={topThree[1].avatar} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={40} className="text-white/10 w-full h-full p-6" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-10 sm:h-10">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000156925.png?alt=media&token=59cc5acb-3a68-41f3-be0a-02a0fb1c3418" 
                  alt="2nd" 
                  className="w-full h-full object-contain drop-shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <p className="text-[10px] sm:text-sm font-bold text-white/90 truncate w-20 sm:w-28 text-center mb-1">@{topThree[1].name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
            <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <span className="text-[10px] sm:text-xs font-black text-cyan-400">{topThree[1].total_kills || 0}</span>
              <span className="text-[7px] text-white/30 uppercase font-black tracking-tighter">Kills</span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: -24 }}
            className="flex flex-col items-center flex-1 z-10"
          >
            <div className="relative mb-4">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-12 h-12">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000156924.png?alt=media&token=0fd77c6d-9bf8-4cdd-a04a-dafaf7a31c5d" 
                  alt="Crown" 
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -top-14 left-1/2 -translate-x-1/2 text-2xl font-black text-white">1</span>
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-[4px] border-cyan-400/30 overflow-hidden bg-[#002b55] shadow-[0_0_50px_rgba(6,182,212,0.2)] relative group">
                {topThree[0].avatar ? (
                  <img src={topThree[0].avatar} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={50} className="text-white/10 w-full h-full p-8" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/40 to-transparent" />
              </div>
            </div>
            <p className="text-xs sm:text-base font-black text-white truncate w-24 sm:w-36 text-center mb-1">@{topThree[0].name?.toLowerCase().replace(/\s+/g, '') || 'winner'}</p>
            <div className="flex flex-col items-center bg-cyan-400/10 px-4 py-1.5 rounded-full border border-cyan-400/20">
              <span className="text-sm sm:text-xl font-black text-cyan-400">{topThree[0].total_kills || 0}</span>
              <span className="text-[8px] sm:text-[10px] text-cyan-400/60 uppercase font-black tracking-tighter">Kills</span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center flex-1"
          >
            <div className="relative mb-4">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xl font-black text-white/40">3</span>
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[3px] border-white/20 overflow-hidden bg-[#002b55] shadow-2xl relative group">
                {topThree[2].avatar ? (
                  <img src={topThree[2].avatar} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={40} className="text-white/10 w-full h-full p-6" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-10 sm:h-10">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000156926.png?alt=media&token=d631d99f-9078-4ff8-bb16-441cdf03ae0a" 
                  alt="3rd" 
                  className="w-full h-full object-contain drop-shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <p className="text-[10px] sm:text-sm font-bold text-white/90 truncate w-20 sm:w-28 text-center mb-1">@{topThree[2].name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
            <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <span className="text-[10px] sm:text-xs font-black text-cyan-400">{topThree[2].total_kills || 0}</span>
              <span className="text-[7px] text-white/30 uppercase font-black tracking-tighter">Kills</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3 px-6 max-w-2xl mx-auto"
      >
        {(searchTerm ? filteredUsers : remainingUsers).map((user, index) => (
          <motion.div 
            key={user.id} 
            variants={itemVariants}
            className={`p-3 rounded-[1.5rem] flex items-center justify-between transition-all group border ${
              user.id === currentUser?.id 
                ? 'bg-cyan-500/10 border-cyan-500/30' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-black text-white/30 w-6 text-center">
                {searchTerm ? filteredUsers.indexOf(user) + 1 : index + 4}
              </span>
              <div className="w-11 h-11 rounded-full border-2 border-white/10 overflow-hidden bg-[#001a33] relative">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={20} className="text-white/10 w-full h-full p-2.5" />
                )}
                {user.id === currentUser?.id && (
                  <div className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white/90">
                  {user.name || 'Anonymous'}
                  {user.id === currentUser?.id && <span className="ml-2 text-[8px] bg-cyan-500 text-white px-1.5 py-0.5 rounded-full uppercase font-black">You</span>}
                </p>
                <p className="text-[10px] text-white/30 font-medium tracking-tight">@{user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end pr-2">
              <div className="flex items-center gap-1.5">
                <Target size={12} className="text-cyan-400" />
                <span className="text-base font-black text-cyan-400 tracking-tight">{user.total_kills || 0}</span>
              </div>
              <span className="text-[8px] text-white/20 uppercase font-black tracking-tighter">Total Kills</span>
            </div>
          </motion.div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-white/10" />
            </div>
            <p className="text-white/20 text-sm font-bold">No players found matching "{searchTerm}"</p>
          </div>
        )}
      </motion.div>

      {/* Sticky My Rank Footer */}
      <AnimatePresence>
        {currentUser && myRank > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-0 right-0 px-6 z-50 pointer-events-none"
          >
            <div className="max-w-2xl mx-auto pointer-events-auto">
              <div className="bg-[#004080] border border-cyan-400/30 p-4 rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    <span className="text-sm font-black text-cyan-400">#{myRank}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">Your Current Rank</p>
                    <p className="text-[10px] text-white/60">Keep playing to reach the top!</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl border border-white/5">
                  <div className="text-right">
                    <p className="text-sm font-black text-cyan-400 leading-none">{myData?.total_kills || 0}</p>
                    <p className="text-[8px] text-white/40 uppercase font-black mt-1">Kills</p>
                  </div>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon size={16} className="text-white/10 w-full h-full p-1.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LeaderboardTab;



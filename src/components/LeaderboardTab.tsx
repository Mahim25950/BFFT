import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, ChevronLeft } from 'lucide-react';
import { User, LeaderboardPrizes } from '../types';

interface LeaderboardTabProps {
  users: User[];
  prizes: LeaderboardPrizes | null;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ users, prizes }) => {
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  // Sort users by total_kills (descending)
  const sortedUsers = [...users]
    .filter(u => (u.total_kills || 0) > 0)
    .sort((a, b) => (b.total_kills || 0) - (a.total_kills || 0))
    .slice(0, 50); // Top 50

  const tabs: ('Daily' | 'Weekly' | 'Monthly')[] = ['Daily', 'Weekly', 'Monthly'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24 min-h-screen bg-gradient-to-b from-[#001a33] to-[#000d1a]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-8">
        <button className="text-white/80 hover:text-white transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Leaderboard</h2>
        <div className="w-7" />
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-semibold transition-all py-2.5 px-6 rounded-full ${
              activeTab === tab 
                ? 'text-white bg-[#004080] shadow-lg shadow-black/20' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Weekly Prizes Display (Re-integrated) */}
      {prizes && activeTab === 'Weekly' && (
        <div className="px-6 mb-10 max-w-2xl mx-auto">
          <div className="bg-[#002b55]/50 p-4 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Weekly Rewards</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[8px] text-yellow-500 uppercase font-black mb-0.5">1st</p>
                <p className="text-sm font-black text-white">৳{prizes.prize_1st}</p>
              </div>
              <div className="text-center border-x border-white/5">
                <p className="text-[8px] text-zinc-400 uppercase font-black mb-0.5">2nd</p>
                <p className="text-sm font-black text-white">৳{prizes.prize_2nd}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] text-amber-700 uppercase font-black mb-0.5">3rd</p>
                <p className="text-sm font-black text-white">৳{prizes.prize_3rd}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium */}
      <div className="flex justify-center items-end gap-1 sm:gap-4 mb-16 px-4 max-w-2xl mx-auto relative">
        {/* 2nd Place */}
        {sortedUsers[1] && (
          <div className="flex flex-col items-center flex-1">
            <div className="relative mb-4">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xl font-black text-white/40">2</span>
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[3px] border-white/20 overflow-hidden bg-[#002b55] shadow-2xl">
                {sortedUsers[1].avatar ? (
                  <img src={sortedUsers[1].avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={40} className="text-white/10 w-full h-full p-6" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-10 sm:h-10">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000156925.png?alt=media&token=59cc5acb-3a68-41f3-be0a-02a0fb1c3418" 
                  alt="2nd" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <p className="text-[10px] sm:text-sm font-medium text-white/90 truncate w-20 sm:w-28 text-center mb-1">@{sortedUsers[1].name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              <span className="text-xs sm:text-sm font-black text-cyan-400">{sortedUsers[1].total_kills * 100}</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {sortedUsers[0] && (
          <div className="flex flex-col items-center flex-1 z-10 -translate-y-6">
            <div className="relative mb-4">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-12 h-12">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000156924.png?alt=media&token=0fd77c6d-9bf8-4cdd-a04a-dafaf7a31c5d" 
                  alt="Crown" 
                  className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -top-14 left-1/2 -translate-x-1/2 text-2xl font-black text-white">1</span>
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-[4px] border-white/30 overflow-hidden bg-[#002b55] shadow-[0_0_40px_rgba(6,182,212,0.15)]">
                {sortedUsers[0].avatar ? (
                  <img src={sortedUsers[0].avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={50} className="text-white/10 w-full h-full p-8" />
                )}
              </div>
            </div>
            <p className="text-xs sm:text-base font-black text-white truncate w-24 sm:w-36 text-center mb-1">@{sortedUsers[0].name?.toLowerCase().replace(/\s+/g, '') || 'winner'}</p>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]" />
              <span className="text-sm sm:text-lg font-black text-cyan-400">{sortedUsers[0].total_kills * 100}</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {sortedUsers[2] && (
          <div className="flex flex-col items-center flex-1">
            <div className="relative mb-4">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xl font-black text-white/40">3</span>
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[3px] border-white/20 overflow-hidden bg-[#002b55] shadow-2xl">
                {sortedUsers[2].avatar ? (
                  <img src={sortedUsers[2].avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={40} className="text-white/10 w-full h-full p-6" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-10 sm:h-10">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000156926.png?alt=media&token=d631d99f-9078-4ff8-bb16-441cdf03ae0a" 
                  alt="3rd" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <p className="text-[10px] sm:text-sm font-medium text-white/90 truncate w-20 sm:w-28 text-center mb-1">@{sortedUsers[2].name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              <span className="text-xs sm:text-sm font-black text-cyan-400">{sortedUsers[2].total_kills * 100}</span>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3 px-6 max-w-2xl mx-auto">
        {sortedUsers.slice(3).map((user, index) => (
          <div 
            key={user.id} 
            className="bg-[#002b55] p-2.5 rounded-full flex items-center justify-between hover:bg-[#003d7a] transition-all group border border-white/5"
          >
            <div className="flex items-center gap-4">
              <span className="text-base font-black text-white/80 w-6 text-center">{index + 4}</span>
              <div className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden bg-[#001a33]">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={20} className="text-white/10 w-full h-full p-2" />
                )}
              </div>
              <p className="text-sm font-semibold text-white/90">@{user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
            </div>
            <div className="flex items-center gap-2 pr-4">
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
              <span className="text-base font-black text-cyan-400 tracking-tight">{user.total_kills * 100}</span>
            </div>
          </div>
        ))}

        {sortedUsers.length === 0 && (
          <div className="text-center py-20 text-white/20">
            No data available
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LeaderboardTab;


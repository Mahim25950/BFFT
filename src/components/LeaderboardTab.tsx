import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface LeaderboardTabProps {
  users: User[];
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ users }) => {
  // Sort users by total_kills (descending)
  const sortedUsers = [...users]
    .filter(u => (u.total_kills || 0) > 0)
    .sort((a, b) => (b.total_kills || 0) - (a.total_kills || 0))
    .slice(0, 50); // Top 50

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="pb-20"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <Trophy size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold">লিডারবোর্ড</h2>
        <p className="text-white/40 text-sm">সেরা কিল যোদ্ধারা</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex justify-center items-end gap-4 mb-10 px-4">
        {/* 2nd Place */}
        {sortedUsers[1] && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full bg-zinc-400/20 border-2 border-zinc-400 p-1">
                <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                  {sortedUsers[1].avatar ? (
                    <img src={sortedUsers[1].avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={24} className="text-white/20" />
                  )}
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-400 rounded-full flex items-center justify-center text-black font-bold text-xs">2</div>
            </div>
            <p className="text-xs font-bold truncate w-20 text-center">{sortedUsers[1].name || 'N/A'}</p>
            <p className="text-[10px] text-zinc-400 font-bold">{sortedUsers[1].total_kills} Kills</p>
          </div>
        )}

        {/* 1st Place */}
        {sortedUsers[0] && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2 scale-110">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 p-1">
                <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                  {sortedUsers[0].avatar ? (
                    <img src={sortedUsers[0].avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={32} className="text-white/20" />
                  )}
                </div>
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-yellow-500/50">
                <Medal size={16} />
              </div>
            </div>
            <p className="text-sm font-bold truncate w-24 text-center">{sortedUsers[0].name || 'N/A'}</p>
            <p className="text-xs text-yellow-500 font-bold">{sortedUsers[0].total_kills} Kills</p>
          </div>
        )}

        {/* 3rd Place */}
        {sortedUsers[2] && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full bg-amber-700/20 border-2 border-amber-700 p-1">
                <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                  {sortedUsers[2].avatar ? (
                    <img src={sortedUsers[2].avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={24} className="text-white/20" />
                  )}
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-700 rounded-full flex items-center justify-center text-black font-bold text-xs">3</div>
            </div>
            <p className="text-xs font-bold truncate w-20 text-center">{sortedUsers[2].name || 'N/A'}</p>
            <p className="text-[10px] text-amber-700 font-bold">{sortedUsers[2].total_kills} Kills</p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-2 px-4">
        {sortedUsers.slice(3).map((user, index) => (
          <div key={user.id} className="glass p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/20 w-4">{index + 4}</span>
              <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={18} className="text-white/20" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold">{user.name || 'N/A'}</p>
                <p className="text-[10px] text-white/40">UID: {user.ff_uid || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{user.total_kills}</p>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Kills</p>
            </div>
          </div>
        ))}

        {sortedUsers.length === 0 && (
          <div className="text-center py-20 text-white/20">
            এখনও কেউ কিল করেনি
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LeaderboardTab;

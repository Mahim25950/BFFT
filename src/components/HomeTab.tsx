import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { Tournament } from '../types';
import TournamentCard from './TournamentCard';

interface HomeTabProps {
  tournaments: Tournament[];
  handleJoinTournament: (t: Tournament) => void;
  adProgress: { [key: string]: number };
  isWatchingAd: string | null;
  onWatchAd: (id: string) => void;
  joinedTournaments: string[];
  onSubmitResult: (id: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  tournaments, 
  handleJoinTournament,
  adProgress,
  isWatchingAd,
  onWatchAd,
  joinedTournaments,
  onSubmitResult
}) => {
  return (
    <motion.div 
      key="home"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">টুর্নামেন্ট</h1>
        <p className="text-white/40 text-sm">আপনার পছন্দের ম্যাচটি বেছে নিন</p>
      </div>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Trophy size={40} className="text-white/20" />
          </div>
          <h2 className="text-xl font-bold mb-2">কোন টুর্নামেন্ট নেই</h2>
          <p className="text-white/40 text-sm">নতুন টুর্নামেন্টের জন্য অপেক্ষা করুন।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => (
            <TournamentCard 
              key={t.id} 
              tournament={t} 
              onJoin={handleJoinTournament}
              adProgress={adProgress[t.id] || 0}
              isWatchingAd={isWatchingAd === t.id}
              onWatchAd={onWatchAd}
              isJoined={joinedTournaments.includes(t.id)}
              onSubmitResult={onSubmitResult}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HomeTab;

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Gamepad2 } from 'lucide-react';
import { Tournament } from '../types';
import TournamentCard from './TournamentCard';

interface MyMatchesTabProps {
  tournaments: Tournament[];
  joinedTournaments: string[];
  handleJoinTournament: (t: Tournament) => void;
  adProgress: { [key: string]: number };
  isWatchingAd: string | null;
  onWatchAd: (id: string) => void;
  onSubmitResult: (id: string) => void;
}

const MyMatchesTab: React.FC<MyMatchesTabProps> = ({ 
  tournaments, 
  joinedTournaments,
  handleJoinTournament,
  adProgress,
  isWatchingAd,
  onWatchAd,
  onSubmitResult
}) => {
  const myMatches = tournaments.filter(t => joinedTournaments.includes(t.id));

  return (
    <motion.div 
      key="my-matches"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">আমার ম্যাচসমূহ</h1>
        <p className="text-white/40 text-sm">আপনার জয়েন করা টুর্নামেন্টগুলো এখানে দেখুন</p>
      </div>

      {myMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Gamepad2 size={40} className="text-white/20" />
          </div>
          <h2 className="text-xl font-bold mb-2">আপনি কোন ম্যাচে জয়েন করেননি</h2>
          <p className="text-white/40 text-sm max-w-[250px] mx-auto">
            হোম পেজ থেকে আপনার পছন্দের টুর্নামেন্টে জয়েন করুন এবং এখানে তার বিস্তারিত দেখুন।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myMatches.map(t => (
            <TournamentCard 
              key={t.id} 
              tournament={t} 
              onJoin={handleJoinTournament}
              adProgress={adProgress[t.id] || 0}
              isWatchingAd={isWatchingAd === t.id}
              onWatchAd={onWatchAd}
              isJoined={true}
              onSubmitResult={onSubmitResult}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyMatchesTab;

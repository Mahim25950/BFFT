import React from 'react';
import { motion } from 'motion/react';
import { Trophy, CreditCard, Settings, Play } from 'lucide-react';
import { Tournament } from '../types';

interface TournamentCardProps {
  tournament: Tournament;
  onJoin: (t: Tournament) => void | Promise<void>;
  onEdit?: (t: Tournament) => void;
  adProgress?: number;
  isWatchingAd?: boolean;
  onWatchAd?: (id: string) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ 
  tournament, 
  onJoin, 
  onEdit,
  adProgress = 0,
  isWatchingAd = false,
  onWatchAd
}) => {
  const adsRequired = tournament.ads_required || 0;
  const isFree = tournament.is_free;
  const adsComplete = adProgress >= adsRequired;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden mb-4 group"
    >
      <div className="relative h-40">
        <img 
          src={tournament.banner || `https://picsum.photos/seed/${tournament.id}/800/400`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          referrerPolicy="no-referrer" 
          alt={tournament.title}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
            {tournament.match_type}
          </div>
          {isFree && (
            <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-green-500/20">
              FREE
            </div>
          )}
          {onEdit && (
            <button 
              onClick={() => onEdit(tournament)}
              className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
            >
              <Settings size={14} />
            </button>
          )}
        </div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
          {tournament.map_type}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{tournament.title}</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Trophy size={16} className="text-yellow-500" />
            <span>প্রাইজ: ৳{tournament.prize_pool}</span>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <CreditCard size={16} className="text-primary" />
            <span>এন্ট্রি: {isFree ? 'ফ্রি (বিজ্ঞাপন)' : `৳${tournament.entry_fee}`}</span>
          </div>
        </div>

        {isFree && !adsComplete && (
          <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">বিজ্ঞাপন প্রগতি</span>
              <span className="text-xs font-bold text-primary">{adProgress}/{adsRequired}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${(adProgress / adsRequired) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-white/40">
            {new Date(tournament.start_time).toLocaleString('bn-BD')}
          </div>
          
          <div className="flex gap-2">
            {isFree && !adsComplete && onWatchAd && (
              <button 
                onClick={() => onWatchAd(tournament.id)}
                disabled={isWatchingAd}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isWatchingAd ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                বিজ্ঞাপন দেখুন
              </button>
            )}
            
            <button 
              onClick={() => onJoin(tournament)}
              disabled={tournament.slots_filled >= tournament.slots || (isFree && !adsComplete)}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                tournament.slots_filled >= tournament.slots || (isFree && !adsComplete)
                ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                : 'bg-primary hover:bg-accent text-white'
              }`}
            >
              {tournament.slots_filled >= tournament.slots ? 'ফুল' : 'জয়েন করুন'}
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary" 
            style={{ width: `${(tournament.slots_filled / tournament.slots) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-white/40">
          <span>{tournament.slots_filled} জন জয়েন করেছে</span>
          <span>{tournament.slots} টি স্লট</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentCard;

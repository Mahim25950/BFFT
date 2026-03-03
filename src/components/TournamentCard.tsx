import React from 'react';
import { motion } from 'motion/react';
import { Trophy, CreditCard, Settings, Play, Trash2 } from 'lucide-react';
import { Tournament } from '../types';

interface TournamentCardProps {
  tournament: Tournament;
  onJoin: (t: Tournament) => void | Promise<void>;
  onEdit?: (t: Tournament) => void;
  adProgress?: number;
  isWatchingAd?: boolean;
  onWatchAd?: (id: string) => void;
  isJoined?: boolean;
  onSubmitResult?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ 
  tournament, 
  onJoin, 
  onEdit,
  adProgress = 0,
  isWatchingAd = false,
  onWatchAd,
  isJoined = false,
  onSubmitResult,
  onDelete
}) => {
  const adsRequired = tournament.ads_required || 0;
  const isFree = tournament.is_free;
  const adsComplete = adProgress >= adsRequired;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] overflow-hidden mb-6 border border-white/5 shadow-2xl shadow-black/50 group"
    >
      <div className="relative h-48">
        <img 
          src={tournament.banner || `https://picsum.photos/seed/${tournament.id}/800/400`} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          referrerPolicy="no-referrer" 
          alt={tournament.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <div className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-lg shadow-primary/20">
            {tournament.match_type}
          </div>
          {isFree && (
            <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-lg shadow-emerald-500/20">
              FREE
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          {onEdit && (
            <button 
              onClick={() => onEdit(tournament)}
              className="bg-white/10 backdrop-blur-md text-white p-2 rounded-xl hover:bg-primary transition-all shadow-xl"
            >
              <Settings size={16} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(tournament.id)}
              className="bg-white/10 backdrop-blur-md text-white p-2 rounded-xl hover:bg-red-500 transition-all shadow-xl"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              {tournament.status === 'upcoming' ? 'Upcoming Match' : tournament.status === 'live' ? 'Live Now' : 'Completed'}
            </span>
          </div>
          <h3 className="text-xl font-black text-white leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {tournament.title}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center text-center">
            <Trophy size={18} className="text-yellow-500 mb-1" />
            <p className="text-[10px] text-white/40 uppercase font-bold">Prize Pool</p>
            <p className="text-sm font-black text-white">৳{tournament.prize_pool}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center text-center">
            <CreditCard size={18} className="text-primary mb-1" />
            <p className="text-[10px] text-white/40 uppercase font-bold">Entry Fee</p>
            <p className="text-sm font-black text-white">{isFree ? 'FREE' : `৳${tournament.entry_fee}`}</p>
          </div>
        </div>

        {tournament.per_kill !== undefined && tournament.per_kill > 0 && (
          <div className="mb-5 flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-red-500/80 uppercase">Per Kill Reward</span>
            </div>
            <span className="text-sm font-black text-red-500">৳{tournament.per_kill}</span>
          </div>
        )}

        {/* Prize Distribution */}
        {(tournament.prize_1st || tournament.prize_2nd || tournament.prize_3rd) && (
          <div className="mb-5 flex gap-2">
            {tournament.prize_1st && (
              <div className="flex-1 bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/20 rounded-xl p-2 text-center">
                <p className="text-[8px] text-yellow-500/60 uppercase font-black">1st</p>
                <p className="text-xs font-black text-yellow-500">৳{tournament.prize_1st}</p>
              </div>
            )}
            {tournament.prize_2nd && (
              <div className="flex-1 bg-gradient-to-br from-zinc-400/20 to-transparent border border-zinc-400/20 rounded-xl p-2 text-center">
                <p className="text-[8px] text-zinc-400/60 uppercase font-black">2nd</p>
                <p className="text-xs font-black text-zinc-400">৳{tournament.prize_2nd}</p>
              </div>
            )}
            {tournament.prize_3rd && (
              <div className="flex-1 bg-gradient-to-br from-amber-700/20 to-transparent border border-amber-700/20 rounded-xl p-2 text-center">
                <p className="text-[8px] text-amber-700/60 uppercase font-black">3rd</p>
                <p className="text-xs font-black text-amber-700">৳{tournament.prize_3rd}</p>
              </div>
            )}
          </div>
        )}

        {/* Room Details */}
        {isJoined && (tournament.room_id || tournament.room_password) && (
          <div className="mb-5 bg-primary/10 p-4 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full -mr-8 -mt-8 blur-2xl" />
            <p className="text-[10px] text-primary uppercase font-black mb-3 flex items-center gap-2">
              <Play size={12} fill="currentColor" /> Room Access
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold mb-1">ID</p>
                <p className="text-sm font-mono font-black text-white tracking-wider">{tournament.room_id || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Pass</p>
                <p className="text-sm font-mono font-black text-white tracking-wider">{tournament.room_password || '---'}</p>
              </div>
            </div>
          </div>
        )}

        {isFree && !adsComplete && (
          <div className="mb-5 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Ad Progress</span>
              <span className="text-xs font-black text-primary">{adProgress}/{adsRequired}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(adProgress / adsRequired) * 100}%` }}
                className="h-full bg-primary shadow-[0_0_10px_rgba(255,100,0,0.5)]" 
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase font-bold">Start Time</span>
            <span className="text-xs font-bold text-white/80">
              {new Date(tournament.start_time).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className="flex-1 flex justify-end gap-2">
            {isFree && !adsComplete && onWatchAd && (
              <button 
                onClick={() => onWatchAd(tournament.id)}
                disabled={isWatchingAd}
                className="bg-white text-black px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-white/10"
              >
                {isWatchingAd ? (
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
                WATCH AD
              </button>
            )}
            
            {isJoined && onSubmitResult && (
              <button 
                onClick={() => onSubmitResult(tournament.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                SUBMIT RESULT
              </button>
            )}
            
            {!isJoined && (
              <button 
                onClick={() => onJoin(tournament)}
                disabled={tournament.slots_filled >= tournament.slots || (isFree && !adsComplete)}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-xl ${
                  tournament.slots_filled >= tournament.slots || (isFree && !adsComplete)
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-primary hover:bg-accent text-white shadow-primary/20'
                }`}
              >
                {tournament.slots_filled >= tournament.slots ? 'FULL' : 'JOIN NOW'}
              </button>
            )}
            
            {isJoined && !onSubmitResult && (
               <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 JOINED
               </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-[10px] text-white/40 uppercase font-black mb-2 tracking-widest">
            <span>Slots Filled</span>
            <span className="text-white">{tournament.slots_filled}/{tournament.slots}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(tournament.slots_filled / tournament.slots) * 100}%` }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentCard;

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import { User, Transaction } from '../types';
import { Timestamp } from 'firebase/firestore';

interface WalletTabProps {
  user: User;
  transactions: Transaction[];
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (val: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (val: boolean) => void;
  depositData: any;
  setDepositData: (val: any) => void;
  withdrawData: any;
  setWithdrawData: (val: any) => void;
  handleDeposit: (amount: number, method: string, tid: string) => void;
  handleWithdraw: (amount: number, method: string, number: string) => void;
  toast: (msg: string, type: 'success' | 'error') => void;
}

const WalletTab: React.FC<WalletTabProps> = ({
  user,
  transactions,
  isDepositModalOpen,
  setIsDepositModalOpen,
  isWithdrawModalOpen,
  setIsWithdrawModalOpen,
  depositData,
  setDepositData,
  withdrawData,
  setWithdrawData,
  handleDeposit,
  handleWithdraw,
  toast
}) => {
  return (
    <motion.div 
      key="wallet"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="glass p-6 rounded-3xl mb-8 bg-gradient-to-br from-primary/20 to-transparent">
        <p className="text-white/60 text-sm mb-1">বর্তমান ব্যালেন্স</p>
        <h2 className="text-4xl font-bold mb-6">৳{user.balance}</h2>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            className="btn-primary py-3 text-sm"
          >
            <ArrowUpRight size={18} />
            ডিপোজিট
          </button>
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="btn-secondary py-3 text-sm"
          >
            <ArrowDownLeft size={18} />
            উইথড্র
          </button>
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6"
            >
              <h2 className="text-xl font-bold mb-6">উইথড্র করুন</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bkash', 'nagad', 'rocket'].map(m => (
                      <button
                        key={m}
                        onClick={() => setWithdrawData({...withdrawData, method: m})}
                        className={`py-2 rounded-xl border transition-all text-xs font-bold capitalize ${withdrawData.method === m ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-white/40'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">পরিমাণ (৳)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                    placeholder="যেমন: ৫০০"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">পার্সোনাল নাম্বার</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={withdrawData.number}
                    onChange={(e) => setWithdrawData({...withdrawData, number: e.target.value})}
                    placeholder="আপনার নাম্বার লিখুন"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={async () => {
                      if (!withdrawData.amount || !withdrawData.number) {
                        toast('সবগুলো তথ্য পূরণ করুন', 'error');
                        return;
                      }
                      try {
                        await handleWithdraw(Number(withdrawData.amount), withdrawData.method, withdrawData.number);
                        setIsWithdrawModalOpen(false);
                        setWithdrawData({ amount: '', method: 'bkash', number: '' });
                      } catch (e) {
                        // Error handled in handleWithdraw
                      }
                    }}
                    className="btn-primary flex-1 py-3"
                  >
                    উইথড্র রিকোয়েস্ট
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDepositModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6"
            >
              <h2 className="text-xl font-bold mb-6">ডিপোজিট করুন</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bkash', 'nagad', 'rocket'].map(m => (
                      <button
                        key={m}
                        onClick={() => setDepositData({...depositData, method: m})}
                        className={`py-2 rounded-xl border transition-all text-xs font-bold capitalize ${depositData.method === m ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-white/40'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">পরিমাণ (৳)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={depositData.amount}
                    onChange={(e) => setDepositData({...depositData, amount: e.target.value})}
                    placeholder="যেমন: ৫০০"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">ট্রানজাকশন আইডি (TID)</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={depositData.transactionId}
                    onChange={(e) => setDepositData({...depositData, transactionId: e.target.value})}
                    placeholder="আপনার TID লিখুন"
                  />
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[10px] text-primary font-bold mb-1 uppercase">নির্দেশনা:</p>
                  <p className="text-[10px] text-white/60 leading-relaxed">
                    আমাদের {depositData.method.toUpperCase()} পার্সোনাল নাম্বারে (০১৭XXXXXXXX) সেন্ড মানি করুন এবং ট্রানজাকশন আইডিটি এখানে দিন। ৫-১০ মিনিটের মধ্যে ব্যালেন্স যোগ হবে।
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsDepositModalOpen(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={async () => {
                      if (!depositData.amount || !depositData.transactionId) {
                        toast('সবগুলো তথ্য পূরণ করুন', 'error');
                        return;
                      }
                      try {
                        await handleDeposit(Number(depositData.amount), depositData.method, depositData.transactionId);
                        setIsDepositModalOpen(false);
                        setDepositData({ amount: '', method: 'bkash', transactionId: '' });
                      } catch (e) {
                        // Error handled in handleDeposit
                      }
                    }}
                    className="btn-primary flex-1 py-3"
                  >
                    ডিপোজিট রিকোয়েস্ট
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <h3 className="font-bold mb-4 flex items-center gap-2">
        <History size={18} className="text-primary" />
        লেনদেনের ইতিহাস
      </h3>
      
      <div className="space-y-3">
        {transactions.map(t => (
          <div key={t.id} className="glass p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.amount > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {t.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
              </div>
              <div>
                <p className="font-bold text-sm">{t.type === 'deposit' ? 'ডিপোজিট' : t.type === 'entry_fee' ? 'এন্ট্রি ফি' : 'উইথড্র'}</p>
                <p className="text-[10px] text-white/40">
                  {t.created_at instanceof Timestamp ? t.created_at.toDate().toLocaleString('bn-BD') : new Date(t.created_at).toLocaleString('bn-BD')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${t.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {t.amount > 0 ? '+' : ''}৳{t.amount}
              </p>
              <p className={`text-[10px] ${t.status === 'approved' ? 'text-green-500' : t.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                {t.status === 'approved' ? 'সফল' : t.status === 'pending' ? 'পেন্ডিং' : 'বাতিল'}
              </p>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center py-10 text-white/20">
            কোন লেনদেন পাওয়া যায়নি
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WalletTab;

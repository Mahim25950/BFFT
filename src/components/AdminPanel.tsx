import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ShieldCheck, Search, Ban, UserCheck, CreditCard, Shield, ShieldAlert, Bell, Send, Megaphone, Image as ImageIcon, Link as LinkIcon, History, Clock } from 'lucide-react';
import { Tournament, Transaction, User, Announcement, TournamentResult } from '../types';
import TournamentCard from './TournamentCard';
import { collection, addDoc, updateDoc, doc, Timestamp, getDoc, setDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

interface AdminPanelProps {
  isAdmin: boolean;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  isEditTournamentModalOpen: boolean;
  setIsEditTournamentModalOpen: (val: boolean) => void;
  newTournament: any;
  setNewTournament: (val: any) => void;
  editingTournament: Tournament | null;
  setEditingTournament: (val: Tournament | null) => void;
  pendingTransactions: Transaction[];
  tournaments: Tournament[];
  allUsers: User[];
  pendingResults: TournamentResult[];
  handleApproveTransaction: (id: string, status: 'approved' | 'rejected') => void;
  handleApproveResult: (result: TournamentResult, status: 'approved' | 'rejected', position?: number) => void;
  handleUpdateUser: (userId: string, data: Partial<User>) => void;
  toast: (msg: string, type: 'success' | 'error') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin,
  isCreateModalOpen,
  setIsCreateModalOpen,
  isEditTournamentModalOpen,
  setIsEditTournamentModalOpen,
  newTournament,
  setNewTournament,
  editingTournament,
  setEditingTournament,
  pendingTransactions,
  tournaments,
  allUsers,
  pendingResults,
  handleApproveTransaction,
  handleApproveResult,
  handleUpdateUser,
  toast
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'tournaments' | 'users' | 'notifications'>('tournaments');
  const [userSearch, setUserSearch] = useState('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'error' });
  const [announcementForm, setAnnouncementForm] = useState<Partial<Announcement>>({
    title: '',
    message: '',
    is_active: false,
    image: '',
    button_text: '',
    button_link: ''
  });
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [resultPositions, setResultPositions] = useState<Record<string, number>>({});

  const fetchUserTransactions = async (userId: string) => {
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, "transactions"), 
        where("user_id", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const trans = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
        .sort((a, b) => {
          const dateA = a.created_at?.seconds || 0;
          const dateB = b.created_at?.seconds || 0;
          return dateB - dateA;
        });
      setUserTransactions(trans);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast('লেনদেন ইতিহাস লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  React.useEffect(() => {
    if (adminSubTab === 'notifications') {
      const fetchAnnouncement = async () => {
        const docRef = doc(db, "settings", "announcement");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAnnouncementForm(docSnap.data());
        }
      };
      fetchAnnouncement();
    }
  }, [adminSubTab]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck size={40} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">প্রবেশাধিকার সংরক্ষিত</h2>
        <p className="text-white/40 text-sm max-w-[250px]">
          এই সেকশনটি শুধুমাত্র এডমিনদের জন্য। আপনার যদি মনে হয় এটি ভুল, তবে সাপোর্টে যোগাযোগ করুন।
        </p>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch) ||
    u.ff_uid?.includes(userSearch)
  );

  return (
    <motion.div 
      key="admin"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">এডমিন প্যানেল</h2>
          <p className="text-white/40 text-sm">প্ল্যাটফর্ম ম্যানেজ করুন</p>
        </div>
        {adminSubTab === 'tournaments' && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl">
        <button 
          onClick={() => setAdminSubTab('tournaments')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${adminSubTab === 'tournaments' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          টুর্নামেন্ট ও লেনদেন
        </button>
        <button 
          onClick={() => setAdminSubTab('users')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${adminSubTab === 'users' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          ইউজার ম্যানেজমেন্ট
        </button>
        <button 
          onClick={() => setAdminSubTab('notifications')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${adminSubTab === 'notifications' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          নোটিফিকেশন
        </button>
      </div>

      <AnimatePresence mode="wait">
        {adminSubTab === 'tournaments' ? (
          <motion.div
            key="tournaments-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="font-bold mb-4">পেন্ডিং রিকোয়েস্ট</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {pendingTransactions.map(t => (
                <div key={t.id} className="glass p-4 rounded-2xl">
                  <div className="flex justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${t.type === 'deposit' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {t.type === 'deposit' ? 'ডিপোজিট' : 'উইথড্র'}
                        </span>
                        {t.method === 'bkash' ? (
                          <img src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000155670.jpg?alt=media&token=6c83af6f-3435-4de3-a7dc-c8790724f4d8" alt="bkash" className="h-4 w-auto rounded" referrerPolicy="no-referrer" />
                        ) : t.method === 'nagad' ? (
                          <img src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000155668.png?alt=media&token=a0911f17-5847-4065-9627-c4afc8815380" alt="nagad" className="h-4 w-auto rounded" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[10px] text-white/40 capitalize">{t.method}</span>
                        )}
                      </div>
                      <p className="text-xs font-bold">{t.user_name || 'N/A'}</p>
                      <p className="text-[10px] text-white/40">{t.user_phone || 'N/A'}</p>
                    </div>
                    <p className="text-primary font-bold">৳{t.amount}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl mb-4">
                    <p className="text-xs font-mono break-all">
                      {t.type === 'deposit' ? `TID: ${t.transaction_id}` : `Num: ${t.number}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleApproveTransaction(t.id, 'rejected')}
                      className="bg-red-500/20 text-red-500 py-2 rounded-lg text-sm font-bold"
                    >
                      বাতিল
                    </button>
                    <button 
                      onClick={() => handleApproveTransaction(t.id, 'approved')}
                      className="bg-green-500 text-white py-2 rounded-lg text-sm font-bold"
                    >
                      অনুমোদন
                    </button>
                  </div>
                </div>
              ))}
              {pendingTransactions.length === 0 && (
                <div className="col-span-full text-center py-10 text-white/20">
                  কোন পেন্ডিং রিকোয়েস্ট নেই
                </div>
              )}
            </div>

            <h3 className="font-bold mb-4">পেন্ডিং রেজাল্ট (উইনার)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {pendingResults.map(r => (
                <div key={r.id} className="glass p-4 rounded-2xl">
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold">{r.user_name}</p>
                      <p className="text-[10px] text-white/40">{r.user_phone}</p>
                      <p className="text-[10px] text-primary mt-1">Tournament ID: {r.tournament_id}</p>
                      {r.kills !== undefined && (
                        <p className="text-xs font-bold text-green-500 mt-1">কিল: {r.kills}</p>
                      )}
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-white/40">জমা দেওয়া হয়েছে:</p>
                       <p className="text-[10px] text-white/60">{new Date(r.created_at?.seconds * 1000).toLocaleString('bn-BD')}</p>
                       <div className="mt-2 flex flex-col items-end gap-2">
                         <span className="text-[10px] text-white/40">পজিশন:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(pos => (
                              <button
                                key={pos}
                                onClick={() => setResultPositions({ ...resultPositions, [r.id]: resultPositions[r.id] === pos ? 0 : pos })}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${resultPositions[r.id] === pos ? 'bg-primary text-black' : 'bg-white/10 text-white/40'}`}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 aspect-video rounded-xl overflow-hidden border border-white/10">
                    <img 
                      src={r.screenshot} 
                      alt="Result Proof" 
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => window.open(r.screenshot, '_blank')}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleApproveResult(r, 'rejected')}
                      className="bg-red-500/20 text-red-500 py-2 rounded-lg text-sm font-bold"
                    >
                      বাতিল
                    </button>
                    <button 
                      onClick={() => handleApproveResult(r, 'approved', resultPositions[r.id] || 0)}
                      className="bg-green-500 text-white py-2 rounded-lg text-sm font-bold"
                    >
                      পুরস্কার দিন
                    </button>
                  </div>
                </div>
              ))}
              {pendingResults.length === 0 && (
                <div className="col-span-full text-center py-10 text-white/20">
                  কোন পেন্ডিং রেজাল্ট নেই
                </div>
              )}
            </div>

            <h3 className="font-bold mb-4">টুর্নামেন্ট ম্যানেজমেন্ট</h3>
            <div className="space-y-4">
              {tournaments.map(t => (
                <TournamentCard 
                  key={t.id} 
                  tournament={t} 
                  onJoin={() => {}} 
                  onEdit={(tournament) => {
                    setEditingTournament(tournament);
                    setIsEditTournamentModalOpen(true);
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : adminSubTab === 'users' ? (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input 
                type="text"
                placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
                className="input-field pl-12"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {filteredUsers.map(u => (
                <div key={u.id} className="glass p-4 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShieldCheck size={24} className="text-white/20" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          {u.name || 'নাম নেই'}
                          {u.is_admin === 1 && <Shield size={14} className="text-primary" />}
                          {u.is_banned === 1 && <Ban size={14} className="text-red-500" />}
                        </h4>
                        <p className="text-[10px] text-white/40">{u.email}</p>
                        <p className="text-[10px] text-white/40">{u.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold">৳{u.balance}</p>
                      <p className="text-[10px] text-white/40">UID: {u.ff_uid || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button 
                      onClick={() => {
                        setSelectedUserForBalance(u);
                        setIsBalanceModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 py-2 rounded-xl text-[10px] font-bold transition-colors"
                    >
                      <CreditCard size={14} />
                      ব্যালেন্স
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedUserForHistory(u);
                        setIsHistoryModalOpen(true);
                        fetchUserTransactions(u.id);
                      }}
                      className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 py-2 rounded-xl text-[10px] font-bold transition-colors"
                    >
                      <History size={14} />
                      ইতিহাস
                    </button>
                    <button 
                      onClick={() => handleUpdateUser(u.id, { is_banned: u.is_banned === 1 ? 0 : 1 })}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-colors ${u.is_banned === 1 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                    >
                      {u.is_banned === 1 ? <UserCheck size={14} /> : <Ban size={14} />}
                      {u.is_banned === 1 ? 'আনব্যান' : 'ব্যান'}
                    </button>
                    <button 
                      onClick={() => handleUpdateUser(u.id, { is_admin: u.is_admin === 1 ? 0 : 1 })}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-colors ${u.is_admin === 1 ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}
                    >
                      {u.is_admin === 1 ? <ShieldAlert size={14} /> : <Shield size={14} />}
                      {u.is_admin === 1 ? 'এডমিন সরান' : 'এডমিন করুন'}
                    </button>
                    <button 
                      onClick={() => {
                        const newUID = prompt('নতুন ফ্রি ফায়ার ইউআইডি দিন:', u.ff_uid || '');
                        if (newUID !== null) {
                          handleUpdateUser(u.id, { ff_uid: newUID });
                        }
                      }}
                      className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 py-2 rounded-xl text-[10px] font-bold transition-colors"
                    >
                      <ShieldCheck size={14} />
                      UID এডিট
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-10 text-white/20">
                  কোন ইউজার পাওয়া যায়নি
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="notifications-admin-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="glass p-6 rounded-3xl">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <Bell size={20} className="text-primary" />
                নতুন নোটিফিকেশন পাঠান
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">টাইটেল</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={notifForm.title}
                    onChange={(e) => setNotifForm({...notifForm, title: e.target.value})}
                    placeholder="যেমন: নতুন টুর্নামেন্ট আপডেট"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-white/40 mb-1 block">মেসেজ</label>
                  <textarea 
                    className="input-field min-h-[100px] py-3"
                    value={notifForm.message}
                    onChange={(e) => setNotifForm({...notifForm, message: e.target.value})}
                    placeholder="আপনার মেসেজটি লিখুন..."
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">টাইপ</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['info', 'success', 'warning', 'error'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setNotifForm({...notifForm, type: t})}
                        className={`py-2 rounded-xl border transition-all text-[10px] font-bold capitalize ${notifForm.type === t ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-white/40'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={async () => {
                      if (!notifForm.title || !notifForm.message) {
                        toast('টাইটেল এবং মেসেজ দিন', 'error');
                        return;
                      }
                      try {
                        await addDoc(collection(db, "notifications"), {
                          ...notifForm,
                          created_at: Timestamp.now()
                        });
                        toast('নোটিফিকেশন পাঠানো হয়েছে', 'success');
                        setNotifForm({ title: '', message: '', type: 'info' });
                      } catch (e) {
                        toast('পাঠাতে সমস্যা হয়েছে', 'error');
                      }
                    }}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    পাঠিয়ে দিন
                  </button>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl mt-8">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <Megaphone size={20} className="text-primary" />
                অ্যাপ এন্ট্রি এনাউন্সমেন্ট (পপ-আপ)
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl mb-4">
                  <div>
                    <p className="text-sm font-bold">পপ-আপ সক্রিয় করুন</p>
                    <p className="text-[10px] text-white/40">অ্যাপে প্রবেশ করলে এটি দেখাবে</p>
                  </div>
                  <button 
                    onClick={() => setAnnouncementForm({...announcementForm, is_active: !announcementForm.is_active})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${announcementForm.is_active ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${announcementForm.is_active ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">টাইটেল</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                      placeholder="যেমন: নতুন আপডেট এসেছে!"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block flex items-center gap-1">
                      <ImageIcon size={12} /> ইমেজ লিঙ্ক (ঐচ্ছিক)
                    </label>
                    <input 
                      type="url"
                      className="input-field"
                      value={announcementForm.image}
                      onChange={(e) => setAnnouncementForm({...announcementForm, image: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-white/40 mb-1 block">মেসেজ</label>
                  <textarea 
                    className="input-field min-h-[100px] py-3"
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                    placeholder="আপনার মেসেজটি লিখুন..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">বাটন টেক্সট (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={announcementForm.button_text}
                      onChange={(e) => setAnnouncementForm({...announcementForm, button_text: e.target.value})}
                      placeholder="যেমন: আপডেট করুন"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block flex items-center gap-1">
                      <LinkIcon size={12} /> বাটন লিংক (ঐচ্ছিক)
                    </label>
                    <input 
                      type="text"
                      className="input-field"
                      value={announcementForm.button_link}
                      onChange={(e) => setAnnouncementForm({...announcementForm, button_link: e.target.value})}
                      placeholder="লিংক দিন"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isSavingAnnouncement}
                    onClick={async () => {
                      if (!announcementForm.title || !announcementForm.message) {
                        toast('টাইটেল এবং মেসেজ দিন', 'error');
                        return;
                      }
                      setIsSavingAnnouncement(true);
                      try {
                        await setDoc(doc(db, "settings", "announcement"), {
                          ...announcementForm,
                          updated_at: Timestamp.now()
                        }, { merge: true });
                        toast('এনাউন্সমেন্ট আপডেট হয়েছে', 'success');
                      } catch (e: any) {
                        console.error(e);
                        toast(`Error: ${e.message || 'আপডেট করতে সমস্যা হয়েছে'}`, 'error');
                      } finally {
                        setIsSavingAnnouncement(false);
                      }
                    }}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingAnnouncement ? 'সেভ হচ্ছে...' : 'এনাউন্সমেন্ট সেভ করুন'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[80vh]"
            >
              <h2 className="text-xl font-bold mb-6">নতুন টুর্নামেন্ট</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">টুর্নামেন্ট নাম</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={newTournament.title}
                    onChange={(e) => setNewTournament({...newTournament, title: e.target.value})}
                    placeholder="যেমন: উইকলি প্রো কাপ"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-white/40 mb-1 block">ব্যানার ইমেজ লিঙ্ক</label>
                  <input 
                    type="url"
                    className="input-field"
                    value={newTournament.banner}
                    onChange={(e) => setNewTournament({...newTournament, banner: e.target.value})}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">এন্ট্রি ফি (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={newTournament.entry_fee}
                      onChange={(e) => setNewTournament({...newTournament, entry_fee: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">প্রাইজ পুল (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={newTournament.prize_pool}
                      onChange={(e) => setNewTournament({...newTournament, prize_pool: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">১ম পুরস্কার (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={newTournament.prize_1st}
                      onChange={(e) => setNewTournament({...newTournament, prize_1st: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">২য় পুরস্কার (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={newTournament.prize_2nd}
                      onChange={(e) => setNewTournament({...newTournament, prize_2nd: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">৩য় পুরস্কার (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={newTournament.prize_3rd}
                      onChange={(e) => setNewTournament({...newTournament, prize_3rd: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">রুম আইডি (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={newTournament.room_id}
                      onChange={(e) => setNewTournament({...newTournament, room_id: e.target.value})}
                      placeholder="Room ID"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">রুম পাসওয়ার্ড (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={newTournament.room_password}
                      onChange={(e) => setNewTournament({...newTournament, room_password: e.target.value})}
                      placeholder="Password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold">ফ্রি ম্যাচ (বিজ্ঞাপন দেখে জয়েন)</p>
                    <p className="text-[10px] text-white/40">ইউজাররা বিজ্ঞাপন দেখে ফ্রিতে জয়েন করতে পারবে</p>
                  </div>
                  <button 
                    onClick={() => setNewTournament({...newTournament, is_free: !newTournament.is_free})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${newTournament.is_free ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newTournament.is_free ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {newTournament.is_free && (
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">প্রয়োজনীয় বিজ্ঞাপন সংখ্যা</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={newTournament.ads_required}
                      onChange={(e) => setNewTournament({...newTournament, ads_required: Number(e.target.value)})}
                      placeholder="যেমন: ৫"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">ম্যাচ টাইপ</label>
                    <select 
                      className="input-field"
                      value={newTournament.match_type}
                      onChange={(e) => setNewTournament({...newTournament, match_type: e.target.value})}
                    >
                      <option value="Solo">Solo</option>
                      <option value="Duo">Duo</option>
                      <option value="Squad">Squad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">ম্যাপ টাইপ</label>
                    <select 
                      className="input-field"
                      value={newTournament.map_type}
                      onChange={(e) => setNewTournament({...newTournament, map_type: e.target.value})}
                    >
                      <option value="Bermuda">Bermuda</option>
                      <option value="Purgatory">Purgatory</option>
                      <option value="Kalahari">Kalahari</option>
                      <option value="Alpine">Alpine</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">শুরুর সময়</label>
                    <input 
                      type="datetime-local"
                      className="input-field"
                      value={newTournament.start_time}
                      onChange={(e) => setNewTournament({...newTournament, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">মোট স্লট</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={newTournament.slots}
                      onChange={(e) => setNewTournament({...newTournament, slots: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">প্রতি কিল রিওয়ার্ড (৳)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={newTournament.per_kill || 0}
                    onChange={(e) => setNewTournament({...newTournament, per_kill: Number(e.target.value)})}
                    placeholder="যেমন: ৫"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    বাতিল
                  </button>
                   <button 
                    disabled={isCreatingTournament}
                    onClick={async () => {
                      if (!newTournament.title || !newTournament.start_time) {
                        toast('নাম এবং সময় দেওয়া বাধ্যতামূলক', 'error');
                        return;
                      }
                      if (!newTournament.banner) {
                        toast('ব্যানার ইমেজ লিঙ্ক দিন', 'error');
                        return;
                      }

                      setIsCreatingTournament(true);
                      try {
                        await addDoc(collection(db, "tournaments"), {
                          ...newTournament,
                          slots_filled: 0,
                          status: 'upcoming',
                          created_at: Timestamp.now()
                        });
                        toast('টুর্নামেন্ট তৈরি হয়েছে', 'success');
                        setIsCreateModalOpen(false);
                        setNewTournament({
                          title: '',
                          banner: '',
                          entry_fee: 0,
                          prize_pool: 0,
                          prize_1st: 0,
                          prize_2nd: 0,
                          prize_3rd: 0,
                          room_id: '',
                          room_password: '',
                          match_type: 'Solo',
                          map_type: 'Bermuda',
                          start_time: '',
                          slots: 48,
                          is_free: false,
                          ads_required: 0
                        });
                      } catch (e: any) {
                        console.error(e);
                        toast(`Error: ${e.message || 'তৈরি করতে সমস্যা হয়েছে'}`, 'error');
                      } finally {
                        setIsCreatingTournament(false);
                      }
                    }}
                    className="btn-primary flex-1 py-3 disabled:opacity-50"
                  >
                    {isCreatingTournament ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Tournament Modal */}
      <AnimatePresence>
        {isEditTournamentModalOpen && editingTournament && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditTournamentModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[80vh]"
            >
              <h2 className="text-xl font-bold mb-6">টুর্নামেন্ট এডিট করুন</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">টুর্নামেন্ট নাম</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={editingTournament.title}
                    onChange={(e) => setEditingTournament({...editingTournament, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-xs text-white/40 mb-1 block">ব্যানার ইমেজ লিঙ্ক</label>
                  <input 
                    type="url"
                    className="input-field"
                    value={editingTournament.banner}
                    onChange={(e) => setEditingTournament({...editingTournament, banner: e.target.value})}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">এন্ট্রি ফি (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={editingTournament.entry_fee}
                      onChange={(e) => setEditingTournament({...editingTournament, entry_fee: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">প্রাইজ পুল (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={editingTournament.prize_pool}
                      onChange={(e) => setEditingTournament({...editingTournament, prize_pool: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">১ম পুরস্কার (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={editingTournament.prize_1st || 0}
                      onChange={(e) => setEditingTournament({...editingTournament, prize_1st: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">২য় পুরস্কার (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={editingTournament.prize_2nd || 0}
                      onChange={(e) => setEditingTournament({...editingTournament, prize_2nd: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">৩য় পুরস্কার (৳)</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={editingTournament.prize_3rd || 0}
                      onChange={(e) => setEditingTournament({...editingTournament, prize_3rd: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">রুম আইডি (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editingTournament.room_id || ''}
                      onChange={(e) => setEditingTournament({...editingTournament, room_id: e.target.value})}
                      placeholder="Room ID"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">রুম পাসওয়ার্ড (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editingTournament.room_password || ''}
                      onChange={(e) => setEditingTournament({...editingTournament, room_password: e.target.value})}
                      placeholder="Password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold">ফ্রি ম্যাচ (বিজ্ঞাপন দেখে জয়েন)</p>
                    <p className="text-[10px] text-white/40">ইউজাররা বিজ্ঞাপন দেখে ফ্রিতে জয়েন করতে পারবে</p>
                  </div>
                  <button 
                    onClick={() => setEditingTournament({...editingTournament, is_free: !editingTournament.is_free})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${editingTournament.is_free ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingTournament.is_free ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {editingTournament.is_free && (
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">প্রয়োজনীয় বিজ্ঞাপন সংখ্যা</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={editingTournament.ads_required}
                      onChange={(e) => setEditingTournament({...editingTournament, ads_required: Number(e.target.value)})}
                      placeholder="যেমন: ৫"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">ম্যাচ টাইপ</label>
                    <select 
                      className="input-field"
                      value={editingTournament.match_type}
                      onChange={(e) => setEditingTournament({...editingTournament, match_type: e.target.value})}
                    >
                      <option value="Solo">Solo</option>
                      <option value="Duo">Duo</option>
                      <option value="Squad">Squad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">ম্যাপ টাইপ</label>
                    <select 
                      className="input-field"
                      value={editingTournament.map_type}
                      onChange={(e) => setEditingTournament({...editingTournament, map_type: e.target.value})}
                    >
                      <option value="Bermuda">Bermuda</option>
                      <option value="Purgatory">Purgatory</option>
                      <option value="Kalahari">Kalahari</option>
                      <option value="Alpine">Alpine</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">শুরুর সময়</label>
                    <input 
                      type="datetime-local"
                      className="input-field"
                      value={editingTournament.start_time}
                      onChange={(e) => setEditingTournament({...editingTournament, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">মোট স্লট</label>
                    <input 
                      type="number"
                      className="input-field"
                      value={editingTournament.slots}
                      onChange={(e) => setEditingTournament({...editingTournament, slots: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">প্রতি কিল রিওয়ার্ড (৳)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={editingTournament.per_kill || 0}
                    onChange={(e) => setEditingTournament({...editingTournament, per_kill: Number(e.target.value)})}
                    placeholder="যেমন: ৫"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsEditTournamentModalOpen(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    বাতিল
                  </button>
                   <button 
                    disabled={isCreatingTournament}
                    onClick={async () => {
                      setIsCreatingTournament(true);
                      try {
                        const { id, ...data } = editingTournament;
                        await updateDoc(doc(db, "tournaments", id), {
                          ...data
                        });
                        toast('টুর্নামেন্ট আপডেট হয়েছে', 'success');
                        setIsEditTournamentModalOpen(false);
                      } catch (e: any) {
                        console.error(e);
                        toast(`Error: ${e.message || 'আপডেট করতে সমস্যা হয়েছে'}`, 'error');
                      } finally {
                        setIsCreatingTournament(false);
                      }
                    }}
                    className="btn-primary flex-1 py-3 disabled:opacity-50"
                  >
                    {isCreatingTournament ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Balance Edit Modal */}
      <AnimatePresence>
        {isBalanceModalOpen && selectedUserForBalance && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBalanceModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6"
            >
              <h2 className="text-xl font-bold mb-2">ব্যালেন্স এডিট</h2>
              <p className="text-xs text-white/40 mb-6">ইউজার: {selectedUserForBalance.name || selectedUserForBalance.email}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-sm text-white/60">বর্তমান ব্যালেন্স:</span>
                  <span className="text-lg font-bold text-primary">৳{selectedUserForBalance.balance}</span>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">পরিমাণ (৳)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    placeholder="যেমন: ১০০ (যোগ) বা -১০০ (বিয়োগ)"
                    autoFocus
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                      setIsBalanceModalOpen(false);
                      setBalanceAdjustment('');
                    }}
                    className="btn-secondary flex-1 py-3"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={() => {
                      const amount = Number(balanceAdjustment);
                      if (!isNaN(amount)) {
                        handleUpdateUser(selectedUserForBalance.id, { balance: selectedUserForBalance.balance + amount });
                        setIsBalanceModalOpen(false);
                        setBalanceAdjustment('');
                      } else {
                        toast('সঠিক সংখ্যা দিন', 'error');
                      }
                    }}
                    className="btn-primary flex-1 py-3"
                  >
                    আপডেট
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedUserForHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">লেনদেন ইতিহাস</h2>
                  <p className="text-xs text-white/40">ইউজার: {selectedUserForHistory.name || selectedUserForHistory.email}</p>
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ShieldAlert size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-white/40">ইতিহাস লোড হচ্ছে...</p>
                  </div>
                ) : userTransactions.length > 0 ? (
                  userTransactions.map((t) => (
                    <div key={t.id} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold capitalize">{t.type === 'deposit' ? 'ডিপোজিট' : t.type === 'withdraw' ? 'উইথড্র' : t.type === 'entry_fee' ? 'এন্ট্রি ফি' : 'প্রাইজ'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1">
                            <Clock size={10} />
                            {t.created_at?.toDate ? t.created_at.toDate().toLocaleString('bn-BD') : 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${t.type === 'deposit' || t.type === 'prize' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'deposit' || t.type === 'prize' ? '+' : '-'}৳{t.amount}
                          </p>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            t.status === 'approved' ? 'bg-green-500/20 text-green-500' : 
                            t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {t.status === 'approved' ? 'সফল' : t.status === 'pending' ? 'পেন্ডিং' : 'বাতিল'}
                          </span>
                        </div>
                      </div>
                      {(t.transaction_id || t.number) && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                          <p className="text-[10px] text-white/30 font-mono">
                            {t.transaction_id ? `TID: ${t.transaction_id}` : `Num: ${t.number}`}
                          </p>
                          <p className="text-[10px] text-white/30 capitalize">{t.method}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-white/20">
                    কোন লেনদেনের ইতিহাস পাওয়া যায়নি
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPanel;

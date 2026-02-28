/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  onAuthStateChanged, 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  orderBy,
  increment,
  runTransaction,
  Timestamp,
  limit
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User as UserType, Tournament, Transaction, Notification as NotificationType, Announcement } from './types';
import { X, ExternalLink } from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import WalletTab from './components/WalletTab';
import ProfileTab from './components/ProfileTab';
import HomeTab from './components/HomeTab';
import NotificationsTab from './components/NotificationsTab';
import Header from './components/Header';
import Toast from './components/Toast';

// --- Constants ---
const ADMIN_UID = "1DYoLukPV1bFYvixzb4PhoN2war2";
const ADMIN_EMAIL = "justinbrook25950@gmail.com";

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [adProgress, setAdProgress] = useState<{ [tournamentId: string]: number }>({});
  const [isWatchingAd, setIsWatchingAd] = useState<string | null>(null);

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [showToast, setShowToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isEditTournamentModalOpen, setIsEditTournamentModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  
  // Form states
  const [depositData, setDepositData] = useState({
    amount: '',
    method: 'bkash',
    transactionId: ''
  });
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    method: 'bkash',
    number: ''
  });
  const [isEditingUID, setIsEditingUID] = useState(false);
  const [tempUID, setTempUID] = useState('');
  const [newTournament, setNewTournament] = useState({
    title: '',
    banner: '',
    entry_fee: 0,
    prize_pool: 0,
    match_type: 'Solo',
    map_type: 'Bermuda',
    start_time: '',
    slots: 48,
    is_free: false,
    ads_required: 0
  });

  // Admin states
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        userUnsubscribe = onSnapshot(doc(db, "users", firebaseUser.uid), async (userDoc) => {
          const isAdmin = firebaseUser.uid === ADMIN_UID || firebaseUser.email === ADMIN_EMAIL;
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (isAdmin && userData.is_admin !== 1) {
              await updateDoc(doc(db, "users", firebaseUser.uid), { is_admin: 1 });
              setUser({ ...userData, is_admin: 1, id: firebaseUser.uid } as any);
            } else {
              setUser({ ...userData, id: firebaseUser.uid } as any);
            }
          } else {
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const newUser = {
              email: firebaseUser.email,
              balance: 0,
              referral_code: referralCode,
              is_admin: isAdmin ? 1 : 0,
              is_banned: 0,
              created_at: new Date().toISOString()
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            setUser({ ...newUser, id: firebaseUser.uid } as any);
          }
          setLoading(false);
        });
      } else {
        if (userUnsubscribe) userUnsubscribe();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "announcement"), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Announcement;
        setAnnouncement(data);
        // Show announcement if active and not seen in this session
        if (data.is_active && !sessionStorage.getItem('announcement_seen')) {
          setShowAnnouncement(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tournaments"), orderBy("start_time", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setTournaments(tList);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("created_at", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setNotifications(notifList);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "transactions"), where("user_id", "==", user.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const transList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        transList.sort((a, b) => {
          const timeA = a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at).getTime();
          const timeB = b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at).getTime();
          return timeB - timeA;
        });
        setTransactions(transList);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "user_ad_progress"), where("user_id", "==", user.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const progress: { [key: string]: number } = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          progress[data.tournament_id] = data.ads_watched || 0;
        });
        setAdProgress(progress);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user?.is_admin && activeTab === 'admin') {
      const q = query(collection(db, "users"), orderBy("created_at", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setAllUsers(userList);
      });
      return () => unsubscribe();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (user?.is_admin && activeTab === 'admin') {
      const q = query(collection(db, "transactions"), where("status", "==", "pending"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const pendingList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        pendingList.sort((a, b) => {
          const timeA = a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at).getTime();
          const timeB = b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at).getTime();
          return timeB - timeA;
        });
        setPendingTransactions(pendingList);
      });
      return () => unsubscribe();
    }
  }, [activeTab, user]);

  const handleAuth = async () => {
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
    if (!email || !password) {
      toast('ইমেইল এবং পাসওয়ার্ড দিন', 'error');
      return;
    }
    if (isRegistering && (!name || !phone)) {
      toast('সবগুলো তথ্য পূরণ করুন', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const isAdmin = firebaseUser.uid === ADMIN_UID || firebaseUser.email === ADMIN_EMAIL;
        
        const newUser = {
          email: firebaseUser.email,
          name: name,
          phone: phone,
          balance: 0,
          referral_code: referralCode,
          is_admin: isAdmin ? 1 : 0,
          is_banned: 0,
          created_at: new Date().toISOString()
        };
        
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        toast('সফলভাবে রেজিস্ট্রেশন হয়েছে', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast('সফলভাবে লগইন হয়েছে', 'success');
      }
    } catch (e: any) {
      console.error(e);
      let message = 'অথেন্টিকেশন ব্যর্থ হয়েছে';
      if (e.code === 'auth/email-already-in-use') message = 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে';
      if (e.code === 'auth/weak-password') message = 'পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে';
      if (e.code === 'auth/invalid-email') message = 'সঠিক ইমেইল এড্রেস দিন';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') message = 'ভুল ইমেইল বা পাসওয়ার্ড';
      
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (t: Tournament) => {
    if (!user) {
      setActiveTab('profile');
      return;
    }

    // Check if it's a free match and if user has watched enough ads
    if (t.is_free) {
      const watched = adProgress[t.id] || 0;
      const required = t.ads_required || 0;
      if (watched < required) {
        toast(`আপনাকে আরও ${required - watched}টি বিজ্ঞাপন দেখতে হবে`, 'error');
        return;
      }
    } else {
      if (user.balance < t.entry_fee) {
        toast('পর্যাপ্ত ব্যালেন্স নেই', 'error');
        return;
      }
    }

    if (t.slots_filled >= t.slots) {
      toast('টুর্নামেন্টটি পূর্ণ হয়ে গেছে', 'error');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const tDoc = await transaction.get(doc(db, "tournaments", t.id.toString()));
        const uDoc = await transaction.get(doc(db, "users", user.id.toString()));

        if (!tDoc.exists() || !uDoc.exists()) throw "Document does not exist!";

        const currentSlots = tDoc.data().slots_filled || 0;
        if (currentSlots >= tDoc.data().slots) throw "Tournament is full!";

        transaction.update(doc(db, "tournaments", t.id.toString()), {
          slots_filled: increment(1)
        });

        if (!t.is_free) {
          transaction.update(doc(db, "users", user.id.toString()), {
            balance: increment(-t.entry_fee)
          });

          const newTransRef = doc(collection(db, "transactions"));
          transaction.set(newTransRef, {
            user_id: user.id,
            amount: -t.entry_fee,
            type: 'entry_fee',
            status: 'approved',
            created_at: Timestamp.now()
          });
        }

        const newParticipantRef = doc(collection(db, "tournament_participants"));
        transaction.set(newParticipantRef, {
          tournament_id: t.id,
          user_id: user.id,
          slot_number: currentSlots + 1,
          status: 'confirmed',
          created_at: Timestamp.now()
        });
      });
      toast('টুর্নামেন্টে জয়েন করা হয়েছে', 'success');
    } catch (e) {
      console.error(e);
      toast('জয়েন করতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleDeposit = async (amount: number, method: string, tid: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "transactions"), {
        user_id: user.id,
        user_name: user.name || 'N/A',
        user_phone: user.phone || 'N/A',
        amount,
        type: 'deposit',
        method,
        transaction_id: tid,
        status: 'pending',
        created_at: Timestamp.now()
      });
      toast('ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে', 'success');
    } catch (e) {
      toast('রিকোয়েস্ট ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleWithdraw = async (amount: number, method: string, number: string) => {
    if (!user) return;
    if (user.balance < amount) {
      toast('পর্যাপ্ত ব্যালেন্স নেই', 'error');
      return;
    }
    try {
      await addDoc(collection(db, "transactions"), {
        user_id: user.id,
        user_name: user.name || 'N/A',
        user_phone: user.phone || 'N/A',
        amount,
        type: 'withdraw',
        method,
        number,
        status: 'pending',
        created_at: Timestamp.now()
      });
      toast('উইথড্র রিকোয়েস্ট পাঠানো হয়েছে', 'success');
    } catch (e) {
      toast('রিকোয়েস্ট ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleApproveTransaction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const transDoc = await getDoc(doc(db, "transactions", id));
      if (!transDoc.exists()) return;
      const transData = transDoc.data();

      if (status === 'approved') {
        await runTransaction(db, async (transaction) => {
          transaction.update(doc(db, "transactions", id), { status: 'approved' });
          if (transData.type === 'deposit') {
            transaction.update(doc(db, "users", transData.user_id), {
              balance: increment(transData.amount)
            });
          } else if (transData.type === 'withdraw') {
            const userRef = doc(db, "users", transData.user_id);
            const userSnap = await transaction.get(userRef);
            if (userSnap.exists() && userSnap.data().balance >= transData.amount) {
              transaction.update(userRef, {
                balance: increment(-transData.amount)
              });
            } else {
              throw new Error("Insufficient balance for withdrawal");
            }
          }
        });
      } else {
        await updateDoc(doc(db, "transactions", id), { status: 'rejected' });
      }
      toast(status === 'approved' ? 'অনুমোদিত হয়েছে' : 'প্রত্যাখ্যাত হয়েছে', 'success');
    } catch (e) {
      console.error(e);
      toast('ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<UserType>) => {
    try {
      await updateDoc(doc(db, "users", userId), data);
      toast('ইউজার আপডেট হয়েছে', 'success');
    } catch (e) {
      console.error(e);
      toast('আপডেট ব্যর্থ হয়েছে', 'error');
    }
  };

  const toast = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleWatchAd = async (tournamentId: string) => {
    if (!user) return;
    setIsWatchingAd(tournamentId);
    
    // Simulate ad watching (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const progressRef = doc(db, "user_ad_progress", `${user.id}_${tournamentId}`);
      const progressSnap = await getDoc(progressRef);
      
      if (progressSnap.exists()) {
        await updateDoc(progressRef, {
          ads_watched: increment(1),
          updated_at: Timestamp.now()
        });
      } else {
        await setDoc(progressRef, {
          user_id: user.id,
          tournament_id: tournamentId,
          ads_watched: 1,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        });
      }
      toast('বিজ্ঞাপন দেখা সফল হয়েছে', 'success');
    } catch (e) {
      console.error(e);
      toast('বিজ্ঞাপন দেখতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsWatchingAd(null);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm 
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleAuth={handleAuth}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Announcement Popup */}
      <AnimatePresence>
        {showAnnouncement && announcement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md overflow-hidden rounded-3xl relative"
            >
              <button 
                onClick={() => {
                  setShowAnnouncement(false);
                  sessionStorage.setItem('announcement_seen', 'true');
                }}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {announcement.image && (
                <div className="w-full aspect-video overflow-hidden">
                  <img 
                    src={announcement.image} 
                    alt="Announcement" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-2">{announcement.title}</h2>
                <p className="text-white/60 text-sm mb-6 whitespace-pre-wrap">{announcement.message}</p>
                
                <div className="flex flex-col gap-3">
                  {announcement.button_text && announcement.button_link && (
                    <a 
                      href={announcement.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary py-3 flex items-center justify-center gap-2"
                    >
                      {announcement.button_text}
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button 
                    onClick={() => {
                      setShowAnnouncement(false);
                      sessionStorage.setItem('announcement_seen', 'true');
                    }}
                    className="py-3 text-white/40 hover:text-white text-sm font-medium transition-colors"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Header user={user} />

      <main className="pt-24 px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeTab 
              tournaments={tournaments} 
              handleJoinTournament={handleJoinTournament} 
              adProgress={adProgress}
              isWatchingAd={isWatchingAd}
              onWatchAd={handleWatchAd}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletTab 
              user={user}
              transactions={transactions}
              isDepositModalOpen={isDepositModalOpen}
              setIsDepositModalOpen={setIsDepositModalOpen}
              isWithdrawModalOpen={isWithdrawModalOpen}
              setIsWithdrawModalOpen={setIsWithdrawModalOpen}
              depositData={depositData}
              setDepositData={setDepositData}
              withdrawData={withdrawData}
              setWithdrawData={setWithdrawData}
              handleDeposit={handleDeposit}
              handleWithdraw={handleWithdraw}
              toast={toast}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel 
              isAdmin={user.is_admin === 1}
              isCreateModalOpen={isCreateModalOpen}
              setIsCreateModalOpen={setIsCreateModalOpen}
              isEditTournamentModalOpen={isEditTournamentModalOpen}
              setIsEditTournamentModalOpen={setIsEditTournamentModalOpen}
              newTournament={newTournament}
              setNewTournament={setNewTournament}
              editingTournament={editingTournament}
              setEditingTournament={setEditingTournament}
              pendingTransactions={pendingTransactions}
              tournaments={tournaments}
              allUsers={allUsers}
              handleApproveTransaction={handleApproveTransaction}
              handleUpdateUser={handleUpdateUser}
              toast={toast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab 
              user={user}
              isEditingUID={isEditingUID}
              setIsEditingUID={setIsEditingUID}
              tempUID={tempUID}
              setTempUID={setTempUID}
              toast={toast}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab notifications={notifications} />
          )}
        </AnimatePresence>
      </main>

      <Toast showToast={showToast} />

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.is_admin === 1} />
    </div>
  );
}

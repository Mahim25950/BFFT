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
  getDocs,
  deleteDoc,
  orderBy,
  increment,
  runTransaction,
  Timestamp,
  limit
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './lib/firebase';
import { User as UserType, Tournament, Transaction, Notification as NotificationType, Announcement, TournamentResult, LeaderboardPrizes } from './types';
import { X, ExternalLink, Trophy, Wallet, Bell, LayoutDashboard, User as UserIcon } from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import WalletTab from './components/WalletTab';
import ProfileTab from './components/ProfileTab';
import HomeTab from './components/HomeTab';
import NotificationsTab from './components/NotificationsTab';
import MyMatchesTab from './components/MyMatchesTab';
import LeaderboardTab from './components/LeaderboardTab';
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
  const [ffUID, setFFUID] = useState('');
  const [ffName, setFFName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [showToast, setShowToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isEditTournamentModalOpen, setIsEditTournamentModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isJoinSuccess, setIsJoinSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTournamentForJoin, setSelectedTournamentForJoin] = useState<Tournament | null>(null);
  const [inputGameId, setInputGameId] = useState('');
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
  const [isEditingFFName, setIsEditingFFName] = useState(false);
  const [tempFFName, setTempFFName] = useState('');
  const [newTournament, setNewTournament] = useState({
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

  // Admin states
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>([]);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [resultData, setResultData] = useState<{
    tournamentId: string;
    screenshot: string;
    kills: number;
  }>({
    tournamentId: '',
    screenshot: '',
    kills: 0
  });
  const [pendingResults, setPendingResults] = useState<TournamentResult[]>([]);
  const [leaderboardPrizes, setLeaderboardPrizes] = useState<LeaderboardPrizes | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "leaderboard_prizes"), (doc) => {
      if (doc.exists()) {
        setLeaderboardPrizes(doc.data() as LeaderboardPrizes);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "tournament_participants"), where("user_id", "==", user.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const joined = snapshot.docs.map(doc => doc.data().tournament_id);
        setJoinedTournaments(joined);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user?.is_admin && activeTab === 'admin') {
      const q = query(collection(db, "tournament_results"), where("status", "==", "pending"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        results.sort((a, b) => {
          const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : (a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at).getTime());
          const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : (b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at).getTime());
          return timeB - timeA;
        });
        setPendingResults(results);
      });
      return () => unsubscribe();
    }
  }, [activeTab, user]);

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
    const q = query(collection(db, "notifications"), orderBy("created_at", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as NotificationType))
        .filter(n => !n.user_id || n.user_id === user?.id || n.user_id === 'global');
      setNotifications(notifList);
    });
    return () => unsubscribe();
  }, [user]);

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
    if (user && (activeTab === 'admin' || activeTab === 'leaderboard')) {
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
    if (isRegistering && (!name || !phone || !ffUID || !ffName)) {
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
          ff_uid: ffUID,
          ff_name: ffName,
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

    if (t.slots_filled >= t.slots) {
      toast('টুর্নামেন্টটি পূর্ণ হয়ে গেছে', 'error');
      return;
    }

    setSelectedTournamentForJoin(t);
    setInputGameId('');
    setIsJoinSuccess(false);
    setIsJoinModalOpen(true);
  };

  const confirmJoinTournament = async () => {
    if (!user || !selectedTournamentForJoin) return;
    
    if (!inputGameId.trim()) {
      toast('গেম আইডি দিন', 'error');
      return;
    }

    if (inputGameId.trim() !== user.ff_uid) {
      toast('ভুল গেম আইডি! আপনার প্রোফাইলে থাকা আইডি ব্যবহার করুন।', 'error');
      return;
    }

    const t = selectedTournamentForJoin;

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

    setLoading(true);
    try {
      // Check for duplicate entry with same FF UID for this tournament
      const q = query(
        collection(db, "tournament_participants"), 
        where("tournament_id", "==", t.id),
        where("game_id", "==", inputGameId.trim())
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast('এই গেম আইডি দিয়ে ইতিমধ্যে জয়েন করা হয়েছে', 'error');
        setLoading(false);
        return;
      }

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
          game_id: inputGameId.trim(),
          slot_number: currentSlots + 1,
          status: 'confirmed',
          created_at: Timestamp.now()
        });
      });
      toast('টুর্নামেন্টে জয়েন করা হয়েছে', 'success');
      setIsJoinSuccess(true);
      // We don't close the modal immediately to show success state
    } catch (e) {
      console.error(e);
      toast('জয়েন করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amount: number, method: string, tid: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "transactions"), {
        user_id: user.id,
        user_name: user.name || 'N/A',
        user_phone: user.phone || 'N/A',
        ff_uid: user.ff_uid || '',
        ff_name: user.ff_name || '',
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
        ff_uid: user.ff_uid || '',
        ff_name: user.ff_name || '',
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

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই টুর্নামেন্টটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    
    try {
      await deleteDoc(doc(db, "tournaments", tournamentId));
      toast('টুর্নামেন্ট মুছে ফেলা হয়েছে', 'success');
    } catch (e) {
      console.error(e);
      toast('মুছে ফেলতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleSubmitResult = async () => {
    if (!user || !resultData.tournamentId || !resultData.screenshot) {
      toast('সবগুলো তথ্য পূরণ করুন', 'error');
      return;
    }

    setIsSubmittingResult(true);
    try {
      await addDoc(collection(db, "tournament_results"), {
        tournament_id: resultData.tournamentId,
        user_id: user.id,
        user_name: user.name || user.email || 'N/A',
        user_phone: user.phone || 'N/A',
        ff_name: user.ff_name || 'N/A',
        ff_uid: user.ff_uid || 'N/A',
        screenshot: resultData.screenshot,
        kills: resultData.kills,
        status: 'pending',
        created_at: Timestamp.now()
      });
      setIsResultModalOpen(false);
      setResultData({ tournamentId: '', screenshot: '', kills: 0 });
      toast('রেজাল্ট জমা দেওয়া হয়েছে। এডমিন যাচাই করবে।', 'success');
    } catch (e: any) {
      console.error(e);
      toast(`Error: ${e.message || 'জমা দিতে সমস্যা হয়েছে'}`, 'error');
    } finally {
      setIsSubmittingResult(false);
    }
  };

  const handleApproveResult = async (result: TournamentResult, status: 'approved' | 'rejected', position: number = 0) => {
    if (!user?.is_admin) return;

    try {
      await runTransaction(db, async (transaction) => {
        const resultDoc = await transaction.get(doc(db, "tournament_results", result.id));
        if (!resultDoc.exists()) throw new Error("Result does not exist!");

        let tournamentData: any = null;
        if (status === 'approved') {
          const tournamentDoc = await transaction.get(doc(db, "tournaments", result.tournament_id));
          if (!tournamentDoc.exists()) throw new Error("Tournament does not exist!");
          tournamentData = tournamentDoc.data();
        }

        // All reads are done, now start writes
        transaction.update(doc(db, "tournament_results", result.id), { status, position });

        if (status === 'approved' && tournamentData) {
          let positionPrize = 0;
          if (position === 1) positionPrize = tournamentData.prize_1st || 0;
          else if (position === 2) positionPrize = tournamentData.prize_2nd || 0;
          else if (position === 3) positionPrize = tournamentData.prize_3rd || 0;

          const perKill = tournamentData.per_kill || 0;
          const kills = result.kills || 0;
          const totalPrize = positionPrize + (kills * perKill);
          
          transaction.update(doc(db, "users", result.user_id), {
            total_kills: increment(kills)
          });

          if (totalPrize > 0) {
            transaction.update(doc(db, "users", result.user_id), {
              balance: increment(totalPrize)
            });

            const newTransRef = doc(collection(db, "transactions"));
            transaction.set(newTransRef, {
              user_id: result.user_id,
              amount: totalPrize,
              type: 'prize',
              status: 'approved',
              created_at: Timestamp.now(),
              user_name: result.user_name,
              user_phone: result.user_phone
            });
          }

          // Create notification for user
          const newNotifRef = doc(collection(db, "notifications"));
          transaction.set(newNotifRef, {
            user_id: result.user_id,
            title: position > 0 ? `অভিনন্দন! আপনি ${position}তম হয়েছেন` : 'টুর্নামেন্ট রিওয়ার্ড',
            message: `আপনার ${tournamentData.title} টুর্নামেন্টের পুরস্কার ৳${totalPrize} (প্রাইজ: ৳${positionPrize}, কিল: ${kills}x৳${perKill}) ব্যালেন্সে যোগ করা হয়েছে।`,
            type: 'success',
            created_at: Timestamp.now()
          });
        }
      });
      toast(status === 'approved' ? 'রেজাল্ট অনুমোদন করা হয়েছে' : 'রেজাল্ট বাতিল করা হয়েছে', 'success');
    } catch (e: any) {
      console.error(e);
      toast(`অপারেশন ব্যর্থ হয়েছে: ${e.message || ''}`, 'error');
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
        ffUID={ffUID}
        setFFUID={setFFUID}
        ffName={ffName}
        setFFName={setFFName}
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

      <Header user={user} onOpenMenu={() => setIsMenuOpen(true)} />

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex justify-start">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 h-full bg-zinc-900 border-r border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Trophy size={20} className="text-primary" />
                  </div>
                  <h2 className="font-bold text-lg">মেনু</h2>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => { setActiveTab('my-matches'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'my-matches' ? 'bg-primary text-white' : 'hover:bg-white/5 text-white/60'}`}
                >
                  <Trophy size={20} />
                  <span className="font-bold">আমার ম্যাচ</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('wallet'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'wallet' ? 'bg-primary text-white' : 'hover:bg-white/5 text-white/60'}`}
                >
                  <Wallet size={20} />
                  <span className="font-bold">ওয়ালেট</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('notifications'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'notifications' ? 'bg-primary text-white' : 'hover:bg-white/5 text-white/60'}`}
                >
                  <Bell size={20} />
                  <span className="font-bold">নোটিফিকেশন</span>
                </button>
                {user?.is_admin === 1 && (
                  <button 
                    onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'admin' ? 'bg-primary text-white' : 'hover:bg-white/5 text-white/60'}`}
                  >
                    <LayoutDashboard size={20} />
                    <span className="font-bold">এডমিন প্যানেল</span>
                  </button>
                )}
              </div>

              <div className="absolute bottom-8 left-6 right-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black overflow-hidden flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon size={20} className="text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="pt-24 px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeTab 
              tournaments={tournaments} 
              handleJoinTournament={handleJoinTournament} 
              adProgress={adProgress}
              isWatchingAd={isWatchingAd}
              onWatchAd={handleWatchAd}
              joinedTournaments={joinedTournaments}
              onSubmitResult={(id) => {
                setResultData({ ...resultData, tournamentId: id });
                setIsResultModalOpen(true);
              }}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardTab 
              users={allUsers} 
              prizes={leaderboardPrizes} 
              currentUser={user}
            />
          )}

          {activeTab === 'my-matches' && (
            <MyMatchesTab 
              tournaments={tournaments}
              joinedTournaments={joinedTournaments}
              handleJoinTournament={handleJoinTournament}
              adProgress={adProgress}
              isWatchingAd={isWatchingAd}
              onWatchAd={handleWatchAd}
              onSubmitResult={(id) => {
                setResultData({ ...resultData, tournamentId: id });
                setIsResultModalOpen(true);
              }}
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
              pendingResults={pendingResults}
              handleApproveTransaction={handleApproveTransaction}
              handleApproveResult={handleApproveResult}
              handleUpdateUser={handleUpdateUser}
              handleDeleteTournament={handleDeleteTournament}
              toast={toast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab 
              user={user}
              isEditingUID={isEditingUID}
              setIsEditingUID={setIsEditingUID}
              isEditingFFName={isEditingFFName}
              setIsEditingFFName={setIsEditingFFName}
              tempUID={tempUID}
              setTempUID={setTempUID}
              tempFFName={tempFFName}
              setTempFFName={setTempFFName}
              toast={toast}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab notifications={notifications} />
          )}
        </AnimatePresence>
      </main>

      <Toast showToast={showToast} />

      {/* Result Submission Modal */}
      <AnimatePresence>
        {isResultModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResultModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6"
            >
              <h2 className="text-xl font-bold mb-6">রেজাল্ট জমা দিন</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">কতটি কিল করেছেন?</label>
                  <input 
                    type="number"
                    className="input-field"
                    placeholder="যেমন: ৫"
                    value={resultData.kills}
                    onChange={(e) => setResultData({ ...resultData, kills: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">স্ক্রিনশট ইমেজ লিঙ্ক (Proof)</label>
                  <input 
                    type="url"
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                    value={resultData.screenshot}
                    onChange={(e) => setResultData({ ...resultData, screenshot: e.target.value })}
                  />
                  <p className="text-[10px] text-white/40 mt-2">
                    ইমেজটি কোনো হোস্টিং সাইটে (যেমন: imgbb.com) আপলোড করে লিঙ্ক এখানে দিন।
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsResultModalOpen(false)}
                    className="btn-secondary flex-1 py-3"
                    disabled={isSubmittingResult}
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={handleSubmitResult}
                    className="btn-primary flex-1 py-3"
                    disabled={isSubmittingResult}
                  >
                    {isSubmittingResult ? 'জমা হচ্ছে...' : 'জমা দিন'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Tournament Modal */}
      <AnimatePresence>
        {isJoinModalOpen && selectedTournamentForJoin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && !isJoinSuccess && setIsJoinModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              {!isJoinSuccess ? (
                <>
                  <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold mb-1">টুর্নামেন্টে জয়েন করুন</h2>
                    <p className="text-white/40 text-xs">নিচের তথ্যগুলো যাচাই করে জয়েন করুন</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Tournament Info Summary */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-white/40">টুর্নামেন্ট:</span>
                        <span className="text-sm font-bold">{selectedTournamentForJoin.title}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-white/40">এন্ট্রি ফি:</span>
                        <span className="text-sm font-bold text-primary">
                          {selectedTournamentForJoin.is_free ? 'ফ্রি' : `৳${selectedTournamentForJoin.entry_fee}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">আপনার ব্যালেন্স:</span>
                        <span className="text-sm font-bold">৳{user.balance}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs text-white/40 font-medium">আপনার গেম আইডি (UID)</label>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">প্রোফাইল আইডি: {user.ff_uid}</span>
                        </div>
                        <input 
                          type="text"
                          className="input-field"
                          placeholder="আপনার গেম আইডি লিখুন"
                          value={inputGameId}
                          onChange={(e) => setInputGameId(e.target.value)}
                        />
                        <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
                          সতর্কতা: আপনার প্রোফাইলে নিবন্ধিত আইডিটিই দিতে হবে। ভুল আইডি দিলে টুর্নামেন্ট থেকে ডিসকোয়ালিফাই করা হতে পারে।
                        </p>
                      </div>

                      <div className="pt-2 flex gap-3">
                        <button 
                          onClick={() => setIsJoinModalOpen(false)}
                          className="btn-secondary flex-1 py-3"
                          disabled={loading}
                        >
                          বাতিল
                        </button>
                        <button 
                          onClick={confirmJoinTournament}
                          className="btn-primary flex-1 py-3 shadow-lg shadow-primary/20"
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>প্রসেসিং...</span>
                            </div>
                          ) : 'জয়েন নিশ্চিত করুন'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="text-green-500" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">অভিনন্দন!</h2>
                  <p className="text-white/60 mb-8">
                    আপনি সফলভাবে <span className="text-white font-bold">{selectedTournamentForJoin.title}</span> টুর্নামেন্টে জয়েন করেছেন।
                  </p>
                  <button 
                    onClick={() => setIsJoinModalOpen(false)}
                    className="btn-primary w-full py-4"
                  >
                    ঠিক আছে
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

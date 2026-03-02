import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Plus, ShieldCheck, CheckCircle2, AlertCircle, Phone, Users, Copy, Settings, ChevronRight, LogOut, CreditCard } from 'lucide-react';
import { User } from '../types';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface ProfileTabProps {
  user: User;
  isEditingUID: boolean;
  setIsEditingUID: (val: boolean) => void;
  tempUID: string;
  setTempUID: (val: string) => void;
  toast: (msg: string, type: 'success' | 'error') => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  isEditingUID,
  setIsEditingUID,
  tempUID,
  setTempUID,
  toast
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [showAvatarUrlInput, setShowAvatarUrlInput] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatar || '');

  const handleAvatarUpdate = async () => {
    if (!avatarUrl) {
      toast('ইমেজ লিঙ্ক দিন', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await updateDoc(doc(db, "users", user.id), { avatar: avatarUrl });
      toast('প্রোফাইল পিকচার আপডেট হয়েছে', 'success');
      setShowAvatarUrlInput(false);
    } catch (e: any) {
      console.error(e);
      toast(`Error: ${e.message || 'আপলোড ব্যর্থ হয়েছে'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      key="profile"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent p-1 mb-4">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={48} className="text-white/20" />
              )}
            </div>
          </div>
          <button 
            onClick={() => setShowAvatarUrlInput(!showAvatarUrlInput)}
            className="absolute bottom-4 right-0 w-8 h-8 bg-primary rounded-full border-4 border-black flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          >
            <Plus size={16} />
          </button>
        </div>

        {showAvatarUrlInput && (
          <div className="w-full max-w-xs mt-4 space-y-2">
            <input 
              type="url"
              className="input-field text-xs py-2"
              placeholder="ইমেজ লিঙ্ক দিন (যেমন: imgbb.com)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAvatarUrlInput(false)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                বাতিল
              </button>
              <button 
                onClick={handleAvatarUpdate}
                disabled={isUploading}
                className="btn-primary flex-1 py-2 text-xs"
              >
                {isUploading ? 'আপডেট হচ্ছে...' : 'আপডেট'}
              </button>
            </div>
          </div>
        )}
        <h2 className="text-xl font-bold">{user.name || 'আপনার নাম'}</h2>
        <p className="text-white/40 text-sm">{user.email}</p>
      </div>

      <div className="space-y-4">
        <div className="glass p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <ShieldCheck size={20} className="text-primary" />
            <div className="flex-1">
              <p className="font-bold text-sm">ফ্রি ফায়ার ইউআইডি</p>
              {isEditingUID ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text"
                    className="input-field py-1 text-xs"
                    value={tempUID}
                    onChange={(e) => setTempUID(e.target.value)}
                    placeholder="আপনার ইউআইডি লিখুন"
                    autoFocus
                  />
                  <button 
                    onClick={async () => {
                      if (tempUID.trim()) {
                        try {
                          await updateDoc(doc(db, "users", user.id), { ff_uid: tempUID.trim() });
                          toast('ইউআইডি আপডেট হয়েছে', 'success');
                          setIsEditingUID(false);
                        } catch (e) {
                          toast('আপডেট করতে সমস্যা হয়েছে', 'error');
                        }
                      }
                    }}
                    className="bg-primary text-white p-1 rounded-lg"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button 
                    onClick={() => setIsEditingUID(false)}
                    className="bg-white/10 text-white/60 p-1 rounded-lg"
                  >
                    <AlertCircle size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-white/40">{user.ff_uid || 'সেট করা নেই'}</p>
              )}
            </div>
          </div>
          {!isEditingUID && (
            <button 
              onClick={() => {
                setTempUID(user.ff_uid || '');
                setIsEditingUID(true);
              }}
              className="text-primary text-xs font-bold"
            >
              এডিট
            </button>
          )}
        </div>

        <div className="glass p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-primary" />
            <div>
              <p className="font-bold text-sm">বর্তমান ব্যালেন্স</p>
              <p className="text-xs text-white/40">৳{user.balance}</p>
            </div>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-green-500" />
            <div>
              <p className="font-bold text-sm">মোবাইল নাম্বার</p>
              <p className="text-xs text-white/40">{user.phone || 'সেট করা নেই'}</p>
            </div>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-blue-500" />
            <div>
              <p className="font-bold text-sm">রেফারেল কোড</p>
              <p className="text-xs text-white/40">{user.referral_code}</p>
            </div>
          </div>
          <button className="text-white/40"><Copy size={16} /></button>
        </div>

        <div className="pt-4 space-y-2">
          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors">
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-white/40" />
              <span className="font-medium">সেটিংস</span>
            </div>
            <ChevronRight size={20} className="text-white/20" />
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 rounded-2xl transition-colors text-red-500"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} />
              <span className="font-medium">লগআউট</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileTab;

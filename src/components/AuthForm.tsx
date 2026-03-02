import React from 'react';
import { motion } from 'motion/react';
import { Trophy, User as UserIcon, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  ffUID: string;
  setFFUID: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  handleAuth: () => void;
  loading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({
  isRegistering,
  setIsRegistering,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  phone,
  setPhone,
  ffUID,
  setFFUID,
  showPassword,
  setShowPassword,
  handleAuth,
  loading
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md text-center relative z-10"
      >
        <div className="w-24 h-24 bg-white/5 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(255,0,0,0.1)] overflow-hidden">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/apps-sell-receipt.appspot.com/o/image%2F1000155659.png?alt=media&token=53ad9bd9-dc3b-4194-808e-4dc60f9f7143" 
            alt="Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">{isRegistering ? 'অ্যাকাউন্ট তৈরি করুন' : 'স্বাগতম!'}</h1>
        <p className="text-white/60 mb-8">বাংলাদেশ ফ্রি ফায়ার টুর্নামেন্ট প্ল্যাটফর্মে আপনার যাত্রা শুরু করুন।</p>
        
        <div className="space-y-4 text-left">
          {isRegistering && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input 
                  type="text" 
                  placeholder="আপনার পুরো নাম" 
                  className="input-field pl-12"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input 
                  type="tel" 
                  placeholder="মোবাইল নাম্বার" 
                  className="input-field pl-12"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="relative">
                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input 
                  type="text" 
                  placeholder="ফ্রি ফায়ার ইউআইডি (গেম আইডি)" 
                  className="input-field pl-12"
                  value={ffUID}
                  onChange={(e) => setFFUID(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input 
              type="email" 
              placeholder="ইমেইল এড্রেস" 
              className="input-field pl-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="পাসওয়ার্ড" 
              className="input-field pl-12 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            onClick={handleAuth} 
            disabled={loading}
            className="btn-primary w-full text-lg py-4 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isRegistering ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'
            )}
          </button>
          
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setName('');
              setPhone('');
              setFFUID('');
            }}
            className="w-full text-center text-sm text-white/40 hover:text-primary transition-colors"
          >
            {isRegistering ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'অ্যাকাউন্ট নেই? নতুন তৈরি করুন'}
          </button>
        </div>
        
        <p className="mt-8 text-xs text-white/30">
          এগিয়ে যাওয়ার মাধ্যমে আপনি আমাদের শর্তাবলী এবং গোপনীয়তা নীতিতে সম্মত হচ্ছেন।
        </p>
      </motion.div>
    </div>
  );
};

export default AuthForm;

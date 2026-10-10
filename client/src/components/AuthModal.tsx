import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Zap,
  Mail,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  ShieldCheck,
  Gamepad2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'student' | 'host';
  onSuccess?: () => void;
}

const AVATARS = ['⚡', '🔥', '🧠', '🎯', '🚀', '⭐', '👾', '👑', '🛡️', '💎'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'student',
  onSuccess
}) => {
  const { login, register, guestLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<'student' | 'host'>(defaultRole);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('LogicRush Institute of Technology');
  const [course, setCourse] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [avatar, setAvatar] = useState('⚡');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('login');
    setRole(defaultRole);
    setErrorMessage('');
    setPassword('');
  }, [isOpen, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        const res = await login({ email, password });
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          onClose();
          onSuccess?.();
        }
      } else if (activeTab === 'register') {
        const res = await register({
          email,
          password,
          name,
          role,
          college,
          course,
          year,
          avatar
        });
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          onClose();
          onSuccess?.();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestPlay = async () => {
    setIsSubmitting(true);
    try {
      const res = await guestLogin();
      if (!res.error) {
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      setErrorMessage('Guest login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-8 bg-dark-card border border-purple-500/30 overflow-hidden shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h3 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            {activeTab === 'login' ? 'WELCOME BACK TO THE ARENA' : activeTab === 'register' ? 'JOIN LOGICRUSH' : 'RESET YOUR PASSWORD'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {role === 'host' ? 'Host & Faculty Quiz Portal' : 'Student Placement & Aptitude Arena'}
          </p>
        </div>

        {/* Role Selector Tabs (Student vs Host) */}
        {activeTab !== 'forgot' && (
          <div className="flex rounded-xl bg-slate-900/90 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'student'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Student Player
            </button>
            <button
              type="button"
              onClick={() => setRole('host')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'host'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Host / Faculty
            </button>
          </div>
        )}

        {/* Error / Success Messages */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}
        {activeTab === 'forgot' && (
          <div className="p-3 mb-4 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs font-semibold">
            Secure password recovery is not configured yet. Please contact your administrator.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Register extra fields */}
          {activeTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">College / Institute</label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course & Year</label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Choose Avatar</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        avatar === av
                          ? 'bg-purple-600 scale-110 border-2 border-cyan-400 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          {activeTab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">Password</label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password reset is unavailable until verified email delivery is configured. */}
          {activeTab === 'forgot' && (
            <p className="text-xs text-slate-400">
              Password reset is not available yet. Please contact your administrator.
            </p>
          )}

          {/* Submit Button */}
          {activeTab !== 'forgot' && <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
              role === 'host'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-brand-violet to-brand-cyan shadow-purple-500/20'
            } hover:opacity-95 disabled:opacity-50`}
          >
            {isSubmitting
              ? 'Authenticating...'
              : activeTab === 'login'
              ? `Enter Arena as ${role === 'host' ? 'Host' : 'Student'}`
              : activeTab === 'register'
              ? 'Create LogicRush Account'
              : ''}
          </button>
          }
        </form>

        {/* Divider & Guest Play Mode */}
        {role === 'student' && activeTab === 'login' && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleGuestPlay}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              1-Click Instant Guest Practice Mode
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              No registration needed. Guest sessions do not persist global rank.
            </p>
          </div>
        )}

        {/* Switch tab links */}
        <div className="mt-5 text-center text-xs text-slate-400">
          {activeTab === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                className="text-purple-400 hover:text-purple-300 font-bold"
              >
                Sign Up Now
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                className="text-purple-400 hover:text-purple-300 font-bold"
              >
                Log In
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

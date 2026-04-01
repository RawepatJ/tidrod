'use client';

import { useEffect, useState } from 'react';
import { Mail, X, ArrowRight, Loader2 } from 'lucide-react';
import { useSession } from './SessionProvider';
import { fetchAuth } from '@/lib/api';
import { useToast } from './Toast';

export default function VerificationBanner() {
  const { user, refresh } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [hasResent, setHasResent] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!user || user.email_verified) return;

    const handleFocus = () => {
      refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refresh]);

  if (!user || user.email_verified) return null;

  const handleResend = async () => {
    setIsResending(true);
    try {
      await fetchAuth('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: user.email }),
      });
      setHasResent(true);
      addToast('Verification email resent! Please check your inbox.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to resend verification email', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#FF9B51] to-[#FF8235] text-white py-2 px-4 shadow-lg animate-slide-down">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Mail size={16} className="text-white animate-bounce" />
          </div>
          <p className="text-sm font-medium">
            <span className="hidden sm:inline">Please verify your email to access all features.</span>
            <span className="sm:hidden font-bold">Verify your email</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleResend}
            disabled={isResending || hasResent}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#FF9B51] rounded-full text-xs font-bold hover:bg-[#F8FAFC] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
          >
            {isResending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : hasResent ? (
              'Sent!'
            ) : (
              <>
                Resend Email <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

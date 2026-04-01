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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!user || user.email_verified) return;

    const handleFocus = () => {
      refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refresh]);

  if (!user || user.email_verified || !isVisible) return null;

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
    <div className="fixed bottom-4 left-4 right-4 z-[60] bg-gradient-to-r from-[#FF9B51] to-[#FF8235] text-white py-3 px-5 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md animate-slide-up transform motion-safe:hover:scale-[1.01] transition-transform">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Mail size={20} className="text-white animate-bounce" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold tracking-tight">Check your inbox!</h4>
            <p className="text-[11px] font-medium opacity-90 truncate leading-tight">
              Please verify your email to unlock all features.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleResend}
            disabled={isResending || hasResent}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-[#FF9B51] rounded-full text-xs font-bold hover:bg-[#F8FAFC] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap active:scale-95"
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
          
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

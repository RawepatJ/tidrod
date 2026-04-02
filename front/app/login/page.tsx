"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/Toast";
import { Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      login(data.token);
      addToast('Welcome back! 👋', 'success');
      router.push("/home");
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred";
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#25343F] via-[#1a2a35] to-[#0f1c24] flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF9B51]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#BFC9D1]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-[#FF9B51]">Tid</span><span className="text-white">Rod</span>
            </h1>
            <p className="text-[#BFC9D1] mt-3 font-medium">Welcome back, traveler</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#BFC9D1] mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/40 group-focus-within:text-[#FF9B51] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#BFC9D1]/30 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51]/50 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label htmlFor="password" className="text-sm font-medium text-[#BFC9D1]">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/40 group-focus-within:text-[#FF9B51] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#BFC9D1]/30 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51]/50 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 mt-4 rounded-xl bg-[#FF9B51] text-white font-bold shadow-lg shadow-[#FF9B51]/25 hover:shadow-[#FF9B51]/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-[#BFC9D1]/60">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#FF9B51] hover:text-[#e8893f] font-bold transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF9B51]/20 via-[#BFC9D1]/10 to-[#FF9B51]/20 rounded-[32px] blur-xl -z-10" />
      </div>
    </div>
  );
}

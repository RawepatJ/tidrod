"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/Toast";
import { Loader2, User, Mail, Lock, Users } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useSession();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!name.trim()) {
        setError("Name is required");
        setIsLoading(false);
        return;
      }
      if (!gender) {
        setError("Gender is required");
        setIsLoading(false);
        return;
      }
      const data = await registerUser(name, email, password, gender);
      login(data.token);
      addToast('Account created successfully! 🎉 Welcome to TidRod!', 'success', 5000);
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
    <div className="min-h-screen bg-gradient-to-br from-[#25343F] via-[#1a2a35] to-[#0f1c24] flex items-center justify-center p-4 pt-24">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF9B51]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#BFC9D1]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-[#FF9B51]">Tid</span><span className="text-white">Rod</span>
            </h1>
            <p className="text-[#BFC9D1] mt-2">Create your account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#BFC9D1] mb-1.5 ml-1">
                Username
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/40" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="traveler_name"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#BFC9D1]/30 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51]/50 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-[#BFC9D1] mb-1.5 ml-1">
                Gender
              </label>
              <div className="relative">
                <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/40 pointer-events-none" />
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51]/50 transition-all font-medium appearance-none"
                >
                  <option value="" disabled className="text-[#25343F]">Select gender</option>
                  <option value="female" className="text-[#25343F]">Female</option>
                  <option value="male" className="text-[#25343F]">Male</option>
                  <option value="prefer_not" className="text-[#25343F]">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#BFC9D1] mb-1.5 ml-1">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#BFC9D1]/30 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51]/50 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#BFC9D1] mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/40" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#BFC9D1]/30 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51]/50 transition-all font-medium"
                />
              </div>
              <p className="text-[10px] text-[#BFC9D1]/40 mt-1.5 ml-1">Minimum 8 characters required</p>
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
                  Create Account
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#BFC9D1]/60">
            Already have an account?{" "}
            <Link href="/login" className="text-[#FF9B51] hover:text-[#e8893f] font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF9B51]/20 via-[#BFC9D1]/10 to-[#FF9B51]/20 rounded-[32px] blur-xl -z-10" />
      </div>
    </div>
  );
}

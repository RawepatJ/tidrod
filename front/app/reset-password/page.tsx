"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing or invalid reset token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      addToast("Password must be at least 8 characters", "error");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        addToast("Password reset successful!", "success");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Reset failed");
        addToast(data.error || "Reset failed", "error");
      }
    } catch (err) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#25343F] to-[#1a2a35] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        {status === "success" ? (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
            <CheckCircle size={56} className="mx-auto text-green-400" />
            <h1 className="text-2xl font-bold text-white">Password Reset!</h1>
            <p className="text-[#BFC9D1]">Your password has been successfully updated. Redirecting you to login...</p>
            <Link href="/login" className="inline-block mt-4 text-[#FF9B51] font-bold hover:underline">
               Go to Login
            </Link>
          </div>
        ) : status === "error" ? (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
            <XCircle size={56} className="mx-auto text-red-400" />
            <h1 className="text-2xl font-bold text-white">Reset Failed</h1>
            <p className="text-[#BFC9D1]">{message}</p>
            <Link href="/forgot-password"  className="inline-block mt-4 text-[#FF9B51] font-bold hover:underline">
               Try again
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-white">Reset Password</h1>
              <p className="text-[#BFC9D1] mt-2">Choose a strong new password</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#BFC9D1] mb-2 ml-1">New Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/30 group-focus-within:text-[#FF9B51] transition-colors" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#BFC9D1] mb-2 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/30 group-focus-within:text-[#FF9B51] transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 bg-[#FF9B51] text-white rounded-xl font-bold hover:bg-[#e8893f] transition-all disabled:opacity-50 shadow-lg shadow-[#FF9B51]/20 flex items-center justify-center gap-2"
              >
                {status === "loading" ? <Loader2 size={20} className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#25343F] flex items-center justify-center">
            <Loader2 size={32} className="text-[#FF9B51] animate-spin" />
        </div>
    }>
        <ResetPasswordContent />
    </Suspense>
  );
}

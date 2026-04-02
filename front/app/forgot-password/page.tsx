"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setIsSent(true);
        addToast("ตรวจสอบอีเมลของคุณเพื่อดูคำแนะนำ!", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "ส่งลิงก์รีเซ็ตไม่สำเร็จ", "error");
      }
    } catch (err) {
      addToast("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#25343F] to-[#1a2a35] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/login" className="inline-flex items-center gap-2 text-[#BFC9D1] hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
        </Link>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {isSent ? (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
                <CheckCircle size={56} className="mx-auto text-green-400" />
                <h1 className="text-2xl font-bold text-white">ตรวจสอบอีเมลของคุณ</h1>
                <p className="text-[#BFC9D1] leading-relaxed">
                    เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ <span className="text-white font-semibold">{email}</span> แล้ว กรุณาตรวจสอบกล่องจดหมายและปฏิบัติตามคำแนะนำ
                </p>
                <div className="pt-4 flex flex-col gap-3">
                    <button 
                         onClick={() => setIsSent(false)}
                         className="text-[#FF9B51] font-bold hover:underline"
                    >
                        ส่งอีเมลอีกครั้ง
                    </button>
                    <Link href="/login" className="text-sm text-[#BFC9D1]/40 hover:text-[#BFC9D1] transition-colors">
                        กลับสู่หน้าเข้าสู่ระบบ
                    </Link>
                </div>
            </div>
          ) : (
            <>
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold text-white">ลืมรหัสผ่านใช่ไหม?</h1>
                    <p className="text-[#BFC9D1] mt-2">กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ต</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#BFC9D1] mb-2 ml-1">
                            ที่อยู่อีเมล
                        </label>
                        <div className="relative group">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC9D1]/30 group-focus-within:text-[#FF9B51] transition-colors" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/30 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#FF9B51] text-white rounded-xl font-bold hover:bg-[#e8893f] transition-all disabled:opacity-50 shadow-lg shadow-[#FF9B51]/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : "ส่งลิงก์รีเซ็ต"}
                    </button>
                </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

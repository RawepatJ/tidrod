"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

import { useSession } from "@/components/SessionProvider";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refresh } = useSession();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [hasCalled, setHasCalled] = useState(false);

  useEffect(() => {
    if (!token || hasCalled) {
      if (!token) {
        setStatus("error");
        setMessage("ไม่พบโทเค็นการยืนยัน");
      }
      return;
    }

    const verify = async () => {
      setHasCalled(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
          
          if (user) {
            refresh();
          }

          setTimeout(() => {
            router.push(user ? "/home" : "/login");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "การยืนยันล้มเหลว");
        }
      } catch (err) {
        setStatus("error");
        setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน");
      }
    };

    verify();
  }, [token, router, user, refresh, hasCalled]);

  return (
    <div className="min-h-screen bg-[#EAEFEF] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 size={48} className="mx-auto text-[#FF9B51] animate-spin" />
            <h2 className="text-xl font-bold text-[#25343F]">กำลังยืนยันอีเมลของคุณ...</h2>
            <p className="text-[#25343F]/60">กรุณารอสักครู่ขณะเรากำลังยืนยันบัญชีของคุณ</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <h2 className="text-xl font-bold text-[#25343F]">ยืนยันสำเร็จ!</h2>
            <p className="text-[#25343F]/60">{message}</p>
            <p className="text-sm text-[#FF9B51]">กำลังพาคุณไปหน้าเข้าสู่ระบบ...</p>
            <Link 
              href="/login" 
              className="inline-block mt-4 text-[#FF9B51] font-bold hover:underline"
            >
              คลิกที่นี่หากระบบไม่เปลี่ยนหน้าอัตโนมัติ
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <XCircle size={48} className="mx-auto text-red-500" />
            <h2 className="text-xl font-bold text-[#25343F]">การยืนยันล้มเหลว</h2>
            <p className="text-[#25343F]/60">{message}</p>
            <div className="pt-4 flex flex-col gap-3">
                <Link 
                  href="/register" 
                  className="w-full py-3 bg-[#FF9B51] text-white rounded-xl font-bold shadow-md"
                >
                  กลับไปหน้าสมัครสมาชิก
                </Link>
                <Link 
                  href="/login" 
                  className="text-sm text-[#25343F]/40 hover:text-[#25343F] font-medium"
                >
                  ลองเข้าสู่ระบบ
                </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#EAEFEF] flex items-center justify-center">
            <Loader2 size={32} className="text-[#FF9B51] animate-spin" />
        </div>
    }>
        <VerifyEmailContent />
    </Suspense>
  );
}

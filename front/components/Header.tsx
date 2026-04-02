"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "./SessionProvider";
import { Map, Home, Shield, LogOut, User } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useSession();

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed left-2 right-2 sm:left-4 sm:right-4 flex h-[56px] rounded-full py-2 sm:py-4 my-3 sm:my-4 backdrop-blur-md bg-white/80 shadow-md shrink-0 z-50 border border-[#BFC9D1]/30 font-main">
      <div className="flex justify-between items-center w-full px-2 sm:px-0">
        {/* Logo */}
        <div>
          <Link href="/" className="text-lg sm:text-xl font-bold ml-2 sm:ml-10 text-[#25343F] whitespace-nowrap">
            <span className="text-[#FF9B51]">Tid</span>Rod
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex gap-3 sm:gap-6 mr-2 sm:mr-10 items-center">
          <Link
            href="/"
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors ${isActive('/') ? 'text-[#FF9B51]' : 'text-[#25343F]/70 hover:text-[#FF9B51]'}`}
          >
            <Home size={18} />
            <span className="hidden sm:inline">หน้าแรก</span>
          </Link>
          <Link
            href="/home"
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors ${isActive('/home') ? 'text-[#FF9B51]' : 'text-[#25343F]/70 hover:text-[#FF9B51]'}`}
          >
            <Map size={18} />
            <span className="hidden sm:inline">แผนที่</span>
          </Link>
          {user?.role?.toLowerCase() === 'admin' && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors ${isActive('/admin') ? 'text-[#FF9B51]' : 'text-[#25343F]/70 hover:text-[#FF9B51]'}`}
            >
              <Shield size={18} />
              <span className="hidden sm:inline">ผู้ดูแล</span>
            </Link>
          )}

          {/* Auth Section */}
          {isLoading ? (
            <div className="w-12 sm:w-20 h-8 bg-[#EAEFEF] rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Notification Bell */}
              <NotificationBell />

              <Link
                href="/profile"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/profile') ? 'text-[#FF9B51]' : 'text-[#25343F]/60 hover:text-[#FF9B51]'}`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[#FF9B51] border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white text-[10px] sm:text-xs font-bold uppercase">
                      {user.username.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="hidden lg:inline font-semibold">{user.username}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="p-1.5 sm:p-2 text-[#25343F]/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full bg-[#FF9B51] text-white hover:bg-[#e8893f] transition-colors shadow-md font-semibold"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

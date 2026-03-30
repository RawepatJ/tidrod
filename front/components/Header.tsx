"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "./SessionProvider";

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
    <header className="fixed left-4 right-4 flex h-[56px] rounded-full py-4 my-4 backdrop-blur-md bg-white/80 shadow-md shrink-0 z-50 border border-[#BFC9D1]/30">
      <div className="flex justify-between items-center w-full">
        {/* Logo */}
        <div>
          <Link href="/" className="text-xl font-bold m-auto mx-10 text-[#25343F]">
            <span className="text-[#FF9B51]">Tid</span>Rod
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex gap-8 mx-10 items-center">
          <Link
            href="/home"
            className={`text-sm font-medium transition-colors ${isActive('/home') ? 'text-[#FF9B51]' : 'text-[#25343F]/70 hover:text-[#FF9B51]'}`}
          >
            Map
          </Link>
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-[#FF9B51]' : 'text-[#25343F]/70 hover:text-[#FF9B51]'}`}
          >
            Home
          </Link>
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors ${isActive('/admin') ? 'text-[#FF9B51]' : 'text-[#25343F]/70 hover:text-[#FF9B51]'}`}
            >
              Admin
            </Link>
          )}

          {/* Auth Section */}
          {isLoading ? (
            <div className="w-20 h-8 bg-[#EAEFEF] rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/profile') ? 'text-[#FF9B51]' : 'text-[#25343F]/60 hover:text-[#FF9B51]'}`}
              >
                <div className="w-7 h-7 rounded-full bg-[#FF9B51] text-white flex items-center justify-center text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-1.5 text-sm rounded-full bg-[#25343F] text-white hover:bg-[#25343F]/80 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-5 py-1.5 text-sm rounded-full bg-[#FF9B51] text-white hover:bg-[#e8893f] transition-colors shadow-md font-semibold"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

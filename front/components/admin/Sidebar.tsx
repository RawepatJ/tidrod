"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Map, AlertTriangle, FileText } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/trips", label: "Trips", icon: Map },
    { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
    { href: "/admin/logs", label: "System Logs", icon: FileText },
  ];

  return (
    <div className="w-64 bg-white border-r border-[#BFC9D1]/30 h-[calc(100vh-100px)] p-6 mt-4 rounded-xl shadow-sm hidden md:block">
      <h2 className="text-sm font-bold text-[#BFC9D1] uppercase tracking-wider mb-4">Admin Panel</h2>
      <nav className="space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
                isActive
                  ? "bg-[#FF9B51]/10 text-[#FF9B51]"
                  : "text-[#25343F]/70 hover:bg-[#F2F4F7] hover:text-[#25343F]"
              }`}
            >
              <Icon size={18} className={isActive ? "text-[#FF9B51]" : "text-[#BFC9D1]"} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

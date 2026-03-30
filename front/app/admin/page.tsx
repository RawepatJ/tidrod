"use client";

import { useEffect, useState } from "react";
import { Users, Map, AlertTriangle } from "lucide-react";
import { fetchAuth } from "@/lib/api";

type Stats = { users: number; trips: number; pendingReports: number };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchAuth("/api/admin/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#25343F]">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#BFC9D1]/30 shadow-sm flex items-center gap-4">
          <div className="bg-[#FF9B51]/10 p-4 rounded-full text-[#FF9B51]">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#BFC9D1]">Total Users</p>
            <p className="text-3xl font-bold text-[#25343F]">{stats?.users || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#BFC9D1]/30 shadow-sm flex items-center gap-4">
          <div className="bg-[#10B981]/10 p-4 rounded-full text-[#10B981]">
            <Map size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#BFC9D1]">Total Trips</p>
            <p className="text-3xl font-bold text-[#25343F]">{stats?.trips || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#BFC9D1]/30 shadow-sm flex items-center gap-4">
          <div className="bg-[#EF4444]/10 p-4 rounded-full text-[#EF4444]">
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#BFC9D1]">Pending Reports</p>
            <p className="text-3xl font-bold text-[#25343F]">{stats?.pendingReports || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-[#F8FAFC] p-6 rounded-xl border border-[#BFC9D1]/20">
         <h2 className="text-lg font-semibold text-[#25343F] mb-2">Welcome to your Admin Dashboard!</h2>
         <p className="text-[#25343F]/70 text-sm">
           From here you can manage all users, review reported content, and view system logs.
           Use the sidebar to navigate between different panels.
         </p>
      </div>
    </div>
  );
}

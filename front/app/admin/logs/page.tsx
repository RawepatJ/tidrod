"use client";

import { useEffect, useState } from "react";
import { fetchAuth } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Activity } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
  performer: string;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const data = await fetchAuth("/api/admin/logs");
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
      addToast("โหลดบันทึกไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-[#BFC9D1]/20 p-2 rounded-lg text-[#25343F]">
          <Activity size={24} />
        </div>
        <h1 className="text-2xl font-bold text-[#25343F]">บันทึกระบบ</h1>
      </div>

      {loading ? (
        <p className="text-[#BFC9D1]">กำลังโหลดบันทึก...</p>
      ) : (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#BFC9D1]/50 rounded-xl text-[#BFC9D1]">
              ไม่พบบันทึกระบบ บันทึกจะแสดงที่นี่เมื่อมีการดำเนินการสำคัญเกิดขึ้น
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 bg-white border border-[#BFC9D1]/30 rounded-xl shadow-sm text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-[#25343F] uppercase tracking-wide text-xs bg-[#F2F4F7] px-2 py-1 rounded">
                    {log.action}
                  </span>
                  <span className="text-xs text-[#BFC9D1]">
                    {new Date(log.created_at).toLocaleString('th-TH')}
                  </span>
                </div>
                
                <div className="text-[#25343F]/80">
                  <span className="font-medium">ผู้ดำเนินการ: </span>
                  {log.performer || "ระบบ / ไม่ทราบชื่อ"} 
                  <span className="mx-2 text-[#BFC9D1]">|</span>
                  <span className="font-medium">เป้าหมาย: </span>
                  {log.target_type === 'USER' ? 'ผู้ใช้' : log.target_type === 'TRIP' ? 'ทริป' : log.target_type === 'REPORT' ? 'รายงาน' : log.target_type} ({log.target_id || "ไม่มี"})
                </div>
                
                {log.details && (
                  <pre className="mt-3 p-3 bg-[#F8FAFC] rounded-lg text-xs overflow-x-auto border border-[#BFC9D1]/10 text-[#25343F]/70">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

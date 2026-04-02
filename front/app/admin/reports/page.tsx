"use client";

import { useEffect, useState } from "react";
import { fetchAuth } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { AlertTriangle, CheckCircle, XCircle, Eye, User, MapPin, MessageSquare, X, ShieldAlert } from "lucide-react";

type Report = {
  id: string;
  reporter_username: string;
  reported_username?: string;
  trip_title?: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  targetContent?: any;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await fetchAuth("/api/admin/reports");
      setReports(data.reports);
    } catch (err) {
      console.error(err);
      addToast("โหลดข้อมูลรายงานไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    try {
      const report = await fetchAuth(`/api/admin/reports/${id}`);
      setSelectedReport(report);
      setIsModalOpen(true);
    } catch (err) {
      addToast("โหลดรายละเอียดรายงานไม่สำเร็จ", "error");
    }
  }

  async function updateStatus(id: string, status: string) {
    const statusLabel = status === "resolved" ? "จัดการแล้ว" : "เพิกเฉย";
    if (!window.confirm(`ทำเครื่องหมายรายงานนี้ว่า ${statusLabel}?`)) return;

    try {
      await fetchAuth(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      addToast(`เปลี่ยนสถานะรายงานเป็น ${statusLabel} แล้ว`, "success");
      setIsModalOpen(false);
      loadReports();
    } catch (err) {
      addToast("อัปเดตสถานะไม่สำเร็จ", "error");
    }
  }

  return (
    <div className="space-y-6 font-main">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#25343F]">ศูนย์จัดการรายงาน</h1>
        <div className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
          รายงาน
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#BFC9D1]/30">
          <div className="w-12 h-12 border-4 border-[#FF9B51] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#25343F]/50 font-medium italic">กำลังตรวจสอบรายงาน...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#BFC9D1]/30 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#BFC9D1]/30">
                <th className="p-5 font-bold text-sm text-[#25343F] uppercase tracking-wider">ผู้รายงาน</th>
                <th className="p-5 font-bold text-sm text-[#25343F] uppercase tracking-wider">เป้าหมาย</th>
                <th className="p-5 font-bold text-sm text-[#25343F] uppercase tracking-wider">เหตุผล</th>
                <th className="p-5 font-bold text-sm text-[#25343F] uppercase tracking-wider">สถานะ</th>
                <th className="p-5 font-bold text-sm text-[#25343F] uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-[#BFC9D1]/10 hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="p-5 text-sm font-semibold text-[#25343F]">{report.reporter_username || "ระบบอัตโนมัติ"}</td>
                  <td className="p-5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase">
                        {report.target_type === 'USER' ? 'ผู้ใช้' : report.target_type === 'TRIP' ? 'ทริป' : report.target_type === 'MESSAGE' ? 'ข้อความ' : report.target_type}
                      </span>
                      <span className="text-[#25343F]/80 font-medium">
                        {report.reported_username || report.trip_title || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-sm">
                    <span className="font-medium text-[#25343F]/70">{report.reason}</span>
                  </td>
                  <td className="p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight ${
                        report.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : report.status === "resolved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {report.status === 'pending' ? 'รอดำเนินการ' : report.status === 'resolved' ? 'จัดการแล้ว' : report.status === 'ignored' ? 'เพิกเฉย' : report.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-end gap-2">
                       <button
                         onClick={() => openDetail(report.id)}
                         className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                         title="ดูรายละเอียด"
                       >
                         <Eye size={20} />
                       </button>
                       {report.status === "pending" && (
                         <>
                            <button
                              onClick={() => updateStatus(report.id, "resolved")}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="ทำเครื่องหมายว่าจัดการแล้ว"
                            >
                             <CheckCircle size={20} />
                           </button>
                            <button
                              onClick={() => updateStatus(report.id, "ignored")}
                              className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                              title="เพิกเฉย"
                            >
                             <XCircle size={20} />
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
             <div className="p-16 text-center">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert size={32} />
                 </div>
                 <p className="text-[#25343F]/40 font-medium">ไม่มีรายงานที่ค้างอยู่ เยี่ยมมาก!</p>
              </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#25343F]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase">
                      รายงาน #{selectedReport.id.slice(0, 8)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedReport.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {selectedReport.status === 'pending' ? 'รอดำเนินการ' : selectedReport.status === 'resolved' ? 'จัดการแล้ว' : selectedReport.status === 'ignored' ? 'เพิกเฉย' : selectedReport.status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-[#25343F]">{selectedReport.reason}</h2>
                  <p className="text-sm text-[#25343F]/50">รายงานโดย <strong>{selectedReport.reporter_username}</strong> เมื่อ {new Date(selectedReport.created_at).toLocaleDateString('th-TH')}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-[#EAEFEF] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#BFC9D1]/20">
                  <h4 className="text-[10px] font-bold text-[#25343F]/40 uppercase tracking-widest mb-2">รายละเอียดเพิ่มเติม</h4>
                  <p className="text-[#25343F] leading-relaxed break-words">{selectedReport.description || "ไม่มีข้อมูลเพิ่มเติมระบุไว้"}</p>
                </div>

                {/* Target Content */}
                <div>
                   <h4 className="text-[10px] font-bold text-[#25343F]/40 uppercase tracking-widest mb-3 ml-1">เนื้อหาของ {selectedReport.target_type === 'USER' ? 'ผู้ใช้' : selectedReport.target_type === 'TRIP' ? 'ทริป' : selectedReport.target_type === 'MESSAGE' ? 'ข้อความ' : selectedReport.target_type} ที่ถูกรายงาน</h4>
                   <div className="p-5 rounded-2xl border-2 border-[#EAEFEF] bg-white">
                      {selectedReport.target_type === 'USER' && selectedReport.targetContent && (
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-[#EAEFEF] rounded-full overflow-hidden flex-shrink-0">
                              <img src={selectedReport.targetContent.avatar_url || `https://ui-avatars.com/api/?name=${selectedReport.targetContent.username}`} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <div className="font-bold text-[#25343F] text-lg">{selectedReport.targetContent.username}</div>
                              <div className="text-sm text-[#25343F]/50">{selectedReport.targetContent.email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                   selectedReport.targetContent.status === 'banned' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                 }`}>
                                   สถานะ: {selectedReport.targetContent.status === 'active' ? 'ปกติ' : selectedReport.targetContent.status === 'suspended' ? 'ถูกระงับ' : selectedReport.targetContent.status === 'banned' ? 'ถูกแบน' : 'ปกติ'}
                                 </span>
                              </div>
                           </div>
                        </div>
                      )}

                      {selectedReport.target_type === 'TRIP' && selectedReport.targetContent && (
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <MapPin size={16} className="text-[#FF9B51]" />
                              <span className="font-bold text-[#25343F] text-lg">{selectedReport.targetContent.title}</span>
                           </div>
                           <p className="text-sm text-[#25343F]/70 line-clamp-3">{selectedReport.targetContent.description}</p>
                           <div className="mt-3 flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#EAEFEF] rounded uppercase">สถานะทริป: {selectedReport.targetContent.status === 'open' ? 'เปิดรับ' : selectedReport.targetContent.status === 'full' ? 'เต็มแล้ว' : selectedReport.targetContent.status === 'in_progress' ? 'กำลังเดินทาง' : selectedReport.targetContent.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}</span>
                           </div>
                        </div>
                      )}

                      {selectedReport.target_type === 'MESSAGE' && selectedReport.targetContent && (
                        <div className="flex gap-3">
                           <MessageSquare size={20} className="text-[#BFC9D1] flex-shrink-0 mt-1" />
                           <div>
                              <div className="text-[10px] font-bold text-[#BFC9D1] uppercase mb-1">ส่งโดย {selectedReport.targetContent.username}</div>
                              <div className="p-3 bg-[#EAEFEF] rounded-xl text-sm italic text-[#25343F]">
                                 "{selectedReport.targetContent.content}"
                              </div>
                           </div>
                        </div>
                      )}

                      {!selectedReport.targetContent && (
                        <div className="text-[#BFC9D1] text-sm italic flex items-center gap-2">
                           <AlertTriangle size={16} /> เนื้อหาที่ถูกรายงานถูกลบไปแล้วหรือไม่มีข้อมูล
                        </div>
                      )}
                   </div>
                </div>

                {/* Actions */}
                {selectedReport.status === 'pending' && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => updateStatus(selectedReport.id, "resolved")}
                      className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} /> ทำเครื่องหมายว่าจัดการแล้ว
                    </button>
                    <button
                      onClick={() => updateStatus(selectedReport.id, "ignored")}
                      className="flex-1 py-4 bg-[#EAEFEF] hover:bg-[#BFC9D1]/30 text-[#25343F]/60 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={20} /> เพิกเฉยต่อรายงานนี้
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

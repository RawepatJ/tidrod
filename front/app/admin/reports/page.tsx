"use client";

import { useEffect, useState } from "react";
import { fetchAuth } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type Report = {
  id: string;
  reporter_username: string;
  reported_username: string;
  trip_title: string;
  reason: string;
  status: string;
  created_at: string;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
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
      addToast("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    if (!window.confirm(`Mark this report as ${status}?`)) return;

    try {
      await fetchAuth(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      addToast(`Report marked as ${status}`, "success");
      loadReports();
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#25343F]">Reports Management</h1>
      </div>

      {loading ? (
        <p className="text-[#BFC9D1]">Loading reports...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#BFC9D1]/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#BFC9D1]/30">
                <th className="p-4 font-semibold text-sm text-[#25343F]">Reporter</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Target</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Reason</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Status</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-[#BFC9D1]/10 hover:bg-[#F8FAFC]/50">
                  <td className="p-4 text-sm font-medium text-[#25343F]">{report.reporter_username || "Unknown"}</td>
                  <td className="p-4 text-sm text-[#25343F]/70">
                    {report.reported_username && <div>User: {report.reported_username}</div>}
                    {report.trip_title && <div className="truncate max-w-[150px]">Trip: {report.trip_title}</div>}
                    {!report.reported_username && !report.trip_title && "N/A"}
                  </td>
                  <td className="p-4 text-sm text-[#25343F]/80 max-w-xs break-words whitespace-pre-wrap">{report.reason}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        report.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : report.status === "resolved"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {report.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(report.id, "resolved")}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Mark Resolved"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => updateStatus(report.id, "ignored")}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title="Ignore"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
             <div className="p-8 text-center text-[#BFC9D1]">No reports. Everything looks good!</div>
          )}
        </div>
      )}
    </div>
  );
}

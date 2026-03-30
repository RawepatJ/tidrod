"use client";

import { useEffect, useState } from "react";
import { fetchAuth } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

type Trip = { id: string; title: string; user_id: string; username: string; created_at: string };

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const data = await fetchAuth("/api/admin/trips");
      setTrips(data.trips);
    } catch (err) {
      console.error(err);
      addToast("Failed to load trips", "error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTrip(id: string) {
    if (!window.confirm("WARNING: This will permanently delete the trip and all associated photos and messages. Continue?")) return;

    try {
      await fetchAuth(`/api/admin/trips/${id}`, { method: "DELETE" });
      addToast("Trip deleted successfully", "success");
      loadTrips();
    } catch (err) {
      addToast("Failed to delete trip", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#25343F]">Trips Management</h1>
        <span className="bg-[#10B981]/10 text-[#10B981] px-4 py-1.5 rounded-full text-sm font-medium">
          {trips.length} Trips
        </span>
      </div>

      {loading ? (
        <p className="text-[#BFC9D1]">Loading trips...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#BFC9D1]/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#BFC9D1]/30">
                <th className="p-4 font-semibold text-sm text-[#25343F]">Title</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Owner</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Created</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-[#BFC9D1]/10 hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="p-4 font-medium text-[#25343F] max-w-[250px] truncate">{trip.title}</td>
                  <td className="p-4 text-sm text-[#25343F]/70">{trip.username}</td>
                  <td className="p-4 text-sm text-[#25343F]/70">
                    {new Date(trip.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 flex gap-2">
                    <Link
                      href={`/trip/${trip.id}`}
                      target="_blank"
                      className="p-2 text-[#25343F]/50 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Trip"
                    >
                      <ExternalLink size={18} />
                    </Link>
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      className="p-2 text-[#25343F]/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Trip"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trips.length === 0 && (
             <div className="p-8 text-center text-[#BFC9D1]">No trips found.</div>
          )}
        </div>
      )}
    </div>
  );
}

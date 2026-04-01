'use client';

import { useEffect, useState } from 'react';
import { fetchAuth, getToken } from '@/lib/api';
import { MapPin, Calendar, Users, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { useSession } from './SessionProvider';

interface Trip {
  id: string;
  title: string;
  host_name: string;
  status: string;
  created_at: string;
  latitude: number;
  longitude: number;
}

interface MyTripsProps {
  onTripSelect?: (tripId: string, lat: number, lon: number) => void;
}

export default function MyTrips({ onTripSelect }: MyTripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isLoading: sessionLoading } = useSession();
  const { addToast } = useToast();

  useEffect(() => {
    async function loadMyTrips() {
      if (!user) return;
      const token = getToken();
      if (!token) return;

      setLoading(true);
      try {
        const data = await fetchAuth('/api/trips/me');
        setTrips(data.trips || []);
      } catch (err: any) {
        if (err.message !== "Authentication required") {
          console.error('Failed to load my trips:', err);
        }
      } finally {
        setLoading(false);
      }
    }

    if (!sessionLoading) {
      loadMyTrips();
    }
  }, [user, sessionLoading]);

  if (sessionLoading) return null;
  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF9B51]" />
      </div>
    );
  }

  if (trips.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#BFC9D1]/30">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-bold text-[#25343F] text-sm flex items-center gap-2">
          <MapPin size={16} className="text-[#FF9B51]" /> My Active Trips
        </h3>
        <span className="text-[10px] font-black text-[#FF9B51] bg-[#FF9B51]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
          {trips.filter(trip => trip.status === 'active').length}
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {trips
          .filter((t) => !['completed', 'cancelled'].includes(t.status))
          .map((trip) => (
            <button
              key={trip.id}
              onClick={() => onTripSelect?.(trip.id, trip.latitude, trip.longitude)}
              className="w-full group text-left p-3 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#BFC9D1]/30 transition-all flex items-center justify-between bg-[#EAEFEF]/30"
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[#25343F] text-sm truncate group-hover:text-[#FF9B51] transition-colors">
                  {trip.title}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] text-[#25343F]/50 flex items-center gap-1 font-medium">
                    <Calendar size={10} /> {new Date(trip.created_at).toLocaleDateString()}
                  </p>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${trip.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      trip.status === 'full' ? 'bg-amber-100 text-amber-600' : 'bg-[#FF9B51]/10 text-[#FF9B51]'
                    }`}>
                    {trip.status}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#BFC9D1] group-hover:text-[#FF9B51] group-hover:translate-x-0.5 transition-all ml-2 flex-shrink-0" />
            </button>
          ))}
      </div>
    </div>
  );
}

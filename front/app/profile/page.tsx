'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { getToken } from '@/lib/api';
import { SkeletonProfile } from '@/components/Skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface UserTrip {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  photos: { id: string; image_url: string }[] | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: sessionUser, isLoading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trips, setTrips] = useState<UserTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    if (!sessionUser) {
      router.push('/login');
      return;
    }

    async function loadProfile() {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile(data.user);
        setTrips(data.trips || []);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [sessionUser, sessionLoading, router]);

  if (sessionLoading || loading) {
    return (
      <main className="flex-1 bg-[#EAEFEF] overflow-y-auto">
        <SkeletonProfile />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 bg-[#EAEFEF] flex items-center justify-center pt-22">
        <div className="text-center">
          <span className="text-5xl block mb-4">👤</span>
          <h2 className="text-xl font-bold text-[#25343F] mb-2">Profile Not Found</h2>
          <Link href="/login" className="text-[#FF9B51] font-medium hover:underline">
            Sign in to view your profile
          </Link>
        </div>
      </main>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="flex-1 bg-[#EAEFEF] overflow-y-auto pt-22">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#BFC9D1]/20 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#e8893f] text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-[#FF9B51]/20">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#25343F]">{profile.username}</h1>
              <p className="text-[#25343F]/50 text-sm">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-[#25343F]/40">
                <span>📅 Joined {joinDate}</span>
                <span>📍 {trips.length} trip{trips.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Trips */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20">
          <h2 className="text-lg font-bold text-[#25343F] mb-4">My Trips</h2>
          {trips.length === 0 ? (
            <div className="text-center py-12 text-[#BFC9D1]">
              <span className="text-4xl block mb-3">🗺️</span>
              <p className="font-medium">No trips yet</p>
              <p className="text-sm mt-1">Create your first trip on the map!</p>
              <Link
                href="/home"
                className="inline-flex items-center mt-4 px-6 py-2.5 bg-[#FF9B51] text-white rounded-xl text-sm font-semibold hover:bg-[#e8893f] transition-all shadow-md"
              >
                Go to Map →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trips.map((trip) => {
                const photo = trip.photos?.find(Boolean);
                return (
                  <Link
                    key={trip.id}
                    href={`/trip/${trip.id}`}
                    className="group bg-[#EAEFEF]/50 rounded-xl overflow-hidden border border-[#BFC9D1]/20 hover:shadow-md transition-all hover:border-[#FF9B51]/30"
                  >
                    {photo ? (
                      <div className="h-36 overflow-hidden">
                        <img
                          src={photo.image_url}
                          alt={trip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-[#FF9B51]/10 to-[#BFC9D1]/10 flex items-center justify-center text-4xl">
                        🗺️
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-[#25343F] group-hover:text-[#FF9B51] transition-colors truncate">
                        {trip.title}
                      </h3>
                      <p className="text-xs text-[#25343F]/40 mt-1">
                        {new Date(trip.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { getToken, getUserRating } from '@/lib/api';
import { SkeletonProfile } from '@/components/Skeleton';
import ProfileEditModal from '@/components/ProfileEditModal';
import RatingStars from '@/components/RatingStars';
import { StatCard } from '@/components/StatCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userRating, setUserRating] = useState<{ average_rating: number; total_ratings: number } | null>(null);

  useEffect(() => {
    if (sessionLoading) return;

    if (!sessionUser) {
      router.push('/login');
      return;
    }

    loadProfile();
  }, [sessionUser, sessionLoading, router]);

  const loadProfile = async () => {
    try {
      setError(null);
      const token = getToken();
      
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        router.push('/login');
        return;
      }

      console.log('Fetching profile from:', `${API_URL}/api/users/me`);
      
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`API Error ${res.status}: ${errorData || res.statusText}`);
      }

      const data = await res.json();
      console.log('Profile loaded successfully:', data);
      setProfile(data.user);
      setTrips(data.trips || []);

      // Load user rating
      try {
        const ratingData = await getUserRating(data.user.id);
        setUserRating(ratingData);
      } catch (ratingErr) {
        console.error('Failed to load user rating:', ratingErr);
      }

      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('Failed to load profile:', err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (sessionLoading || loading) {
    return (
      <main className="flex-1 bg-[#EAEFEF] overflow-y-auto">
        <SkeletonProfile />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 bg-gradient-to-b from-[#EAEFEF] to-[#E0E8EA] overflow-y-auto pt-22">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-10 text-center shadow-lg">
            <span className="text-6xl block mb-6">⚠️</span>
            <h2 className="text-2xl font-bold text-red-900 mb-3">Failed to Load Profile</h2>
            <p className="text-red-700 mb-5 text-lg">{error}</p>
            <p className="text-base text-red-600 mb-8">
              Make sure the backend server is running on port 5000
            </p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                loadProfile();
              }}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 bg-gradient-to-b from-[#EAEFEF] to-[#E0E8EA] flex items-center justify-center pt-22">
        <div className="text-center px-6">
          <span className="text-7xl block mb-6">👤</span>
          <h2 className="text-2xl font-bold text-[#25343F] mb-3">Profile Not Found</h2>
          <Link href="/login" className="text-[#FF9B51] text-lg font-semibold hover:underline transition-all">
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

  const memberDays = Math.floor(
    (new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const token = getToken();

  return (
    <main className="flex-1 bg-gradient-to-b from-[#EAEFEF] via-[#EFF3F5] to-[#E0E8EA] overflow-y-auto pt-22">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Cover Section */}
        <div className="bg-gradient-to-r from-[#FF9B51] via-[#e8893f] to-[#8B7BB8] rounded-3xl h-40 mb-12 border border-[#FF9B51]/30 shadow-xl shadow-[#FF9B51]/15 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2220%22 cy=%2220%22 r=%2215%22 fill=%22white%22/><circle cx=%2275%22 cy=%2280%22 r=%2220%22 fill=%22white%22/></svg>')] bg-repeat"></div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-[#BFC9D1]/10 mb-10 -mt-20 relative backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF9B51] to-[#e8893f] rounded-3xl blur-2xl opacity-30"></div>
              <div className="relative w-40 h-40 rounded-3xl bg-gradient-to-br from-[#FF9B51] to-[#e8893f] text-white flex items-center justify-center text-7xl font-bold shadow-2xl shadow-[#FF9B51]/30 flex-shrink-0 overflow-hidden border-4 border-white ring-2 ring-[#FF9B51]/20">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="min-w-0">
                  <h1 className="text-5xl font-bold text-[#25343F] mb-2">{profile.username}</h1>
                  <p className="text-[#25343F]/60 text-lg mb-4">{profile.email}</p>
                  {profile.bio && (
                    <p className="text-[#25343F]/70 mt-4 text-base leading-relaxed break-words max-w-2xl">
                      {profile.bio}
                    </p>
                  )}
                  {userRating && userRating.total_ratings > 0 && (
                    <div className="mt-5">
                      <RatingStars
                        rating={userRating.average_rating}
                        count={userRating.total_ratings}
                        size="md"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-[#FF9B51] to-[#e8893f] hover:from-[#e8893f] hover:to-[#d67a32] text-white rounded-2xl text-base font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-[#FF9B51]/30 flex-shrink-0 w-full sm:w-auto active:scale-95 hover:-translate-y-1"
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-10">
          <StatCard
            icon="✈️"
            value={trips.length}
            label={`Trip${trips.length !== 1 ? 's' : ''}`}
            accentColor="from-[#FF9B51] to-[#e8893f]"
          />
          <StatCard
            icon="📅"
            value={new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            label={new Date(profile.created_at).getFullYear().toString()}
            accentColor="from-[#5DADE2] to-[#3498DB]"
          />
          <StatCard
            icon="🌍"
            value={new Set(trips.map((t) => `${t.latitude},${t.longitude}`)).size}
            label="Locations"
            accentColor="from-[#48C9B0] to-[#16A085]"
          />
        </div>

        {/* My Trips Section */}
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-[#BFC9D1]/10 mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#25343F]">My Trips</h2>
              <p className="text-[#25343F]/50 text-sm mt-2">Explore your travel memories</p>
            </div>
            {trips.length > 0 && (
              <span className="text-lg font-bold text-[#FF9B51] bg-gradient-to-br from-[#FF9B51]/10 to-[#FF9B51]/5 px-6 py-3 rounded-full border border-[#FF9B51]/20">
                {trips.length}
              </span>
            )}
          </div>

          {trips.length === 0 ? (
            <div className="text-center py-20 text-[#BFC9D1]">
              <span className="text-7xl block mb-6">🗺️</span>
              <p className="font-bold text-2xl text-[#25343F]">No trips yet</p>
              <p className="text-base mt-3 text-[#25343F]/60">Create your first trip on the map!</p>
              <Link
                href="/home"
                className="inline-flex items-center mt-8 px-8 py-4 bg-gradient-to-r from-[#FF9B51] to-[#e8893f] hover:from-[#e8893f] hover:to-[#d67a32] text-white rounded-2xl text-base font-bold hover:shadow-lg transition-all active:scale-95 hover:-translate-y-1"
              >
                Explore Map →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => {
                const photo = trip.photos?.find(Boolean);
                const tripDate = new Date(trip.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <Link
                    key={trip.id}
                    href={`/trip/${trip.id}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#BFC9D1]/20 hover:border-[#FF9B51]/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-[#FF9B51]/15 to-[#8B7BB8]/15 overflow-hidden">
                      {photo ? (
                        <img
                          src={photo.image_url}
                          alt={trip.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-6xl">🗺️</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-6">
                      <p className="text-xs text-[#FF9B51] font-bold uppercase tracking-widest mb-2">{tripDate}</p>
                      <h3 className="font-bold text-[#25343F] group-hover:text-[#FF9B51] transition-colors line-clamp-2 text-lg mb-2">
                        {trip.title}
                      </h3>
                      {trip.description && (
                        <p className="text-sm text-[#25343F]/60 line-clamp-2">
                          {trip.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-gradient-to-br from-white to-[#F8FAFB] rounded-3xl p-10 shadow-xl border border-[#BFC9D1]/10">
          <h3 className="text-sm font-bold text-[#25343F]/70 uppercase tracking-widest mb-8 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <span>Account Information</span>
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-6 border-b border-[#BFC9D1]/15">
              <span className="text-[#25343F]/70 font-semibold">User ID</span>
              <span className="text-[#25343F] font-mono text-sm bg-[#EAEFEF] px-4 py-2 rounded-xl border border-[#BFC9D1]/20 cursor-default">{profile.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between items-center pb-6 border-b border-[#BFC9D1]/15">
              <span className="text-[#25343F]/70 font-semibold">Member Since</span>
              <span className="text-[#25343F]">{joinDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#25343F]/70 font-semibold">Email</span>
              <span className="text-[#25343F]">{profile.email}</span>
            </div>
          </div>
          </div>
        </div>

      {/* Edit Profile Modal */}
      {token && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={profile}
          token={token}
          onSuccess={loadProfile}
        />
      )}
    </main>
  );
}


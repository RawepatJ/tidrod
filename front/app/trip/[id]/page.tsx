'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getTrip, getToken, getUser, deleteTrip, getTripRating, getTripRatings, joinTrip, endTrip, getJoinRequests, respondJoinRequest, getTripMembers } from '@/lib/api';
import Chat from '@/components/Chat';
import { SkeletonTripDetail } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import {
  ShieldAlert, ArrowLeft, User, Calendar, Users, Trash2, MapPin, Star,
  UserPlus, CheckCircle, XCircle, Flag, Clock, Lock, Loader2
} from 'lucide-react';
import ReportModal from '@/components/ReportModal';
import RatingStars from '@/components/RatingStars';
import RateTripModal from '@/components/RateTripModal';
import TripRatingsList from '@/components/TripRatingsList';

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#1a1a2e] animate-pulse rounded-xl" />,
});

interface TripPhoto {
  id: string;
  image_url: string;
}

interface TripDetail {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  username: string;
  author_id: string;
  ladiesOnly: boolean;
  privacy: string;
  status: string;
  ended_at: string | null;
  photos: TripPhoto[] | null;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportTripId, setReportTripId] = useState<string | null>(null);
  const [tripRating, setTripRating] = useState<{ average_rating: number; total_ratings: number } | null>(null);
  const [tripRatings, setTripRatings] = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Join & Members
  const [isMember, setIsMember] = useState(false);
  const [joinStatus, setJoinStatus] = useState<string | null>(null); // 'joined', 'pending', null
  const [isJoining, setIsJoining] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isEnding, setIsEnding] = useState(false);

  const user = getUser();
  const { addToast } = useToast();

  useEffect(() => {
    async function loadTrip() {
      try {
        const data = await getTrip(params.id as string);
        setTrip(data);
        loadRatings(params.id as string);
        loadMembers(params.id as string);
        if (user && data.author_id === user.id) {
          loadJoinRequests(params.id as string);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    }
    loadTrip();
  }, [params.id]);

  const loadRatings = async (tripId: string) => {
    try {
      setLoadingRatings(true);
      const [ratingStats, ratingsList] = await Promise.all([
        getTripRating(tripId),
        getTripRatings(tripId),
      ]);
      setTripRating(ratingStats);
      setTripRatings(ratingsList.ratings || []);
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      setLoadingRatings(false);
    }
  };

  const loadMembers = async (tripId: string) => {
    try {
      const data = await getTripMembers(tripId);
      setMembers(data.members || []);
      if (user) {
        const memberCheck = (data.members || []).some((m: any) => m.user_id === user.id);
        setIsMember(memberCheck);
        if (memberCheck) setJoinStatus('joined');
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const loadJoinRequests = async (tripId: string) => {
    try {
      const data = await getJoinRequests(tripId);
      setJoinRequests((data.requests || []).filter((r: any) => r.status === 'pending'));
    } catch (err) {
      console.error('Failed to load join requests:', err);
    }
  };

  const handleJoinTrip = async () => {
    if (!user) {
      addToast('Please login to join', 'error');
      return;
    }
    if (!trip) return;
    setIsJoining(true);
    try {
      const result = await joinTrip(trip.id);
      setJoinStatus(result.status === 'joined' ? 'joined' : 'pending');
      if (result.status === 'joined') {
        setIsMember(true);
        addToast('Joined trip successfully!', 'success');
        loadMembers(trip.id);
      } else {
        addToast('Join request sent! Waiting for host approval.', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to join trip', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRespondRequest = async (requestId: string, status: 'approved' | 'denied') => {
    if (!trip) return;
    try {
      await respondJoinRequest(trip.id, requestId, status);
      addToast(`Request ${status}`, 'success');
      loadJoinRequests(trip.id);
      loadMembers(trip.id);
    } catch (err: any) {
      addToast(err.message || 'Failed to respond', 'error');
    }
  };

  const handleEndTrip = async () => {
    if (!trip) return;
    if (!window.confirm('Are you sure you want to end this trip? Members will be able to rate it.')) return;
    setIsEnding(true);
    try {
      await endTrip(trip.id);
      setTrip(prev => prev ? { ...prev, status: 'ended', ended_at: new Date().toISOString() } : prev);
      addToast('Trip ended successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to end trip', 'error');
    } finally {
      setIsEnding(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 bg-[#EAEFEF] overflow-y-auto">
        <SkeletonTripDetail />
      </main>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#EAEFEF] pt-22">
        <div className="text-center">
          <MapPin size={48} className="mx-auto mb-4 text-[#BFC9D1]" />
          <h2 className="text-xl font-bold text-[#25343F] mb-2">Trip Not Found</h2>
          <p className="text-[#25343F]/60 mb-6">{error || 'This trip does not exist.'}</p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF9B51] text-white rounded-xl font-semibold hover:bg-[#e8893f] transition-all shadow-lg"
          >
            <ArrowLeft size={16} /> Back to Map
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteTrip = async () => {
    if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    const token = getToken();
    if (!token) {
      addToast('You must be logged in to delete a trip', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTrip(trip.id, token);
      addToast('Trip deleted successfully', 'success');
      router.push('/home');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete trip', 'error');
      setIsDeleting(false);
    }
  };

  const photos = trip.photos?.filter(Boolean) || [];
  const isHost = user?.id === trip.author_id;
  const canRate = user && !isHost && trip.status === 'ended' && isMember;

  return (
    <main className="flex-1 overflow-y-auto bg-[#EAEFEF] pt-22">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-[#25343F]/70 hover:text-[#FF9B51] transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={16} /> Back to Map
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Trip Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-[#25343F]">{trip.title}</h1>
                    {trip.status === 'ended' && (
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Ended</span>
                    )}
                    {trip.privacy === 'private' && (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full flex items-center gap-1">
                        <Lock size={10} /> Private
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-[#25343F]/60 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User size={14} /> {trip.username}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {new Date(trip.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    {trip.ladiesOnly && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 bg-[#FF9B51]/10 text-[#FF9B51] px-2 py-0.5 rounded-md text-xs font-semibold">
                          <Users size={12} /> Ladies Only
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportTripId(trip.id)}
                    className="flex items-center justify-center p-2 text-red-500 border border-red-100 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    title="Report Trip"
                  >
                    <ShieldAlert size={18} />
                  </button>

                  {isHost && trip.status === 'active' && (
                    <button
                      onClick={handleEndTrip}
                      disabled={isEnding}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium border border-amber-200 disabled:opacity-50"
                    >
                      <Flag size={14} /> {isEnding ? 'Ending...' : 'End Trip'}
                    </button>
                  )}

                  {isHost && (
                    <button
                      onClick={handleDeleteTrip}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>

              {trip.description && (
                <div className="mt-4 pt-4 border-t border-[#BFC9D1]/20">
                  <h3 className="text-sm font-semibold text-[#25343F]/40 uppercase tracking-wider mb-2">Travel Story</h3>
                  <p className="text-[#25343F]/80 leading-relaxed whitespace-pre-wrap">{trip.description}</p>
                </div>
              )}
            </div>

            {/* Join Requests (Host Only) */}
            {isHost && joinRequests.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20">
                <h3 className="text-sm font-semibold text-[#25343F]/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserPlus size={16} className="text-[#FF9B51]" />
                  Pending Join Requests ({joinRequests.length})
                </h3>
                <div className="space-y-3">
                  {joinRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-[#EAEFEF]/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#FF9B51] text-white flex items-center justify-center text-sm font-bold">
                          {req.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#25343F]">{req.username}</p>
                          <p className="text-xs text-[#25343F]/50">{new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondRequest(req.id, 'approved')}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req.id, 'denied')}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          title="Deny"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            {members.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20">
                <h3 className="text-sm font-semibold text-[#25343F]/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users size={16} className="text-[#FF9B51]" />
                  Trip Members ({members.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {members.map((m) => (
                    <div key={m.user_id} className="flex items-center gap-2 px-3 py-2 bg-[#EAEFEF]/50 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-[#FF9B51] text-white flex items-center justify-center text-xs font-bold">
                        {m.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[#25343F]">{m.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20">
                <h3 className="text-sm font-semibold text-[#25343F]/40 uppercase tracking-wider mb-4">Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.image_url)}
                      className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <img
                        src={photo.image_url}
                        alt="Trip photo"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings List */}
            {tripRatings.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20">
                <h3 className="text-sm font-semibold text-[#25343F]/40 uppercase tracking-wider mb-4">
                  All Ratings ({tripRatings.length})
                </h3>
                <TripRatingsList ratings={tripRatings} />
              </div>
            )}

            {/* Map */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#BFC9D1]/20">
              <h3 className="text-sm font-semibold text-[#25343F]/40 uppercase tracking-wider px-6 pt-6 mb-4">Location</h3>
              <div className="h-[300px]">
                <MapComponent
                  markers={[{ lat: trip.latitude, lon: trip.longitude, label: trip.title, color: '#FF9B51' }]}
                  center={[trip.longitude, trip.latitude]}
                  zoom={13}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Chat + Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Join Button */}
              {!isHost && user && !isMember && joinStatus !== 'pending' && trip.status === 'active' && (
                <button
                  onClick={handleJoinTrip}
                  disabled={isJoining}
                  className="w-full py-3 px-4 bg-[#FF9B51] hover:bg-[#e8893f] text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isJoining ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {trip.privacy === 'private' ? 'Request to Join' : 'Join Trip'}
                </button>
              )}

              {joinStatus === 'pending' && (
                <div className="w-full py-3 px-4 bg-amber-50 text-amber-700 rounded-xl font-semibold text-center flex items-center justify-center gap-2 border border-amber-200">
                  <Clock size={16} /> Join request pending...
                </div>
              )}

              {isMember && !isHost && (
                <div className="w-full py-3 px-4 bg-green-50 text-green-700 rounded-xl font-semibold text-center flex items-center justify-center gap-2 border border-green-200">
                  <CheckCircle size={16} /> You are a member
                </div>
              )}

              {/* Chat */}
              {hasJoined ? (
                <Chat tripId={trip?.id || ''} onLeave={() => setHasJoined(false)} />
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#BFC9D1]/20">
                  <div className="w-16 h-16 bg-[#FF9B51]/10 text-[#FF9B51] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={28} />
                  </div>
                  <h3 className="font-bold text-[#25343F] text-lg mb-2">Trip Discussion</h3>
                  <p className="text-sm text-[#25343F]/60 mb-6 leading-relaxed">
                    Join the chat to talk with the author and other travelers about this trip.
                  </p>
                  <button
                    onClick={() => {
                      if (!user) {
                        addToast('Please login to join the chat', 'error');
                        return;
                      }
                      if (trip.ladiesOnly && user.gender !== 'female') {
                        addToast('Only women can join ladies-only trips', 'error');
                        return;
                      }
                      setHasJoined(true);
                    }}
                    className="w-full py-3 px-4 bg-[#FF9B51] hover:bg-[#e8893f] text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Join Trip Chat
                  </button>
                </div>
              )}

              {/* Rating Section */}
              {trip && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20">
                  <h3 className="text-sm font-semibold text-[#25343F]/40 uppercase tracking-wider mb-4">Trip Rating</h3>
                  
                  <div className="mb-6">
                    {tripRating && tripRating.total_ratings > 0 ? (
                      <div className="space-y-2">
                        <RatingStars
                          rating={tripRating.average_rating}
                          count={tripRating.total_ratings}
                          size="lg"
                        />
                        <p className="text-xs text-[#25343F]/50">
                          Based on {tripRating.total_ratings} rating{tripRating.total_ratings !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-[#25343F]/60">No ratings yet</p>
                    )}
                  </div>

                  {/* Rate Button — only if trip ended and user is member */}
                  {canRate && (
                    <button
                      onClick={() => setIsRateModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-[#FF9B51] hover:bg-[#e8893f] text-white rounded-lg font-semibold transition-all shadow-md text-sm flex items-center justify-center gap-2"
                    >
                      <Star size={14} /> Rate This Trip
                    </button>
                  )}

                  {user && !isHost && trip.status !== 'ended' && (
                    <p className="text-xs text-[#25343F]/50 text-center py-2">
                      Rating available after the trip ends
                    </p>
                  )}

                  {user && !isHost && trip.status === 'ended' && !isMember && (
                    <p className="text-xs text-[#25343F]/50 text-center py-2">
                      Only trip members can rate
                    </p>
                  )}

                  {isHost && (
                    <p className="text-xs text-[#25343F]/50 text-center py-2">
                      You can&apos;t rate your own trip
                    </p>
                  )}

                  {!user && (
                    <button
                      onClick={() => addToast('Please login to rate', 'error')}
                      className="w-full py-2.5 px-4 bg-[#EAEFEF] text-[#25343F] rounded-lg font-semibold transition-all text-sm opacity-50 cursor-not-allowed"
                    >
                      <Star size={14} className="inline mr-1" /> Rate This Trip
                    </button>
                  )}

                  {/* Recent Ratings */}
                  {tripRatings.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#BFC9D1]/20">
                      <p className="text-xs font-semibold text-[#25343F]/40 uppercase tracking-wider mb-3">
                        Recent Ratings
                      </p>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {tripRatings.slice(0, 5).map((rating) => (
                          <div key={rating.id} className="bg-[#EAEFEF]/50 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-medium text-xs text-[#25343F]">{rating.username}</p>
                              <RatingStars rating={rating.rating} size="sm" />
                            </div>
                            {rating.comment && (
                              <p className="text-xs text-[#25343F]/70 line-clamp-2">
                                {rating.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl font-bold"
            >
              <XCircle size={28} />
            </button>
            <img
              src={selectedPhoto}
              alt="Trip photo"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportTripId}
        onClose={() => setReportTripId(null)}
        targetType="TRIP"
        targetId={reportTripId || ''}
      />
      {/* Rating Modal */}
      {trip && (
        <RateTripModal
          isOpen={isRateModalOpen}
          onClose={() => setIsRateModalOpen(false)}
          tripId={trip.id}
          tripTitle={trip.title}
          token={getToken() || ''}
          onSuccess={() => {
            loadRatings(trip.id);
            setIsRateModalOpen(false);
            addToast('Rating submitted successfully!', 'success');
          }}
        />
      )}
    </main>
  );
}

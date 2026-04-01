'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { getMarkers, getTrip } from '@/lib/api';
import { MarkerData } from '@/components/Map';
import { useToast } from '@/components/Toast';
import { ShieldAlert, MapPin, User, Calendar, Users, X } from 'lucide-react';
import ReportModal from '@/components/ReportModal';

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#FF9B51] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#BFC9D1] text-sm">Loading Map...</p>
      </div>
    </div>
  ),
});

interface TripData {
  destination: string;
  date: string;
  timeOption: 'flexible' | 'specific';
  specificTime: string;
  lat: number | null;
  lon: number | null;
  locationName: string;
  privacy: 'open' | 'private';
  ladiesOnly: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Location being selected on the map (via center-pin)
  const [pendingLocationName, setPendingLocationName] = useState('');
  const [pendingLat, setPendingLat] = useState<number | null>(null);
  const [pendingLon, setPendingLon] = useState<number | null>(null);

  // Viewport-based marker loading
  const handleMapMove = useCallback(async (bounds: { west: number; south: number; east: number; north: number }) => {
    if (selectionMode) return;
    try {
      const serverMarkers = await getMarkers(bounds);
      setMarkers(
        serverMarkers.map((m: any) => ({
          id: m.id,
          lat: m.latitude,
          lon: m.longitude,
          label: m.title,
          color: '#FF9B51',
        }))
      );
    } catch (err) {
      // Silently fail
    }
  }, [selectionMode]);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [tripDetail, setTripDetail] = useState<any>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [reportTripId, setReportTripId] = useState<string | null>(null);

  const handleMarkerClick = useCallback(async (markerId: string) => {
    setSelectedTripId(markerId);
    setLoadingTrip(true);
    try {
      const data = await getTrip(markerId);
      setTripDetail(data);
    } catch (err) {
      addToast('Failed to load trip details', 'error');
    } finally {
      setLoadingTrip(false);
    }
  }, [addToast]);

  // Search trip select — fly to location and open popup
  const handleTripSelect = useCallback((tripId: string, lat: number, lon: number) => {
    setSearchLocation({ lat, lon });
    handleMarkerClick(tripId);
  }, [handleMarkerClick]);

  const handleLocationSelectRequest = () => {
    setSelectionMode(true);
  };

  const handleLocationSearch = (lat: number, lon: number, name: string) => {
    setPendingLocationName(name);
    setPendingLat(lat);
    setPendingLon(lon);
    setSearchLocation({ lat, lon });
  };

  const handleMapLocationSelect = useCallback((lat: number, lon: number, locationName?: string) => {
    setPendingLat(lat);
    setPendingLon(lon);
    if (locationName) {
      setPendingLocationName(locationName);
    } else {
      setPendingLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  }, []);

  const handleConfirmSelection = () => {
    setSelectionMode(false);
    if (pendingLat != null && pendingLon != null) {
      addToast('Location selected!', 'success', 2000);
    }
  };

  const handleCancelSelection = () => {
    setPendingLocationName('');
    setPendingLat(null);
    setPendingLon(null);
    setSelectionMode(false);
  };

  const handleAddTrip = (trip: TripData) => {
    setPendingLocationName('');
    setPendingLat(null);
    setPendingLon(null);
    addToast('Trip added to the map!', 'success');
  };

  return (
    <main className="flex flex-col lg:flex-row flex-1 w-full bg-[#EAEFEF] p-4 pt-0 gap-4 overflow-hidden pt-22">
      {/* Sidebar */}
      <section className="w-full lg:w-auto flex-none z-10">
        <Sidebar
          onLocationSelectRequest={handleLocationSelectRequest}
          onLocationSearch={handleLocationSearch}
          onAddTrip={handleAddTrip}
          onTripSelect={handleTripSelect}
          selectedLocationName={pendingLocationName}
          selectedLat={pendingLat}
          selectedLon={pendingLon}
          selectionMode={selectionMode}
          onConfirmSelection={handleConfirmSelection}
          onCancelSelection={handleCancelSelection}
        />
      </section>

      {/* Map */}
      <section className="flex-1 w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-[#BFC9D1]/30 relative z-0">
        <MapComponent
          markers={markers}
          selectionMode={selectionMode ? 'destination' : null}
          onLocationSelect={handleMapLocationSelect}
          onMapMove={handleMapMove}
          onMarkerClick={handleMarkerClick}
          enableClustering={true}
          searchLocation={searchLocation}
        />

        {/* Selection Mode Overlay */}
        {selectionMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#25343F]/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-full shadow-lg z-20 font-medium text-sm flex items-center gap-2">
            <MapPin size={16} /> Move the map to position the pin
          </div>
        )}


        {/* Trip Detail Popup */}
        {selectedTripId && (
          <div className="absolute top-4 bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden border border-[#BFC9D1]/30">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#BFC9D1]/20">
              <h2 className="font-bold text-[#25343F] truncate pr-4 text-lg">
                {loadingTrip ? 'Loading...' : tripDetail?.title || 'Trip Details'}
              </h2>
              <div className="flex items-center gap-1 -mr-2">
                {!loadingTrip && tripDetail && (
                  <button
                    onClick={() => setReportTripId(tripDetail.id)}
                    className="text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors flex items-center justify-center"
                    title="Report this Trip"
                  >
                    <ShieldAlert size={18} />
                  </button>
                )}
                <button
                  onClick={() => { setSelectedTripId(null); setTripDetail(null); }}
                  className="text-[#25343F]/50 hover:text-[#FF9B51] transition-colors p-2"
                  aria-label="Close trip"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingTrip ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-[#EAEFEF] rounded-lg w-full"></div>
                  <div className="h-4 bg-[#EAEFEF] rounded w-3/4"></div>
                  <div className="h-4 bg-[#EAEFEF] rounded w-1/2"></div>
                </div>
              ) : tripDetail ? (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-[#25343F]/70 flex items-center gap-2 flex-wrap">
                    <span className="bg-[#EAEFEF] px-2 py-1 rounded-md flex items-center gap-1">
                      <User size={12} /> {tripDetail.username}
                    </span>
                    <span className="bg-[#EAEFEF] px-2 py-1 rounded-md flex items-center gap-1">
                      <Calendar size={12} /> {new Date(tripDetail.created_at).toLocaleDateString()}
                    </span>
                    {tripDetail.ladiesOnly && (
                      <span className="bg-[#FF9B51]/10 text-[#FF9B51] px-2 py-1 rounded-md font-semibold flex items-center gap-1">
                        <Users size={12} /> Ladies Only
                      </span>
                    )}
                    {tripDetail.status === 'completed' && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-semibold text-xs">
                        Completed
                      </span>
                    )}
                  </div>

                  {tripDetail.photos && tripDetail.photos.length > 0 && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden relative shadow-sm border border-[#BFC9D1]/20">
                      <img
                        src={tripDetail.photos[0].image_url}
                        alt="Trip cover"
                        className="w-full h-full object-cover"
                      />
                      {tripDetail.photos.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
                          +{tripDetail.photos.length - 1} more
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-[#25343F]/80 text-sm whitespace-pre-wrap leading-relaxed">{tripDetail.description}</p>
                  </div>

                  <button
                    onClick={() => router.push(`/trip/${selectedTripId}`)}
                    className="w-full mt-6 py-3 bg-[#FF9B51]/10 border border-[#FF9B51]/30 text-[#FF9B51] font-semibold rounded-lg hover:bg-[#FF9B51] hover:text-white transition-all shadow-sm"
                  >
                    View Full Details & Chat
                  </button>
                </div>
              ) : (
                <div className="text-center text-[#25343F]/50 mt-10">Trip not found</div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportTripId}
        onClose={() => setReportTripId(null)}
        targetType="TRIP"
        targetId={reportTripId || ''}
      />
    </main>
  );
}

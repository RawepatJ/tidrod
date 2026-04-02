'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { searchTrips } from '@/lib/api';

interface SearchTripProps {
  onTripSelect?: (tripId: string, lat: number, lon: number) => void;
}

export default function SearchTrip({ onTripSelect }: SearchTripProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchTrips(query.trim());
        setResults(data.trips || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (trip: any) => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
    if (onTripSelect) {
      onTripSelect(trip.id, trip.latitude, trip.longitude);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="bg-white rounded-3xl shadow-lg border border-[#BFC9D1]/20 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3">
          <Search size={18} className="text-[#BFC9D1] flex-shrink-0" />
          <input
            type="text"
            placeholder="ค้นหาทริป..."
            className="flex-1 text-sm text-[#25343F] placeholder:text-[#BFC9D1] outline-none bg-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
          />
          {isSearching && (
            <Loader2 size={16} className="text-[#FF9B51] animate-spin flex-shrink-0" />
          )}
          {query && !isSearching && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              className="text-[#BFC9D1] hover:text-[#25343F] transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isFocused && results.length > 0 && (
        <div className="absolute z-30 w-full mt-2 bg-white rounded-xl shadow-2xl border border-[#BFC9D1]/30 max-h-64 overflow-y-auto animate-fade-in">
          {results.map((trip) => (
            <button
              key={trip.id}
              onClick={() => handleSelect(trip)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#FF9B51]/5 transition-colors text-left border-b border-[#EAEFEF] last:border-b-0"
            >
              <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-[#FF9B51]/10 flex items-center justify-center">
                <MapPin size={14} className="text-[#FF9B51]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#25343F] truncate">{trip.title}</p>
                <p className="text-xs text-[#25343F]/50 mt-0.5">
                  โดย {trip.username} · {new Date(trip.created_at).toLocaleDateString('th-TH')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isFocused && query.length >= 2 && !isSearching && results.length === 0 && (
        <div className="absolute z-30 w-full mt-2 bg-white rounded-xl shadow-2xl border border-[#BFC9D1]/30 p-6 text-center animate-fade-in">
          <Search size={24} className="mx-auto mb-2 text-[#BFC9D1]" />
          <p className="text-sm text-[#BFC9D1]">ไม่พบทริปที่ค้นหา</p>
        </div>
      )}
    </div>
  );
}

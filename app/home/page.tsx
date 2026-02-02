'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';

const MapComponent = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400 text-sm">Loading Map...</div>
});

interface MarkerData {
  lat: number;
  lon: number;
  label?: string;
  color?: string;
}

export default function HomePage() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | null>(null);
  
  // Keep track of names to pass back to form
  const [originName, setOriginName] = useState<string>('');
  const [destName, setDestName] = useState<string>('');

  const handleOriginSelect = (lat: number, lon: number, name: string) => {
    setOriginName(name); // Update form text
    setMarkers(prev => {
      const others = prev.filter(m => m.label !== "Origin");
      return [...others, { lat, lon, label: "Origin", color: "#10B981" }];
    });
    setSelectionMode(null); // Exit selection mode if active
  };

  const handleDestinationSelect = (lat: number, lon: number, name: string) => {
    setDestName(name); // Update form text
    setMarkers(prev => {
      const others = prev.filter(m => m.label !== "Destination");
      return [...others, { lat, lon, label: "Destination", color: "#EF4444" }];
    });
    setSelectionMode(null);
  };

  // Called when user confirms location on map (drag end)
  const handleMapLocationSelect = (lat: number, lon: number) => {
    const coordsStr = `Selected (${lat.toFixed(4)}, ${lon.toFixed(4)})`; // Simplistic fallback
    
    if (selectionMode === 'origin') {
      handleOriginSelect(lat, lon, coordsStr);
    } else if (selectionMode === 'destination') {
      handleDestinationSelect(lat, lon, coordsStr);
    }
  };

  return (
    <main className="flex flex-col lg:flex-row flex-1 w-full bg-gray-50 dark:bg-gray-900 p-4 pt-0 gap-4 overflow-hidden">
      {/* Sidebar Area */}
      <section className="w-full lg:w-auto flex-none z-10">
        <Sidebar 
          onOriginSelect={handleOriginSelect} 
          onDestinationSelect={handleDestinationSelect}
          onSelectionModeRequest={setSelectionMode}
          selectedOriginName={originName}
          selectedDestinationName={destName}
        />
      </section>

      {/* Map Area */}
      <section className="flex-1 w-full h-full rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 relative z-0">
        <MapComponent 
          markers={markers} 
          selectionMode={selectionMode}
          onLocationSelect={handleMapLocationSelect}
        />
        
        {/* Helper Overlay when in Selection Mode */}
        {selectionMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-20 font-medium animate-bounce">
            Drag the pin to select {selectionMode}
          </div>
        )}

        {!selectionMode && (
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-10 pointer-events-none">
            <h1 className="text-sm font-bold text-gray-800 dark:text-white">TidRod Map View</h1>
            <p className="text-xs text-gray-500">Select trip points to visualize</p>
          </div>
        )}
      </section>
    </main>
  );
}

'use client';

// Mock data for available trips
const MOCK_TRIPS = [
  { id: 1, driver: "Alice", origin: "Central Station", destination: "Tech Park", time: "08:30 AM", seats: 2 },
  { id: 2, driver: "Bob", origin: "North Suburbs", destination: "City Center", time: "09:00 AM", seats: 1 },
  { id: 3, driver: "Charlie", origin: "Airport", destination: "Main Square", time: "10:15 AM", seats: 3 },
];

import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import ReportModal from './ReportModal';

export default function LobbyBox() {
  const [reportTripId, setReportTripId] = useState<string | null>(null);
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-md border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
        <span>🚗</span> Available Pools
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3">
        {MOCK_TRIPS.map(trip => (
          <div key={trip.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700/50">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">{trip.driver}</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{trip.seats} seats</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">From:</span> {trip.origin}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">To:</span> {trip.destination}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">At:</span> {trip.time}
              </div>
            </div>
            <div className="flex gap-2 w-full mt-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm font-medium transition-colors">
                Join Request
              </button>
              <button 
                onClick={() => setReportTripId(trip.id.toString())}
                className="px-3 bg-gray-200 dark:bg-gray-600 hover:bg-red-100 hover:text-red-500 text-gray-600 dark:text-gray-300 rounded transition-colors flex items-center justify-center"
                title="Report Trip"
              >
                <ShieldAlert size={16} />
              </button>
            </div>>
          </div>
        ))}
      </div>
      <ReportModal
        isOpen={!!reportTripId}
        onClose={() => setReportTripId(null)}
        targetType="TRIP"
        targetId={reportTripId || ''}
      />
    </div>
  );
}

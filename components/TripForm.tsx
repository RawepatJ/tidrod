'use client';

import { useState } from 'react';
import AutocompleteInput, { SpecialOption } from './AutocompleteInput';

interface TripFormProps {
  onOriginSelect: (lat: number, lon: number, name: string) => void;
  onDestinationSelect: (lat: number, lon: number, name: string) => void;
  onSelectionModeRequest: (mode: 'origin' | 'destination' | null) => void;
  externalOriginName?: string;
  externalDestName?: string;
}

export default function TripForm({ 
  onOriginSelect, 
  onDestinationSelect,
  onSelectionModeRequest,
  externalOriginName,
  externalDestName
}: TripFormProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(1);
  const [originName, setOriginName] = useState('');
  const [destName, setDestName] = useState('');

  // Sync external names (e.g. from Map selection)
  if (externalOriginName !== undefined && externalOriginName !== originName) {
    setOriginName(externalOriginName);
  }
  if (externalDestName !== undefined && externalDestName !== destName) {
    setDestName(externalDestName);
  }

  const handleOriginChoice = (lat: number | null, lon: number | null, name: string, special?: SpecialOption) => {
    setOriginName(name);
    if (special === 'CURRENT_LOCATION') {
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
           (pos) => {
             const { latitude, longitude } = pos.coords;
             // Ideally reverse geocode here, but for now use generic name or coords
             const displayName = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
             setOriginName(displayName);
             onOriginSelect(latitude, longitude, displayName);
           },
           (err) => {
             console.error(err);
             alert("Could not get location. Please allow permissions.");
           }
         );
      }
    } else if (special === 'MAP_SELECT') {
      onSelectionModeRequest('origin');
    } else if (lat !== null && lon !== null) {
      onOriginSelect(lat, lon, name);
    }
  };

  const handleDestChoice = (lat: number | null, lon: number | null, name: string, special?: SpecialOption) => {
    setDestName(name);
    if (special === 'MAP_SELECT') {
      onSelectionModeRequest('destination');
    } else if (lat !== null && lon !== null) {
      onDestinationSelect(lat, lon, name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ date, time, seats });
    alert("Trip created! (Mock)");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Plan Your Trip</h2>
      <form onSubmit={handleSubmit}>
        <AutocompleteInput 
          label="Origin" 
          placeholder="Where from?" 
          value={originName}
          onSelect={handleOriginChoice} 
          enableCurrentLocation={true}
          enableMapSelect={true}
        />
        
        <AutocompleteInput 
          label="Destination" 
          placeholder="Where to?" 
          value={destName}
          onSelect={handleDestChoice} 
          enableMapSelect={true}
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
            <input 
              type="time" 
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-6">
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seats Available</label>
           <select 
             className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
             value={seats}
             onChange={(e) => setSeats(parseInt(e.target.value))}
           >
             {[1,2,3,4,5,6].map(num => (
               <option key={num} value={num}>{num} {num === 1 ? 'seat' : 'seats'}</option>
             ))}
           </select>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          Create Trip
        </button>
      </form>
    </div>
  );
}

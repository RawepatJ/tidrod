'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MarkerData {
  id?: string;
  lat: number;
  lon: number;
  label?: string;
  color?: string;
}

interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface MapProps {
  markers?: MarkerData[];
  center?: [number, number];
  zoom?: number;
  selectionMode?: 'origin' | 'destination' | null;
  onLocationSelect?: (lat: number, lon: number, locationName?: string) => void;
  onMapMove?: (bounds: MapBounds) => void;
  onMarkerClick?: (markerId: string) => void;
  enableClustering?: boolean;
  searchLocation?: { lat: number; lon: number } | null;
  autoFitBounds?: boolean;
}

// Thailand bounding box
const THAILAND_BOUNDS: [[number, number], [number, number]] = [[97, 5], [106, 21]];

export default function MapComponent({
  markers = [],
  center = [100.5018, 13.7563],
  zoom = 6,
  selectionMode = null,
  onLocationSelect,
  onMapMove,
  onMarkerClick,
  enableClustering = true,
  searchLocation,
  autoFitBounds = false,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerPinRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Keep ref in sync
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Initialize Map
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    const hasCustomCenter = center[0] !== 100.5018 || center[1] !== 13.7563;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: '/osm_liberty.json',
      center: hasCustomCenter ? center : [100.5018, 13.7563],
      zoom: hasCustomCenter ? zoom : 6,
      // maxBounds: THAILAND_BOUNDS,
    });

    map.current = mapInstance;
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true
    });
    mapInstance.addControl(geolocate, 'top-right');

    mapInstance.on('load', () => {
      setIsMapReady(true);
      mapInstance.resize();

      if (!mapInstance.getSource('trips')) {
        mapInstance.addSource('trips', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        // Cluster circles
        mapInstance.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'trips',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#FF9B51', 10, '#e8893f', 50, '#d47a30'],
            'circle-radius': ['step', ['get', 'point_count'], 22, 10, 28, 50, 34],
            'circle-stroke-width': 3,
            'circle-stroke-color': 'rgba(255,255,255,0.3)'
          }
        });

        mapInstance.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'trips',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 13
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        // Invisible unclustered point layer for syncing HTML markers
        mapInstance.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'trips',
          filter: ['!', ['has', 'point_count']],
          paint: { 'circle-radius': 0, 'circle-color': 'transparent' }
        });

        // Handle cluster click
        mapInstance.on('click', 'clusters', async (e) => {
          const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          const source = mapInstance.getSource('trips') as maplibregl.GeoJSONSource;
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const geometry = features[0].geometry as any;
            mapInstance.easeTo({
              center: geometry.coordinates,
              zoom
            });
          } catch (err) {
            // ignore
          }
        });

        mapInstance.on('mouseenter', 'clusters', () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });
        mapInstance.on('mouseleave', 'clusters', () => {
          mapInstance.getCanvas().style.cursor = '';
        });
      }

      const hasCustomCenterCheck = center[0] !== 100.5018 || center[1] !== 13.7563;
      if (!hasCustomCenterCheck) {
        geolocate.trigger();
      }

      // Fire initial bounds
      if (onMapMove) {
        const bounds = mapInstance.getBounds();
        onMapMove({
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        });
      }
    });

    // Debounced map move
    mapInstance.on('moveend', () => {
      if (onMapMove) {
        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = setTimeout(() => {
          if (!map.current) return;
          const bounds = map.current.getBounds();
          onMapMove({
            west: bounds.getWest(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            north: bounds.getNorth(),
          });
        }, 300);
      }
    });

    mapInstance.on('error', (e) => console.error("Map error:", e));

    return () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      mapInstance.remove();
      map.current = null;
      setIsMapReady(false);
    };
  }, []);

  // Manage Markers using GeoJSON clustering & HTML Marker sync
  useEffect(() => {
    if (!isMapReady || !map.current) return;
    const mInstance = map.current;

    const source = mInstance.getSource('trips') as maplibregl.GeoJSONSource;
    if (source) {
      const features = markers.map(m => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [m.lon, m.lat] },
        properties: { id: m.id, label: m.label, color: m.color || '#FF9B51' }
      }));
      source.setData({ type: 'FeatureCollection', features });
    }

    // Sync HTML markers for unclustered points
    const updateMarkers = () => {
      if (!map.current || !map.current.getLayer('unclustered-point')) return;

      const unclusteredFeatures = map.current.queryRenderedFeatures({ layers: ['unclustered-point'] });
      const currentFeatures = new Map(unclusteredFeatures.map(f => [f.properties.id, f]));

      // Remove markers that are no longer visible
      markersRef.current = markersRef.current.filter(marker => {
        const id = (marker as any)._customId;
        if (!currentFeatures.has(id)) {
          marker.remove();
          return false;
        }
        return true;
      });

      // Add new markers
      const existingIds = new Set(markersRef.current.map(m => (m as any)._customId));

      unclusteredFeatures.forEach(feature => {
        if (feature.geometry.type !== 'Point') return;
        const id = feature.properties.id;
        if (existingIds.has(id)) return;

        const coords = feature.geometry.coordinates as [number, number];
        const el = document.createElement('div');
        el.className = 'custom-map-marker';
        const label = feature.properties.label || 'Trip';
        el.style.cssText = `cursor: pointer;`;

        // Custom SVG pin with label
        el.innerHTML = `
          <div style="
            display: flex; flex-direction: column; align-items: center;
            transform-origin: center bottom;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          " class="marker-inner">
            <div style="
              display: flex; align-items: center; gap: 5px;
              background: linear-gradient(135deg, #FF9B51, #e8893f);
              padding: 5px 10px 5px 7px;
              border-radius: 12px; font-weight: 600; font-size: 12px;
              color: white; white-space: nowrap;
              box-shadow: 0 4px 16px rgba(255,155,81,0.4);
              border: 2px solid rgba(255,255,255,0.3);
              max-width: 160px;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span style="overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${label}</span>
            </div>
            <div style="
              width: 2px; height: 8px;
              background: linear-gradient(to bottom, #FF9B51, transparent);
            "></div>
            <div style="
              width: 6px; height: 3px;
              background: rgba(255,155,81,0.4);
              border-radius: 50%;
            "></div>
          </div>
        `;

        const inner = el.querySelector('.marker-inner') as HTMLElement;
        el.onmouseenter = () => { inner.style.transform = 'scale(1.08) translateY(-3px)'; };
        el.onmouseleave = () => { inner.style.transform = 'scale(1) translateY(0)'; };

        if (id && onMarkerClick) {
          el.onclick = (e) => {
            e.stopPropagation();
            onMarkerClick(id);
          };
        }

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(coords)
          .addTo(map.current!);

        (marker as any)._customId = id;
        markersRef.current.push(marker);
      });
    };

    mInstance.on('render', updateMarkers);

    if (autoFitBounds && markers.length > 1 && !selectionMode) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach(m => bounds.extend([m.lon, m.lat]));
      try {
        mInstance.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      } catch (e) { console.error("Error fitting bounds:", e); }
    }

    return () => {
      mInstance.off('render', updateMarkers);
    };
  }, [markers, isMapReady, selectionMode, onMarkerClick]);

  // Center Pin for selection mode — fixed at screen center, map moves underneath
  useEffect(() => {
    if (!isMapReady || !map.current || !mapContainer.current) return;

    // Clean up existing
    if (centerPinRef.current) {
      centerPinRef.current.remove();
      centerPinRef.current = null;
    }
    if (shadowRef.current) {
      shadowRef.current.remove();
      shadowRef.current = null;
    }

    const canvas = mapContainer.current.querySelector('.maplibregl-canvas') as HTMLElement;

    if (selectionMode) {
      if (canvas) {
        canvas.style.cursor = 'grab';
        canvas.addEventListener('mousedown', () => { canvas.style.cursor = 'grabbing'; });
        canvas.addEventListener('mouseup', () => { canvas.style.cursor = 'grab'; });
      }

      const pin = document.createElement('div');
      pin.style.cssText = `
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -100%);
        z-index: 10; pointer-events: none;
        transition: transform 0.15s ease-out;
        filter: drop-shadow(0 4px 8px rgba(255,155,81,0.5));
      `;
      pin.innerHTML = `
        <svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pinGrad" x1="0" y1="0" x2="44" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FF9B51"/>
              <stop offset="100%" stop-color="#e8893f"/>
            </linearGradient>
          </defs>
          <path d="M22 0C9.85 0 0 9.85 0 22c0 16.354 19.983 33.39 20.836 34.118a1.71 1.71 0 002.328 0C23.017 55.39 44 38.354 44 22 44 9.85 34.15 0 22 0z" fill="url(#pinGrad)"/>
          <circle cx="22" cy="22" r="9" fill="white" opacity="0.9"/>
          <circle cx="22" cy="22" r="4" fill="#FF9B51"/>
        </svg>
      `;

      const shadow = document.createElement('div');
      shadow.style.cssText = `
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, 2px);
        width: 14px; height: 6px; border-radius: 50%;
        background: rgba(255,155,81,0.3); z-index: 9;
        pointer-events: none;
        transition: all 0.15s ease-out;
      `;

      mapContainer.current.appendChild(shadow);
      mapContainer.current.appendChild(pin);
      centerPinRef.current = pin;
      shadowRef.current = shadow;

      let geocodeTimeout: ReturnType<typeof setTimeout>;

      const onMoveStart = () => {
        pin.style.transform = 'translate(-50%, -115%)';
        shadow.style.transform = 'translate(-50%, 4px)';
        shadow.style.opacity = '0.15';
        shadow.style.width = '18px';
        clearTimeout(geocodeTimeout);
      };

      const onMoveEnd = () => {
        pin.style.transform = 'translate(-50%, -100%)';
        shadow.style.transform = 'translate(-50%, 2px)';
        shadow.style.opacity = '1';
        shadow.style.width = '14px';

        if (onLocationSelectRef.current && map.current) {
          const c = map.current.getCenter();
          onLocationSelectRef.current(c.lat, c.lng);

          clearTimeout(geocodeTimeout);
          geocodeTimeout = setTimeout(async () => {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}`);
              if (!res.ok) return;
              const data = await res.json();
              if (data && data.display_name && onLocationSelectRef.current) {
                onLocationSelectRef.current(c.lat, c.lng, data.display_name);
              }
            } catch (err) {
              console.error("Reverse geocode failed:", err);
            }
          }, 600);
        }
      };

      map.current.on('movestart', onMoveStart);
      map.current.on('moveend', onMoveEnd);

      if (onLocationSelectRef.current && map.current) {
        const c = map.current.getCenter();
        onLocationSelectRef.current(c.lat, c.lng);
      }

      return () => {
        clearTimeout(geocodeTimeout);
        if (map.current) {
          map.current.off('movestart', onMoveStart);
          map.current.off('moveend', onMoveEnd);
        }
        if (canvas) canvas.style.cursor = '';
        pin.remove();
        shadow.remove();
        centerPinRef.current = null;
        shadowRef.current = null;
      };
    } else {
      if (canvas) canvas.style.cursor = '';
    }
  }, [selectionMode, isMapReady]);

  // Fly to search location
  useEffect(() => {
    if (!isMapReady || !map.current || !searchLocation) return;
    map.current.flyTo({ center: [searchLocation.lon, searchLocation.lat], zoom: 14 });
  }, [searchLocation, isMapReady]);

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg overflow-hidden shadow-lg bg-[#1a1a2e]"
      />
    </div>
  );
}

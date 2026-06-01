import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Loader2 } from 'lucide-react';

const TASHKENT_CENTER: [number, number] = [41.3275, 69.2817];

const pinIcon = L.divIcon({
    className: 'map-pin-marker',
    html: `
        <div style="position: relative; transform: translate(-50%, -100%);">
            <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="pin-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
                    </filter>
                </defs>
                <path filter="url(#pin-shadow)" d="M18 0C8.058 0 0 8.058 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.058 27.942 0 18 0z" fill="hsl(142 76% 36%)"/>
                <circle cx="18" cy="18" r="6" fill="white"/>
            </svg>
        </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
});

interface Props {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
    height?: number;
}

const MapPicker = ({ lat, lng, onChange, height = 280 }: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const initialCenter: [number, number] =
            Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
                ? [lat, lng]
                : TASHKENT_CENTER;

        const map = L.map(containerRef.current, {
            center: initialCenter,
            zoom: 14,
            zoomControl: true,
            scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        const marker = L.marker(initialCenter, {
            icon: pinIcon,
            draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
            const p = marker.getLatLng();
            onChange(p.lat, p.lng);
        });

        map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            onChange(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        // Refresh size after mount (some flexbox cases)
        setTimeout(() => map.invalidateSize(), 100);

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync prop changes (e.g. external lat/lng updates) to marker
    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const current = markerRef.current.getLatLng();
        if (Math.abs(current.lat - lat) > 1e-6 || Math.abs(current.lng - lng) > 1e-6) {
            markerRef.current.setLatLng([lat, lng]);
            mapRef.current.panTo([lat, lng], { animate: true });
        }
    }, [lat, lng]);

    const useMyLocation = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                onChange(latitude, longitude);
                if (mapRef.current && markerRef.current) {
                    markerRef.current.setLatLng([latitude, longitude]);
                    mapRef.current.flyTo([latitude, longitude], 16, { duration: 0.8 });
                }
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary/40">
            <div
                ref={containerRef}
                style={{ height: `${height}px`, width: '100%' }}
                className="z-0"
            />

            {/* Floating coord chip */}
            <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 px-3 py-2 rounded-full bg-background/95 backdrop-blur-md shadow-md border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[11px] font-bold tabular-nums">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
            </div>

            {/* Locate me */}
            <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="absolute top-3 right-3 z-[400] w-10 h-10 rounded-full bg-background shadow-md border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
                aria-label="Use my location"
            >
                {locating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                ) : (
                    <Crosshair className="w-4 h-4 text-foreground" />
                )}
            </button>
        </div>
    );
};

export default MapPicker;

import React, { useEffect, useRef } from 'react';

interface GoogleMapProps {
    lat: number;
    lng: number;
    address: string;
    city: string;
    zoom?: number;
    className?: string;
}

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

const GoogleMap: React.FC<GoogleMapProps> = ({
    lat,
    lng,
    address,
    city,
    zoom = 15,
    className = ''
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        const initializeMap = () => {
            if (!window.google || !mapRef.current) return;

            const mapOptions = {
                center: { lat, lng },
                zoom,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                styles: [
                    {
                        "featureType": "all",
                        "elementType": "geometry.fill",
                        "stylers": [{ "weight": "2.00" }]
                    },
                    {
                        "featureType": "all",
                        "elementType": "geometry.stroke",
                        "stylers": [{ "color": "#9c9c9c" }]
                    },
                    {
                        "featureType": "all",
                        "elementType": "labels.text",
                        "stylers": [{ "visibility": "on" }]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "all",
                        "stylers": [{ "color": "#f2f2f2" }]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "geometry.fill",
                        "stylers": [{ "color": "#ffffff" }]
                    },
                    {
                        "featureType": "landscape.man_made",
                        "elementType": "geometry.fill",
                        "stylers": [{ "color": "#ffffff" }]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "all",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "all",
                        "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry.fill",
                        "stylers": [{ "color": "#eeeeee" }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#7b7b7b" }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels.text.stroke",
                        "stylers": [{ "color": "#ffffff" }]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "all",
                        "stylers": [{ "visibility": "simplified" }]
                    },
                    {
                        "featureType": "road.arterial",
                        "elementType": "labels.icon",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "transit",
                        "elementType": "all",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "all",
                        "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry.fill",
                        "stylers": [{ "color": "#c8d7d4" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#070707" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.stroke",
                        "stylers": [{ "color": "#ffffff" }]
                    }
                ],
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true
            };

            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

            // Add marker
            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstanceRef.current,
                title: `${address}, ${city}`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 40)
                }
            });

            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; max-width: 200px;">
                        <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">Property Location</h3>
                        <p style="margin: 0; font-size: 14px; color: #666;">${address}</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">${city}</p>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(mapInstanceRef.current, marker);
            });

            // Auto-open info window after a short delay
            setTimeout(() => {
                infoWindow.open(mapInstanceRef.current, marker);
            }, 1000);
        };

        const loadGoogleMaps = () => {
            if (window.google && window.google.maps) {
                initializeMap();
                return;
            }

            // Check if script is already loading
            if (document.querySelector('script[src*="maps.googleapis.com"]')) {
                const checkGoogle = setInterval(() => {
                    if (window.google && window.google.maps) {
                        clearInterval(checkGoogle);
                        initializeMap();
                    }
                }, 100);
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
            script.async = true;
            script.defer = true;

            window.initMap = initializeMap;
            script.onload = initializeMap;

            document.head.appendChild(script);
        };

        loadGoogleMaps();

        return () => {
            // Cleanup if needed
            if (mapInstanceRef.current) {
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, address, city, zoom]);

    return (
        <div
            ref={mapRef}
            className={`w-full h-full ${className}`}
            style={{ minHeight: '400px' }}
        />
    );
};

export default GoogleMap;
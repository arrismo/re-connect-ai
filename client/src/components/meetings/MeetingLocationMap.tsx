import React, { useEffect, useState } from 'react';

// Map rendering will be done through an iframe embed of a map provider
// since actual map components often require paid API keys
interface MeetingLocationMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  meetings: any[];
  onSelectMeeting: (meetingId: number) => void;
}

const MeetingLocationMap: React.FC<MeetingLocationMapProps> = ({ 
  center, 
  zoom = 13, 
  meetings = [],
  onSelectMeeting
}) => {
  const [mapUrl, setMapUrl] = useState<string>('');
  
  useEffect(() => {
    // Create an OpenStreetMap URL (free and doesn't require an API key)
    // Format: https://www.openstreetmap.org/export/embed.html?bbox=LON1,LAT1,LON2,LAT2&layer=mapnik&marker=LAT,LON
    
    // Calculate a bounding box around the center point
    // This is a simple approximation - adjusts based on zoom level
    const zoomFactor = Math.pow(2, 13 - zoom) * 0.05;
    const latDelta = zoomFactor;
    const lngDelta = zoomFactor * 1.5; // Wider in longitude
    
    const bbox = [
      center.lng - lngDelta, // west
      center.lat - latDelta, // south
      center.lng + lngDelta, // east
      center.lat + latDelta  // north
    ].join(',');
    
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`;
    setMapUrl(url);
  }, [center, zoom]);
  
  // For actual implementation, replace this with a real map library
  // like Leaflet, Google Maps, or Mapbox
  return (
    <div className="relative h-full w-full">
      <iframe 
        title="Meeting Location Map"
        width="100%" 
        height="100%" 
        frameBorder="0" 
        scrolling="no" 
        marginHeight={0} 
        marginWidth={0} 
        src={mapUrl} 
        style={{ border: 0 }}
      />
      
      <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow-md text-xs">
        <p>Map data © OpenStreetMap contributors</p>
        <p className="text-muted-foreground">
          To view full map capabilities, API key required.
        </p>
      </div>
      
      {meetings.length > 0 && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-md">
          <p className="text-xs font-medium mb-1">{meetings.length} meetings in this area</p>
          <div className="text-xs text-muted-foreground">
            Click on a meeting from the list to view details
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingLocationMap;
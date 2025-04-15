import React from 'react';

interface MeetingLocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

// A simple component that renders an OpenStreetMap for the meeting location
const MeetingLocationMap: React.FC<MeetingLocationMapProps> = ({
  latitude,
  longitude,
  zoom = 15
}) => {
  // We're using OpenStreetMap's static map service for simplicity
  // In a production app, you might want to use a more interactive map library
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&amp;layer=mapnik&amp;marker=${latitude}%2C${longitude}`;

  return (
    <div className="h-full w-full">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        title="Meeting Location Map"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default MeetingLocationMap;
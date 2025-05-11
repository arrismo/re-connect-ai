import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  SearchIcon, 
  MapPin, 
  Calendar, 
  Clock,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import MeetingLocationMap from './MeetingLocationMap';

interface MeetingFinderProps {
  onSelectMeeting: (meetingId: number) => void;
}

const MeetingFinder: React.FC<MeetingFinderProps> = ({ onSelectMeeting }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [meetingType, setMeetingType] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  // Default to New York City coordinates (40.7128, -74.0060)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>({lat: 40.7128, lng: -74.0060});
  const [searchRadius, setSearchRadius] = useState<number>(50); // kilometers - larger default radius
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);

  // Get user's current location
  useEffect(() => {
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to a central location (e.g., city center)
          setUserLocation({ lat: 40.7128, lng: -74.0060 }); // New York City as default
        }
      );
    }
  }, [useCurrentLocation]);

  // Fetch meetings
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: [userLocation ? '/api/meetings/nearby' : '/api/meetings', userLocation?.lat, userLocation?.lng, searchRadius, meetingType],
    queryFn: async () => {
      let url = '/api/meetings';
      
      // Add location-based search if we have user location
      if (userLocation) {
        url = '/api/meetings/nearby';
        url += `?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=${searchRadius}`;
        
        if (meetingType !== 'all') {
          url += `&type=${meetingType}`;
        }
      } else if (meetingType !== 'all') {
        url += `?type=${meetingType}`;
      }
      
      const res = await apiRequest('GET', url);
      return await res.json();
    },
    enabled: !!userLocation || meetingType !== 'all'
  });

  // Filter meetings based on search query
  const filteredMeetings = React.useMemo(() => {
    if (!meetingsData?.meetings) return [];
    
    return meetingsData.meetings.filter((meeting: any) => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        meeting.name.toLowerCase().includes(query) ||
        meeting.description?.toLowerCase().includes(query) ||
        meeting.city.toLowerCase().includes(query) ||
        meeting.address?.toLowerCase().includes(query)
      );
    });
  }, [meetingsData, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search bar - Full width on mobile, fixed at top */}
      <div className="sticky top-0 z-10 bg-background pt-1 pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder="Search meetings by name or location"
                className="pl-9 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              className="h-10 w-10 md:hidden flex-shrink-0"
              onClick={() => setFilterOpen(!filterOpen)}
              aria-label="Filters"
            >
              <Filter size={18} />
            </Button>
            
            <Button 
              variant={useCurrentLocation ? "default" : "outline"} 
              size="icon"
              className="h-10 w-10 md:hidden flex-shrink-0"
              onClick={() => setUseCurrentLocation(!useCurrentLocation)}
              aria-label="Use my location"
            >
              <MapPin size={18} />
            </Button>
          </div>
          
          {/* Desktop buttons row */}
          <div className="hidden md:flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter size={16} />
              <span>Filters</span>
            </Button>
            
            <Button 
              variant={useCurrentLocation ? "default" : "outline"} 
              className="flex items-center gap-2"
              onClick={() => setUseCurrentLocation(!useCurrentLocation)}
            >
              <MapPin size={16} />
              <span>Use My Location</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Advanced filters - Fullscreen overlay on mobile */}
      {filterOpen && (
        <div className="bg-background p-4 rounded-md border shadow-md">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <label className="text-sm font-medium mb-1 block">Meeting Type</label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  
                  <SelectItem value="na">Narcotics Anonymous</SelectItem>
                  <SelectItem value="smart_recovery">SMART Recovery</SelectItem>
                  <SelectItem value="refuge_recovery">Refuge Recovery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {useCurrentLocation && (
              <div className="w-full">
                <label className="text-sm font-medium mb-1 block">Search Radius</label>
                <Select 
                  value={searchRadius.toString()} 
                  onValueChange={(value) => setSearchRadius(parseInt(value))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="10 km" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Map view - Height responsive by device */}
      {userLocation && (
        <div className="h-[200px] sm:h-[250px] md:h-[300px] rounded-lg overflow-hidden border mb-4">
          <MeetingLocationMap 
            center={userLocation} 
            zoom={11} 
            meetings={filteredMeetings} 
            onSelectMeeting={onSelectMeeting}
          />
        </div>
      )}
      
      {/* Results with better mobile sizing */}
      <div>
        <h3 className="text-base md:text-lg font-medium mb-3 flex items-center">
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 text-primary" /> 
              Loading meetings...
            </>
          ) : filteredMeetings.length === 0 ? (
            "No meetings found"
          ) : (
            `Found ${filteredMeetings.length} meetings`
          )}
        </h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filteredMeetings.map((meeting) => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting} 
                onClick={() => onSelectMeeting(meeting.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MeetingCard = ({ meeting, onClick }: { meeting: any, onClick: () => void }) => {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Format the meeting type for display
  const getMeetingTypeLabel = (type: string) => {
    switch(type) {
      case 'cancer_support': return 'Cancer Support Group';
      case 'peer_support': return 'Peer Support';
      case 'survivorship': return 'Survivorship Group';
      default: return type;
    }
  };
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer active:bg-muted/50 touch-manipulation"
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-3 sm:px-6 sm:pt-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm sm:text-base leading-tight">{meeting.name}</CardTitle>
          {meeting.dayOfWeek !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap flex-shrink-0">
              {dayNames[meeting.dayOfWeek]}
            </span>
          )}
        </div>
        <CardDescription className="text-xs leading-snug">
          {getMeetingTypeLabel(meeting.meetingType)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 px-3 sm:px-6">
        <div className="flex items-start">
          <MapPin size={12} className="mr-1.5 mt-0.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs line-clamp-2">{meeting.address || 'No address'}, {meeting.city}</span>
        </div>
        <div className="flex items-center">
          <Clock size={12} className="mr-1.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs">{meeting.startTime || 'TBD'}{meeting.endTime ? ` - ${meeting.endTime}` : ''}</span>
        </div>
        <div className="flex items-center">
          <Calendar size={12} className="mr-1.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs">
            {meeting.frequency === 'weekly' ? 'Weekly' : 
             meeting.frequency === 'daily' ? 'Daily' : 
             meeting.frequency === 'monthly' ? 'Monthly' : 
             meeting.frequency || 'Recurring'}
          </span>
        </div>
      </CardContent>
      {meeting.distance && (
        <CardFooter className="pt-0 pb-3 px-3 sm:px-6 text-xs text-muted-foreground flex justify-between items-center">
          <span>
            {(meeting.distance < 1) 
              ? `${Math.round(meeting.distance * 1000)} meters away` 
              : `${meeting.distance.toFixed(1)} km away`}
          </span>
          <span className="text-primary text-xs font-medium">View Details</span>
        </CardFooter>
      )}
    </Card>
  );
};

export default MeetingFinder;
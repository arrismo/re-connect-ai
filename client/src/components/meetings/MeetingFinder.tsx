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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(10); // kilometers
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
    queryKey: ['/api/meetings', userLocation?.lat, userLocation?.lng, searchRadius, meetingType],
    queryFn: async () => {
      let url = '/api/meetings';
      
      // Add location-based search if we have user location
      if (userLocation) {
        url += `?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${searchRadius}`;
        
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings by name, description, or location"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
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
          <span className="hidden sm:inline">Use My Location</span>
        </Button>
      </div>
      
      {/* Advanced filters */}
      {filterOpen && (
        <div className="bg-background p-4 rounded-md border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Meeting Type</label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="aa">Alcoholics Anonymous</SelectItem>
                  <SelectItem value="na">Narcotics Anonymous</SelectItem>
                  <SelectItem value="smart_recovery">SMART Recovery</SelectItem>
                  <SelectItem value="refuge_recovery">Refuge Recovery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {useCurrentLocation && (
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">Search Radius (km)</label>
                <Select 
                  value={searchRadius.toString()} 
                  onValueChange={(value) => setSearchRadius(parseInt(value))}
                >
                  <SelectTrigger>
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
      
      {/* Map view */}
      {userLocation && (
        <div className="h-[300px] rounded-lg overflow-hidden border mb-6">
          <MeetingLocationMap 
            center={userLocation} 
            zoom={11} 
            meetings={filteredMeetings} 
            onSelectMeeting={onSelectMeeting}
          />
        </div>
      )}
      
      {/* Results */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          {isLoading ? "Loading meetings..." : 
           filteredMeetings.length === 0 ? "No meetings found" : 
           `Found ${filteredMeetings.length} meetings`}
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{meeting.name}</CardTitle>
          {meeting.dayOfWeek !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {dayNames[meeting.dayOfWeek]}
            </span>
          )}
        </div>
        <CardDescription className="text-xs">
          {meeting.meetingType === 'aa' ? 'Alcoholics Anonymous' : 
           meeting.meetingType === 'na' ? 'Narcotics Anonymous' : 
           meeting.meetingType === 'smart_recovery' ? 'SMART Recovery' : 
           meeting.meetingType === 'refuge_recovery' ? 'Refuge Recovery' : 
           meeting.meetingType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <div className="flex items-center text-xs">
          <MapPin size={12} className="mr-1 text-muted-foreground" />
          <span>{meeting.address || 'No address'}, {meeting.city}</span>
        </div>
        <div className="flex items-center text-xs">
          <Clock size={12} className="mr-1 text-muted-foreground" />
          <span>{meeting.startTime || 'TBD'}{meeting.endTime ? ` - ${meeting.endTime}` : ''}</span>
        </div>
        <div className="flex items-center text-xs">
          <Calendar size={12} className="mr-1 text-muted-foreground" />
          <span>
            {meeting.frequency === 'weekly' ? 'Weekly' : 
             meeting.frequency === 'daily' ? 'Daily' : 
             meeting.frequency === 'monthly' ? 'Monthly' : 
             meeting.frequency || 'Recurring'}
          </span>
        </div>
      </CardContent>
      {meeting.distance && (
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          {(meeting.distance < 1) 
            ? `${Math.round(meeting.distance * 1000)} meters away` 
            : `${meeting.distance.toFixed(1)} km away`}
        </CardFooter>
      )}
    </Card>
  );
};

export default MeetingFinder;
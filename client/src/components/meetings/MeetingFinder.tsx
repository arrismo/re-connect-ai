import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import MeetingLocationMap from './MeetingLocationMap';

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type MeetingFinderProps = {
  onSelectMeeting?: (meetingId: number) => void;
};

const MeetingFinder: React.FC<MeetingFinderProps> = ({ onSelectMeeting }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(10); // Default 10km radius
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Query to fetch all meetings (used when no location is specified)
  const { 
    data: allMeetingsData, 
    isLoading: isLoadingAll 
  } = useQuery({
    queryKey: ['/api/meetings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/meetings');
      return await res.json();
    },
    enabled: !isSearching // Only fetch all meetings when not searching by location
  });

  // Query to fetch meetings by location
  const { 
    data: nearbyMeetingsData, 
    isLoading: isLoadingNearby,
    refetch: refetchNearby
  } = useQuery({
    queryKey: ['/api/meetings/nearby', latitude, longitude, radius],
    queryFn: async () => {
      if (!latitude || !longitude) return { meetings: [] };
      const res = await apiRequest('GET', 
        `/api/meetings/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      return await res.json();
    },
    enabled: isSearching && !!latitude && !!longitude
  });

  // Combine the data sources based on current state
  const meetings = isSearching 
    ? nearbyMeetingsData?.meetings || []
    : allMeetingsData?.meetings || [];

  const isLoading = isSearching ? isLoadingNearby : isLoadingAll;

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsSearching(true);
          refetchNearby();
          toast({
            title: "Location detected",
            description: "Finding meetings near you...",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Couldn't get your location",
            description: "Please check your browser settings and try again.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
    }
  };

  // Handle the RSVP action
  const handleAttendMeeting = async (meetingId: number, status: 'going' | 'interested' | 'not_going') => {
    try {
      await apiRequest('POST', `/api/meetings/${meetingId}/attend`, { status });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings/nearby'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-meetings'] });
      
      toast({
        title: status === 'going' 
          ? "You're attending this meeting" 
          : status === 'interested' 
            ? "Marked as interested" 
            : "Marked as not going",
        description: status === 'going' 
          ? "This meeting will appear in your calendar." 
          : "",
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Couldn't update attendance",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
        <Button 
          variant="outline" 
          onClick={getCurrentLocation} 
          className="flex items-center space-x-2"
        >
          <MapPin size={16} />
          <span>Use My Location</span>
        </Button>
        
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            min={1}
            max={100}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value) || 10)}
            className="w-16 md:w-20"
          />
          <span>km radius</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <span className="ml-2">Loading meetings...</span>
        </div>
      ) : meetings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg md:text-xl">{meeting.name}</CardTitle>
                    <CardDescription>
                      {meeting.meetingType === 'aa' ? 'Alcoholics Anonymous' : 
                       meeting.meetingType === 'na' ? 'Narcotics Anonymous' : 
                       meeting.meetingType === 'smart_recovery' ? 'SMART Recovery' : 
                       meeting.meetingType}
                    </CardDescription>
                  </div>
                  <Badge>{dayNames[meeting.dayOfWeek || 0]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin size={16} className="mr-2 text-muted-foreground" />
                    <span>
                      {meeting.address || 'No address provided'} 
                      {meeting.city && `, ${meeting.city}`}
                      {meeting.state && `, ${meeting.state}`}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock size={16} className="mr-2 text-muted-foreground" />
                    <span>
                      {meeting.startTime ? `${meeting.startTime}` : 'Time not specified'}
                      {meeting.endTime ? ` - ${meeting.endTime}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar size={16} className="mr-2 text-muted-foreground" />
                    <span>
                      {meeting.isRecurring ? 'Recurring ' : 'One-time '}
                      {meeting.frequency || 'weekly'} meeting
                    </span>
                  </div>
                  {meeting.description && (
                    <p className="mt-2 text-sm">{meeting.description}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="secondary"
                  onClick={() => onSelectMeeting && onSelectMeeting(meeting.id)}
                >
                  View Details
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleAttendMeeting(meeting.id, 'going')}
                >
                  Attend
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-secondary/20 rounded-lg">
          <p className="mb-2">No meetings found.</p>
          {isSearching ? (
            <p className="text-sm text-muted-foreground">
              Try increasing the search radius or try a different location.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Use your location to find meetings near you.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingFinder;
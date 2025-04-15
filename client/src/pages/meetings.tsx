import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, MapPin, Users, Check, Clock } from 'lucide-react';
import MeetingFinder from '@/components/meetings/MeetingFinder';
import MeetingDetails from '@/components/meetings/MeetingDetails';

const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('find');
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

  // If a meeting is selected, show its details
  if (selectedMeetingId !== null) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        <MeetingDetails 
          meetingId={selectedMeetingId} 
          onBack={() => setSelectedMeetingId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recovery Meetings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Find Meetings
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AA Meetings</div>
            <p className="text-xs text-muted-foreground">
              Find AA meetings near you
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connect
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Meet Others</div>
            <p className="text-xs text-muted-foreground">
              Connect with others on the same journey
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Check In
            </CardTitle>
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Earn Points</div>
            <p className="text-xs text-muted-foreground">
              Earn points by attending meetings
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="find" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="find">Find Meetings</TabsTrigger>
          <TabsTrigger value="my">My Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="find" className="pt-4">
          <MeetingFinder onSelectMeeting={setSelectedMeetingId} />
        </TabsContent>
        <TabsContent value="my" className="pt-4">
          <MyMeetings onSelectMeeting={setSelectedMeetingId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component to display user's meetings
interface MyMeetingsProps {
  onSelectMeeting: (meetingId: number) => void;
}

const MyMeetings: React.FC<MyMeetingsProps> = ({ onSelectMeeting }) => {
  const { user } = useAuth();
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [pastMeetings, setPastMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user's meetings
  const { data: myMeetingsData, isLoading: isLoadingMyMeetings } = useQuery({
    queryKey: ['/api/my-meetings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/my-meetings');
      return await res.json();
    }
  });

  // Process the data when it arrives
  useEffect(() => {
    if (myMeetingsData?.meetings) {
      const now = new Date();
      
      // Sort meetings into upcoming and past
      const upcoming: any[] = [];
      const past: any[] = [];
      
      myMeetingsData.meetings.forEach((meeting: any) => {
        // We'll use simple logic for now - just use day of week to determine if it's upcoming
        const today = now.getDay(); // 0 = Sunday, 6 = Saturday
        const meetingDay = meeting.dayOfWeek;
        
        // If meeting day is today or later in the week, it's upcoming
        if (meetingDay >= today) {
          upcoming.push(meeting);
        } else {
          past.push(meeting);
        }
      });
      
      setUpcomingMeetings(upcoming);
      setPastMeetings(past);
      setIsLoading(false);
    }
  }, [myMeetingsData]);

  if (isLoadingMyMeetings || isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (upcomingMeetings.length === 0 && pastMeetings.length === 0) {
    return (
      <div className="text-center py-12 bg-secondary/20 rounded-lg">
        <h3 className="text-lg font-medium mb-2">You haven't RSVP'd to any meetings yet</h3>
        <p className="text-muted-foreground mb-4">
          Find and attend meetings to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {upcomingMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Upcoming Meetings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {upcomingMeetings.map(meeting => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting} 
                onSelect={() => onSelectMeeting(meeting.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {pastMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Meetings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {pastMeetings.map(meeting => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting} 
                isPast={true}
                onSelect={() => onSelectMeeting(meeting.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component to display a meeting card
interface MeetingCardProps {
  meeting: any;
  isPast?: boolean;
  onSelect: () => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, isPast = false, onSelect }) => {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${isPast ? 'opacity-70' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{meeting.name}</CardTitle>
          <Badge>{dayNames[meeting.dayOfWeek || 0]}</Badge>
        </div>
        <CardDescription className="text-xs">
          {meeting.meetingType === 'aa' ? 'Alcoholics Anonymous' : 
           meeting.meetingType === 'na' ? 'Narcotics Anonymous' : 
           meeting.meetingType === 'smart_recovery' ? 'SMART Recovery' : 
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
        <div className="text-xs mt-2">
          <Badge variant={meeting.attendanceStatus === 'going' ? 'default' : 'outline'} className="mr-2">
            {meeting.attendanceStatus || 'Not RSVP\'d'}
          </Badge>
          {meeting.checkedIn && (
            <Badge variant="success" className="bg-green-100 text-green-800">
              <Check className="mr-1 h-3 w-3" /> Checked In
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeetingsPage;
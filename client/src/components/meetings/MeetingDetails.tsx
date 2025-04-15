import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Users, 
  ExternalLink,
  CalendarCheck,
  Check,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import MeetingLocationMap from './MeetingLocationMap';

interface MeetingDetailsProps {
  meetingId: number;
  onBack: () => void;
}

const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meetingId, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('details');
  
  // Fetch meeting details
  const { data: meetingData, isLoading } = useQuery({
    queryKey: ['/api/meetings', meetingId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}`);
      return await res.json();
    }
  });
  
  // Fetch meeting attendees
  const { data: attendeesData } = useQuery({
    queryKey: ['/api/meetings', meetingId, 'attendees'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}/attendees`);
      return await res.json();
    },
    enabled: !!meetingId
  });
  
  // RSVP for a meeting
  const rsvpMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest('POST', `/api/meetings/${meetingId}/rsvp`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId, 'attendees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-meetings'] });
      
      toast({
        title: "RSVP Updated",
        description: "Your meeting attendance has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating RSVP",
        description: "There was a problem updating your RSVP. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Check-in to a meeting
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/meetings/${meetingId}/check-in`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-meetings'] });
      
      // If points were earned, show special message
      toast({
        title: "Check-in Successful",
        description: data.pointsEarned ? `You've earned ${data.pointsEarned} points for checking in!` : "Your attendance has been recorded.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Check-in Failed",
        description: "There was a problem recording your attendance. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }
  
  if (!meetingData?.meeting) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Meeting Not Found</h2>
        <p className="text-muted-foreground mb-6">The meeting you're looking for doesn't exist or has been removed.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }
  
  const meeting = meetingData.meeting;
  const userAttendance = meetingData.userAttendance || {};
  const attendees = attendeesData?.attendees || [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Calculate the current day local to the meeting location
  const isCurrentDayOfWeek = new Date().getDay() === meeting.dayOfWeek;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{meeting.name}</h1>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{meeting.name}</CardTitle>
                    <Badge variant="outline">
                      {meeting.meetingType === 'aa' ? 'AA' : 
                       meeting.meetingType === 'na' ? 'NA' : 
                       meeting.meetingType === 'smart_recovery' ? 'SMART' : 
                       meeting.meetingType === 'refuge_recovery' ? 'Refuge' : 
                       meeting.meetingType}
                    </Badge>
                  </div>
                  <CardDescription>
                    {meeting.dayOfWeek !== undefined && dayNames[meeting.dayOfWeek]}
                    {meeting.frequency && ` · ${meeting.frequency}`}
                  </CardDescription>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  {userAttendance.checkedIn ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 px-3 py-1.5">
                      <Check className="mr-1 h-3 w-3" /> Checked In
                    </Badge>
                  ) : (
                    isCurrentDayOfWeek && (
                      <Button 
                        size="sm" 
                        onClick={() => checkInMutation.mutate()}
                        disabled={checkInMutation.isPending}
                      >
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Check In
                      </Button>
                    )
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant={userAttendance.status === 'going' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => rsvpMutation.mutate('going')}
                      disabled={rsvpMutation.isPending}
                    >
                      Going
                    </Button>
                    <Button 
                      variant={userAttendance.status === 'maybe' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => rsvpMutation.mutate('maybe')}
                      disabled={rsvpMutation.isPending}
                    >
                      Maybe
                    </Button>
                    <Button 
                      variant={userAttendance.status === 'not_going' ? "destructive" : "outline"} 
                      size="sm"
                      onClick={() => rsvpMutation.mutate('not_going')}
                      disabled={rsvpMutation.isPending}
                    >
                      Can't Go
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Time and location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Time</h3>
                      <p className="text-sm text-muted-foreground">
                        {meeting.startTime || 'TBD'}
                        {meeting.endTime ? ` - ${meeting.endTime}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Day</h3>
                      <p className="text-sm text-muted-foreground">
                        {meeting.dayOfWeek !== undefined ? dayNames[meeting.dayOfWeek] : 'TBD'}
                        {meeting.frequency === 'weekly' && ' (Weekly)'}
                        {meeting.frequency === 'monthly' && ' (Monthly)'}
                        {meeting.frequency === 'daily' && ' (Daily)'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-sm text-muted-foreground">{meeting.address || 'No address provided'}</p>
                      <p className="text-sm text-muted-foreground">{meeting.city}{meeting.state ? `, ${meeting.state}` : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Attendees</h3>
                      <p className="text-sm text-muted-foreground">
                        {attendees.filter(a => a.status === 'going').length} going
                        {attendees.filter(a => a.status === 'maybe').length > 0 && 
                          `, ${attendees.filter(a => a.status === 'maybe').length} maybe`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {meeting.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">About this meeting</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{meeting.description}</p>
                  </div>
                </>
              )}
              
              {/* Contact */}
              {meeting.contactName || meeting.contactEmail || meeting.contactPhone && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Contact information</h3>
                    {meeting.contactName && <p className="text-sm">Contact: {meeting.contactName}</p>}
                    {meeting.contactEmail && <p className="text-sm">Email: {meeting.contactEmail}</p>}
                    {meeting.contactPhone && <p className="text-sm">Phone: {meeting.contactPhone}</p>}
                  </div>
                </>
              )}
              
              {/* Meeting format/notes */}
              {(meeting.format || meeting.notes) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    {meeting.format && (
                      <div>
                        <h3 className="font-medium mb-1">Meeting Format</h3>
                        <p className="text-sm text-muted-foreground">{meeting.format}</p>
                      </div>
                    )}
                    
                    {meeting.notes && (
                      <div>
                        <h3 className="font-medium mb-1">Additional Notes</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{meeting.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col items-start gap-4">
              <div className="flex items-center text-muted-foreground text-sm">
                <Info className="mr-2 h-4 w-4" />
                <span>Meetings are managed by the community. Contact the organizer for questions.</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendees" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Attendees</CardTitle>
              <CardDescription>People who are attending this meeting</CardDescription>
            </CardHeader>
            <CardContent>
              {attendees.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No one has RSVP'd to this meeting yet.</p>
                  <p>Be the first to sign up!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {attendees.filter(attendee => attendee.status === 'going').length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Attending ({attendees.filter(attendee => attendee.status === 'going').length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attendees
                          .filter(attendee => attendee.status === 'going')
                          .map(attendee => (
                            <AttendeeCard key={attendee.id} attendee={attendee} />
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {attendees.filter(attendee => attendee.status === 'maybe').length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Maybe Attending ({attendees.filter(attendee => attendee.status === 'maybe').length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attendees
                          .filter(attendee => attendee.status === 'maybe')
                          .map(attendee => (
                            <AttendeeCard key={attendee.id} attendee={attendee} />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="mt-6">
          {(meeting.latitude && meeting.longitude) ? (
            <div className="h-[500px] rounded-lg overflow-hidden border">
              <MeetingLocationMap 
                center={{ lat: meeting.latitude, lng: meeting.longitude }} 
                zoom={16} 
                meetings={[meeting]} 
                onSelectMeeting={() => {}}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">This meeting doesn't have location coordinates set.</p>
                {meeting.address && (
                  <a 
                    href={`https://maps.google.com/maps?q=${encodeURIComponent(
                      `${meeting.address}, ${meeting.city}, ${meeting.state || ''}`
                    )}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View on Google Maps
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Attendee Card component
const AttendeeCard = ({ attendee }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
        {attendee.displayName?.[0] || attendee.username?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attendee.displayName || attendee.username}</p>
        <p className="text-xs text-muted-foreground">
          {attendee.checkedIn && (
            <span className="inline-flex items-center text-green-600">
              <Check className="h-3 w-3 mr-1" /> Checked in
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default MeetingDetails;
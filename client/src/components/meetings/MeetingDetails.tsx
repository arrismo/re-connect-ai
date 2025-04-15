import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ArrowLeft, 
  Check, 
  UserCheck, 
  UserX, 
  UserMinus,
  Share
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import MeetingLocationMap from './MeetingLocationMap';

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface MeetingDetailsProps {
  meetingId: number;
  onBack: () => void;
}

const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meetingId, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAttendees, setShowAttendees] = useState(false);

  // Fetch meeting details
  const { 
    data: meetingData, 
    isLoading: isLoadingMeeting
  } = useQuery({
    queryKey: [`/api/meetings/${meetingId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}`);
      return await res.json();
    }
  });

  // Fetch attendees
  const { 
    data: attendeesData, 
    isLoading: isLoadingAttendees
  } = useQuery({
    queryKey: [`/api/meetings/${meetingId}/attendees`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}/attendees`);
      return await res.json();
    },
    enabled: showAttendees
  });

  // Fetch user's attendance status
  const { 
    data: userAttendanceData
  } = useQuery({
    queryKey: [`/api/meetings/${meetingId}/attendance`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}/attendance`);
      return await res.json();
    }
  });

  // Mutation for attending/updating attendance
  const attendMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const res = await apiRequest('POST', `/api/meetings/${meetingId}/attend`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/attendance`] });
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-meetings'] });
    }
  });

  // Mutation for checking in
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/meetings/${meetingId}/check-in`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/attendance`] });
      toast({
        title: "Checked in successfully",
        description: "You've earned points for attending this meeting!",
      });
    },
    onError: () => {
      toast({
        title: "Check-in failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    }
  });

  // Calculate if user can check in (within 30 min of start time or during meeting)
  const canCheckIn = () => {
    if (!meetingData?.meeting || !userAttendanceData?.attendance) return false;
    if (userAttendanceData.attendance.checkedIn) return false;
    if (userAttendanceData.attendance.status !== 'going') return false;
    
    // For demo purposes, allow check-in at any time
    // In a real app, would check if current time is within meeting time
    return true;
  };

  if (isLoadingMeeting) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Loading meeting details...</span>
      </div>
    );
  }

  if (!meetingData?.meeting) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">Meeting not found</h3>
        <p className="text-muted-foreground mt-2">
          The meeting you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meetings
        </Button>
      </div>
    );
  }

  const meeting = meetingData.meeting;
  const attendance = userAttendanceData?.attendance;
  const attendees = attendeesData?.attendees || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="mr-4 p-0 h-auto"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{meeting.name}</h2>
          <p className="text-muted-foreground">
            {meeting.meetingType === 'aa' ? 'Alcoholics Anonymous' : 
             meeting.meetingType === 'na' ? 'Narcotics Anonymous' : 
             meeting.meetingType === 'smart_recovery' ? 'SMART Recovery' : 
             meeting.meetingType}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Meeting Details</span>
              <Badge>{dayNames[meeting.dayOfWeek || 0]}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>
                  {meeting.address || 'No address provided'} 
                  {meeting.city && `, ${meeting.city}`}
                  {meeting.state && `, ${meeting.state}`}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>
                  {meeting.startTime ? `${meeting.startTime}` : 'Time not specified'}
                  {meeting.endTime ? ` - ${meeting.endTime}` : ''}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>
                  {meeting.isRecurring ? 'Recurring ' : 'One-time '}
                  {meeting.frequency || 'weekly'} meeting
                </span>
              </div>
            </div>
            
            {meeting.description && (
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm">{meeting.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            {meeting.latitude && meeting.longitude ? (
              <div className="h-48 rounded-md overflow-hidden">
                <MeetingLocationMap 
                  latitude={meeting.latitude} 
                  longitude={meeting.longitude} 
                  zoom={15}
                />
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center bg-secondary/30 rounded-md">
                <p className="text-muted-foreground">No location map available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Your Attendance</span>
            {attendance?.checkedIn && (
              <Badge variant="success" className="bg-green-100 text-green-800">
                <Check className="mr-1 h-4 w-4" />
                Checked In
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={attendance?.status === 'going' ? 'default' : 'outline'}
                    className={attendance?.status === 'going' ? '' : 'border-dashed'}
                    onClick={() => attendMutation.mutate({ status: 'going' })}
                    disabled={attendMutation.isPending}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    I'm Going
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirm your attendance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={attendance?.status === 'interested' ? 'default' : 'outline'}
                    className={attendance?.status === 'interested' ? '' : 'border-dashed'}
                    onClick={() => attendMutation.mutate({ status: 'interested' })}
                    disabled={attendMutation.isPending}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Interested
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as interested, but not confirmed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={attendance?.status === 'not_going' ? 'default' : 'outline'}
                    className={attendance?.status === 'not_going' ? '' : 'border-dashed'}
                    onClick={() => attendMutation.mutate({ status: 'not_going' })}
                    disabled={attendMutation.isPending}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Not Going
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Decline this meeting</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {canCheckIn() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default"
                      onClick={() => checkInMutation.mutate()}
                      disabled={checkInMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 ml-auto"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Check In Now
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Check in to earn points</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <span>Attendees</span>
              <Badge variant="outline" className="ml-2">
                {attendees.length} {attendees.length === 1 ? 'person' : 'people'}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAttendees(!showAttendees)}
            >
              {showAttendees ? 'Hide' : 'Show'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAttendees && (
          <CardContent>
            {isLoadingAttendees ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 text-primary" />
              </div>
            ) : attendees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attendees.map(attendee => (
                  <div 
                    key={attendee.id} 
                    className="flex items-center p-2 rounded-md bg-secondary/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-2">
                      {attendee.user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{attendee.user.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {attendee.checkedIn ? 'Checked in' : attendee.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-2">
                No attendees yet. Be the first to join!
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MeetingDetails;
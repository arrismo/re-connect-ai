import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import MeetingFinder from '@/components/meetings/MeetingFinder';
import MeetingDetails from '@/components/meetings/MeetingDetails';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Users
} from 'lucide-react';

const MeetingsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  
  // Handle selecting a meeting
  const handleSelectMeeting = (meetingId: number) => {
    setSelectedMeetingId(meetingId);
  };
  
  // Handle going back to the meeting list
  const handleBackToList = () => {
    setSelectedMeetingId(null);
  };
  
  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      {!selectedMeetingId ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Meeting Finder</h1>
            <p className="text-muted-foreground">
              Find and join local recovery meetings in your area. Attending meetings regularly can significantly 
              improve your chances of long-term recovery success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <MeetingFinder onSelectMeeting={handleSelectMeeting} />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Attend Meetings?</CardTitle>
                  <CardDescription>The benefits of in-person support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Community Connection</h3>
                      <p className="text-sm text-muted-foreground">
                        Meet others who understand your challenges and can provide genuine support.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Accountability</h3>
                      <p className="text-sm text-muted-foreground">
                        Regular attendance helps establish a routine and commitment to your recovery.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Local Resources</h3>
                      <p className="text-sm text-muted-foreground">
                        Discover support resources available in your community.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Earning Points</CardTitle>
                  <CardDescription>Rewards for meeting attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Checking in at meetings helps you earn points that can track your progress:
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center">
                      <span className="bg-primary/10 text-primary font-semibold rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">+5</span>
                      <span>For each meeting you attend</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary/10 text-primary font-semibold rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">+10</span>
                      <span>For attending 3 meetings in a week</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary/10 text-primary font-semibold rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">+25</span>
                      <span>For maintaining 4+ weeks of regular attendance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <MeetingDetails meetingId={selectedMeetingId} onBack={handleBackToList} />
      )}
    </div>
  );
};

export default MeetingsPage;
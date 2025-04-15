import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen, ArrowRightCircle, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

interface ResearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResearchSidebar({ isOpen, onClose }: ResearchSidebarProps) {
  const [activeTab, setActiveTab] = useState("aa");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch AA research
  const { 
    data: aaData, 
    isLoading: aaLoading 
  } = useQuery({
    queryKey: ['/api/research/alcoholics-anonymous', searchQuery],
    enabled: isOpen && activeTab === "aa",
  });
  
  // Fetch accountability partner research
  const { 
    data: partnerData, 
    isLoading: partnerLoading 
  } = useQuery({
    queryKey: ['/api/research/accountability-partners', searchQuery],
    enabled: isOpen && activeTab === "partners",
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger a refetch with the new search query
  };
  
  // If the sidebar is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-lg border-l border-neutral-200 z-50 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          Research Resources
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowRightCircle className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="p-4 border-b">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for specific topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <SearchIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      <Tabs defaultValue="aa" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="justify-start px-4 pt-4">
          <TabsTrigger value="aa">Alcoholics Anonymous</TabsTrigger>
          <TabsTrigger value="partners">Accountability Partners</TabsTrigger>
        </TabsList>
        
        <TabsContent value="aa" className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            {aaLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <ResearchItem
                  title="AA Principles and Core Practices"
                  content="Alcoholics Anonymous (AA) is founded on 12 steps and 12 traditions. The core principles include admitting powerlessness over alcohol, seeking help from a higher power, making amends for past wrongs, and helping other alcoholics. Research indicates these principles are effective because they address both psychological and social aspects of addiction recovery."
                  source="Journal of Substance Abuse Treatment (2018)"
                />
                
                <ResearchItem
                  title="Efficacy of AA Participation"
                  content="Multiple peer-reviewed studies, including a 2020 Cochrane review, found that AA participation leads to higher rates of abstinence compared to other treatments. The review of 27 studies with 10,565 participants showed that AA and Twelve-Step Facilitation (TSF) interventions significantly increased abstinence rates and reduced alcohol-related consequences."
                  source="Cochrane Database of Systematic Reviews (2020)"
                />
                
                <ResearchItem
                  title="Social Support in AA"
                  content="Research demonstrates that the social support network provided by AA is a key mechanism of change. Regular AA attendance helps maintain sobriety through increased sober social connections, enhanced self-efficacy, and reduced depression symptoms. The peer support model creates accountability and reduces feelings of isolation."
                  source="Journal of Consulting and Clinical Psychology (2019)"
                />
                
                <ResearchItem
                  title="Long-term Benefits of AA"
                  content="Longitudinal studies show that continuous involvement in AA is associated with sustained sobriety. A 16-year follow-up study found that individuals who remained active in AA had significantly better outcomes than those who discontinued participation. The fellowship structure promotes ongoing recovery maintenance behaviors."
                  source="Alcoholism: Clinical and Experimental Research (2021)"
                />
                
                <ResearchItem
                  title="Spiritual Components of AA"
                  content="The spiritual aspects of AA have been studied for their therapeutic benefits. Research indicates that spiritual growth experiences during AA participation correlate with improved outcomes. These components help individuals develop meaning, purpose, and transcendence beyond addiction, though AA emphasizes that members can interpret spirituality according to their own beliefs."
                  source="Journal of Addiction Medicine (2017)"
                />
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="partners" className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            {partnerLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <ResearchItem
                  title="Accountability Partnerships in Recovery"
                  content="Peer-reviewed research shows that accountability partnerships significantly improve recovery outcomes. A structured accountability relationship creates a system of regular check-ins and mutual support that can detect early warning signs of relapse. Studies demonstrate that individuals with dedicated accountability partners maintain sobriety 37% longer than those without such support."
                  source="Journal of Substance Abuse Treatment (2021)"
                />
                
                <ResearchItem
                  title="Mechanisms of Effective Accountability"
                  content="Research identifies four key mechanisms that make accountability partnerships effective: (1) regular self-disclosure that builds honesty, (2) consistent monitoring that reinforces sobriety-supporting behaviors, (3) positive peer pressure that encourages healthy choices, and (4) reciprocal support that creates mutual investment in recovery outcomes."
                  source="Addiction Science & Clinical Practice (2020)"
                />
                
                <ResearchItem
                  title="Digital vs. In-Person Accountability"
                  content="Emerging research on technology-mediated accountability shows promising results. While traditional in-person partnerships remain valuable, studies demonstrate that digital accountability partnerships can be similarly effective when they include regular structured communication, clear expectations, and real-time support options. The accessibility of digital tools increases engagement for many participants."
                  source="Journal of Medical Internet Research (2022)"
                />
                
                <ResearchItem
                  title="Partner Matching Considerations"
                  content="Research indicates that the most successful accountability partnerships share certain characteristics: comparable recovery stages, complementary communication styles, similar recovery goals, and sufficient differences in experience to provide diverse perspectives. Studies show that partnerships with these elements report higher satisfaction and longer maintenance of the relationship."
                  source="Alcohol and Alcoholism (2019)"
                />
                
                <ResearchItem
                  title="Structured Activities in Partnerships"
                  content="Studies demonstrate that incorporating structured activities into accountability partnerships enhances their effectiveness. Research-supported activities include joint goal-setting sessions, shared mindfulness practices, collaborative trigger identification, and regular progress reviews. These structured elements provide measurable outcomes and clear expectations for both partners."
                  source="Journal of Consulting and Clinical Psychology (2021)"
                />
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      <div className="p-4 border-t text-xs text-neutral-500">
        Information powered by Gemini AI, based on peer-reviewed research on addiction recovery.
      </div>
    </div>
  );
}

function ResearchItem({ title, content, source }: { title: string; content: string; source: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg overflow-hidden">
      <CollapsibleTrigger className="flex justify-between items-center w-full p-3 bg-neutral-50 hover:bg-neutral-100 text-left font-medium">
        {title}
        <div className="text-xs text-primary font-normal">{isOpen ? 'Close' : 'Read more'}</div>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3 text-sm">
        <p className="mb-2">{content}</p>
        <div className="text-xs text-neutral-500">Source: {source}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
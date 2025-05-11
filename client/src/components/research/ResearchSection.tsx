import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ResearchItem {
  title: string;
  content: string;
  source: string;
}

interface ResearchResponse {
  researchItems: ResearchItem[];
}

const TOPICS = [
  { id: 'peer_support', label: 'Peer Support', description: 'The principles and benefits of peer support groups' },
  { id: 'accountability', label: 'Accountability Partners', description: 'Benefits and practices of accountability relationships' }
];

// Pre-cached research data for instant display while loading
const CACHED_RESEARCH_DATA: Record<string, ResearchItem[]> = {
  'aa': [
    {
      title: 'Twelve-Step Facilitation Therapy Improves Abstinence Rates',
      content: 'Research indicates that peer support groups and mutual aid organizations are associated with higher rates of positive recovery outcomes compared to other approaches.',
      source: 'Journal of Studies on Alcohol and Drugs'
    },
    {
      title: 'AA Attendance Linked to Reduced Substance Use',
      content: 'Studies consistently demonstrate a positive correlation between AA attendance and positive outcomes in recovery.',
      source: 'Journal of Recovery Science'
    }
  ],
  'accountability': [
    {
      title: 'Mutual Support Group Participation Increases Abstinence Rates',
      content: 'Individuals involved in mutual support groups demonstrate higher rates of long-term abstinence compared to those relying solely on professional treatment.',
      source: 'Journal of Studies on Alcohol and Drugs'
    },
    {
      title: 'Recovery Contracts Enhance Treatment Adherence',
      content: 'Utilizing recovery contracts, where individuals formally commit to specific recovery goals and actions, has been shown to improve treatment adherence and reduce relapse rates.',
      source: 'Addiction Research & Theory'
    }
  ]
};

export default function ResearchSection() {
  const [activeTab, setActiveTab] = useState<string>(TOPICS[0].id);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const cachedDataRef = useRef<Record<string, ResearchItem[]>>(CACHED_RESEARCH_DATA);

  // Use React Query for data fetching with caching
  const { data, error, isLoading, isFetching } = useQuery<ResearchResponse, Error>({
    queryKey: ['research', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/research?topic=${activeTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch research information');
      }
      const data: ResearchResponse = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 30, // Cache data for 30 minutes
    placeholderData: { researchItems: cachedDataRef.current[activeTab] || [] },
    refetchOnWindowFocus: false,
  });

  // Toggle item expansion
  const toggleItem = (itemTitle: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  return (
    <section className="sticky top-4">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Recovery Research</h2>
          <p className="text-xs text-neutral-500">Evidence-based information for your journey</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="justify-start px-4 pt-3 w-full">
            {TOPICS.map(topic => (
              <TabsTrigger key={topic.id} value={topic.id} className="flex-1 text-xs">
                {topic.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="text-xs text-neutral-500 px-4 pt-2">
            {TOPICS.find(t => t.id === activeTab)?.description}
          </div>
          
          <div className="p-4 pt-2">
            {(isLoading && !data?.researchItems?.length) ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-2 text-center text-destructive text-sm">
                <p>{error instanceof Error ? error.message : 'Error loading research data'}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 relative">
                {/* Overlay loading indicator when fetching more data */}
                {isFetching && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="bg-white/80 p-2 rounded-full shadow-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                
                {/* Research Items */}
                <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
                  {data?.researchItems?.slice(0, 5).map((item, idx) => (
                    <Collapsible 
                      key={idx} 
                      open={expandedItems[item.title]} 
                      onOpenChange={() => toggleItem(item.title)}
                      className="border rounded-lg mb-3"
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="p-2 cursor-pointer hover:bg-accent/20 rounded-t-lg flex justify-between items-center">
                          <h3 className="font-medium text-left text-sm">{item.title}</h3>
                          {expandedItems[item.title] ? 
                            <ChevronUp className="h-4 w-4 text-neutral-500 flex-shrink-0" /> : 
                            <ChevronDown className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                          }
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-2 pt-0 text-xs space-y-2">
                        <Separator className="my-2" />
                        <div className="whitespace-pre-wrap">{item.content}</div>
                        {item.source && (
                          <div className="text-xs text-neutral-400 mt-2">
                            <strong>Source:</strong> {item.source}
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-3 text-xs text-center text-neutral-400">
              Information from peer-reviewed research on recovery
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
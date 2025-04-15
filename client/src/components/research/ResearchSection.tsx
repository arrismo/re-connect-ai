import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface ResearchItem {
  title: string;
  content: string;
  source: string;
}

interface ResearchResponse {
  researchItems: ResearchItem[];
}

const TOPICS = [
  { id: 'aa', label: 'Alcoholics Anonymous', description: 'The 12 steps and principles of AA' },
  { id: 'accountability', label: 'Accountability Partners', description: 'Benefits and practices of accountability relationships' }
];

export default function ResearchSection() {
  const [activeTab, setActiveTab] = useState<string>(TOPICS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [research, setResearch] = useState<Record<string, ResearchItem[]>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Fetch research data when tab changes
  useEffect(() => {
    fetchResearch(activeTab);
  }, [activeTab]);

  // Function to fetch research data
  const fetchResearch = async (topic: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/research?topic=${topic}`);
      if (!response.ok) {
        throw new Error('Failed to fetch research information');
      }
      
      const data: ResearchResponse = await response.json();
      setResearch(prev => ({ ...prev, [topic]: data.researchItems }));
    } catch (error) {
      console.error('Error fetching research:', error);
      setError('Unable to load research information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle item expansion
  const toggleItem = (itemTitle: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Recovery Research</h2>
        <p className="text-sm text-neutral-500">Evidence-based information to support your recovery journey</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="justify-start mb-4 w-full">
            {TOPICS.map(topic => (
              <TabsTrigger key={topic.id} value={topic.id} className="flex-1">
                {topic.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="text-sm text-neutral-500 mb-4">
            {TOPICS.find(t => t.id === activeTab)?.description}
          </div>
          
          <Separator className="mb-4" />

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {research[activeTab]?.slice(0, 3).map((item, idx) => (
                <Collapsible 
                  key={idx} 
                  open={expandedItems[item.title]} 
                  onOpenChange={() => toggleItem(item.title)}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="p-3 cursor-pointer hover:bg-accent rounded-t-lg flex justify-between items-center">
                      <h3 className="font-medium text-left">{item.title}</h3>
                      {expandedItems[item.title] ? 
                        <ChevronUp className="h-4 w-4 text-neutral-500" /> : 
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      }
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 pt-0 text-sm space-y-2">
                    <Separator className="my-2" />
                    <div className="whitespace-pre-wrap">{item.content}</div>
                    {item.source && (
                      <div className="text-xs text-neutral-500 mt-2">
                        <strong>Source:</strong> {item.source}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
          
          <div className="mt-3 text-xs text-center text-neutral-400">
            Information sourced from peer-reviewed research on recovery principles
          </div>
        </Tabs>
      </div>
    </section>
  );
}
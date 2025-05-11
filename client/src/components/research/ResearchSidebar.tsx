import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ResearchItem {
  title: string;
  content: string;
  source: string;
}

interface ResearchResponse {
  researchItems: ResearchItem[];
}

interface ResearchSidebarProps {
  onClose: () => void;
}

const TOPICS = [
  { id: 'peer_support', label: 'Peer Support', description: 'The principles and benefits of peer support groups' },
  { id: 'accountability', label: 'Accountability Partners', description: 'Benefits and practices of accountability relationships' }
];

export default function ResearchSidebar({ onClose }: ResearchSidebarProps) {
  const [activeTab, setActiveTab] = useState<string>(TOPICS[0].id);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [research, setResearch] = useState<Record<string, ResearchItem[]>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Fetch research data when tab changes
  useEffect(() => {
    fetchResearch(activeTab);
  }, [activeTab]);

  // Function to fetch research data
  const fetchResearch = async (topic: string, searchQuery?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({ 
        topic,
        ...(searchQuery && { query: searchQuery })
      });
      
      const response = await fetch(`/api/research?${queryParams.toString()}`);
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

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResearch(activeTab, query);
  };

  // Toggle item expansion
  const toggleItem = (itemTitle: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-xl z-50 flex flex-col border-l">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Recovery Research</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 justify-start">
          {TOPICS.map(topic => (
            <TabsTrigger key={topic.id} value={topic.id} className="flex-1">
              {topic.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <form onSubmit={handleSearch} className="px-4 py-2 flex gap-2">
          <Input 
            placeholder="Search..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        <div className="p-4 pb-2">
          <p className="text-sm text-muted-foreground">
            {TOPICS.find(t => t.id === activeTab)?.description}
          </p>
        </div>
        
        <Separator />

        <div className="flex-1 overflow-hidden">
          {TOPICS.map(topic => (
            <TabsContent key={topic.id} value={topic.id} className="flex-1 h-full mt-0">
              <ScrollArea className="h-full p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-destructive">
                    <p>{error}</p>
                  </div>
                ) : research[topic.id]?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No research information available. Try a different search term.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {research[topic.id]?.map((item, idx) => (
                      <Collapsible 
                        key={idx} 
                        open={expandedItems[item.title]} 
                        onOpenChange={() => toggleItem(item.title)}
                        className="border rounded-lg"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="p-3 cursor-pointer hover:bg-accent rounded-t-lg flex justify-between items-center">
                            <h3 className="font-medium">{item.title}</h3>
                            <span className="text-xs text-muted-foreground">{expandedItems[item.title] ? 'Less' : 'More'}</span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-3 pt-0 text-sm space-y-2">
                          <Separator className="my-2" />
                          <div className="whitespace-pre-wrap">{item.content}</div>
                          {item.source && (
                            <div className="text-xs text-muted-foreground mt-2">
                              <strong>Source:</strong> {item.source}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      <div className="p-3 border-t">
        <p className="text-xs text-center text-muted-foreground">
          Information sourced from peer-reviewed research on recovery principles
        </p>
      </div>
    </div>
  );
}
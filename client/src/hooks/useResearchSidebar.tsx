import { useState, createContext, useContext, ReactNode } from 'react';

interface ResearchSidebarContextType {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const ResearchSidebarContext = createContext<ResearchSidebarContextType | undefined>(undefined);

export function ResearchSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen(prev => !prev);

  return (
    <ResearchSidebarContext.Provider value={{ isOpen, openSidebar, closeSidebar, toggleSidebar }}>
      {children}
    </ResearchSidebarContext.Provider>
  );
}

export function useResearchSidebar() {
  const context = useContext(ResearchSidebarContext);
  if (context === undefined) {
    throw new Error('useResearchSidebar must be used within a ResearchSidebarProvider');
  }
  return context;
}
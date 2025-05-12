import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home,
  UsersRound,
  CheckSquare,
  MessageSquare,
  Settings,
  Menu,
  MapPin,
  Users,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { Sidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: UsersRound, label: "Matches", href: "/matches" },
  { icon: CheckSquare, label: "Challenges", href: "/challenges", badge: false },
  { icon: Users, label: "Group Challenges", href: "/group-challenges" },

  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Settings, label: "Settings", href: "/settings" }
];

export default function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigate and close menu
  const handleNavigation = (href: string) => {
    if (isMobile) {
      closeMobileMenu();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar className="w-0 md:w-64 bg-white shadow-md flex-shrink-0 hidden md:flex flex-col transition-all duration-300">
        <div className="p-4 flex items-center justify-start">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white text-xl font-bold">
            <UsersRound size={20} />
          </div>
          <h1 className="text-xl font-bold text-primary ml-3">ReConnect</h1>
        </div>
        
        <nav className="mt-8 flex-1">
          <ul>
            {navItems.map((item, index) => {
              const isActive = location === item.href;
              return (
                <li key={index} className="mb-2">
                  <Link href={item.href} onClick={() => handleNavigation(item.href)}>
                    <div className={`flex items-center px-6 py-4 rounded-lg group cursor-pointer
                      ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                      <item.icon className="w-6 h-6 text-center" />
                      <span className="ml-3 text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">3</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 mt-auto">
          <div className="flex items-center p-2 rounded-lg">
            {/* User Profile Preview */}
            <div className="w-10 h-10 bg-neutral-200 rounded-full overflow-hidden">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="User avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                  {user?.displayName?.[0] || user?.username?.[0] || '?'}
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.displayName || user?.username}</p>
              <p className="text-xs text-neutral-500">{user?.points || 0} points</p>
            </div>
          </div>
        </div>
      </Sidebar>
      
      {/* Mobile Slide-out Menu */}
      <Sheet open={mobileMenuOpen && isMobile} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px]">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white text-xl font-bold">
                <UsersRound size={20} />
              </div>
              <h1 className="text-xl font-bold text-primary ml-3">ReConnect</h1>
            </SheetTitle>
          </SheetHeader>
          
          <div className="py-4">
            <nav className="flex-1">
              <ul>
                {navItems.map((item, index) => {
                  const isActive = location === item.href;
                  return (
                    <li key={index}>
                      <Link href={item.href} onClick={() => handleNavigation(item.href)}>
                        <div className={`flex items-center px-6 py-4 group cursor-pointer
                          ${isActive ? 'bg-primary/10 text-primary' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                          <item.icon className="w-6 h-6 text-center" />
                          <span className="ml-3 text-sm font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">3</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          
          {/* Mobile User Profile */}
          <div className="p-4 mt-auto border-t">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-neutral-200 rounded-full overflow-hidden">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                    {user?.displayName?.[0] || user?.username?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.displayName || user?.username}</p>
                <p className="text-xs text-neutral-500">{user?.points || 0} points</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center px-4 md:px-6">
          <button 
            className="mr-4 md:hidden text-neutral-600"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-between items-center">
            <h2 className="text-lg font-semibold truncate">
              {location === "/dashboard" && "Dashboard"}
              {location === "/matches" && "Matches"}
              {location === "/challenges" && "Challenges"}
              {location === "/group-challenges" && "Group Challenges"}
              {location === "/meetings" && "Meeting Finder"}
              {location === "/messages" && "Messages"}
              {location === "/settings" && "Settings"}
              {!["/dashboard", "/matches", "/challenges", "/group-challenges", "/meetings", "/messages", "/settings"].includes(location) && (location.substring(1) || "Dashboard")}
            </h2>
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <div className="md:hidden w-8 h-8 bg-neutral-200 rounded-full overflow-hidden">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                    {user?.displayName?.[0] || user?.username?.[0] || '?'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden bg-white border-t fixed bottom-0 left-0 right-0 h-16 flex justify-around items-center px-2 z-10">
          {navItems.slice(0, 5).map((item, index) => { // Show only first 5 nav items in bottom bar
            const isActive = location === item.href;
            return (
              <Link key={index} href={item.href} className={`flex flex-col items-center justify-center ${isActive ? 'text-primary' : 'text-neutral-600'}`}>
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

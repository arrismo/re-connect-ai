import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home,
  UsersRound,
  CheckSquare,
  MessageSquare,
  Award,
  Settings,
  Menu,
  Bell
} from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: UsersRound, label: "Matches", href: "/matches" },
  { icon: CheckSquare, label: "Challenges", href: "/challenges", badge: true },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Award, label: "Achievements", href: "/achievements" },
  { icon: Settings, label: "Settings", href: "/settings" }
];

export default function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        className={`w-20 md:w-64 bg-white shadow-md flex-shrink-0 ${mobileMenuOpen ? 'flex' : 'hidden md:flex'} flex-col transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-center md:justify-start">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white text-xl font-bold">
            <UsersRound size={20} />
          </div>
          <h1 className="text-xl font-bold text-primary ml-3 hidden md:block">SupportMatch</h1>
        </div>
        
        <nav className="mt-8 flex-1">
          <ul>
            {navItems.map((item, index) => {
              const isActive = location === item.href;
              return (
                <li key={index} className="mb-2">
                  <Link href={item.href}>
                    <a className={`flex items-center p-4 md:px-6 rounded-lg group
                      ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                      <item.icon className="w-6 h-6 text-center" />
                      <span className="ml-3 text-sm font-medium hidden md:block">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full hidden md:block">3</span>
                      )}
                    </a>
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
            <div className="ml-3 hidden md:block">
              <p className="text-sm font-medium">{user?.displayName || user?.username}</p>
              <p className="text-xs text-neutral-500">{user?.points || 0} points</p>
            </div>
          </div>
        </div>
      </Sidebar>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center px-4 md:px-6">
          <button 
            className="mr-4 md:hidden text-neutral-600"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-between items-center">
            <h2 className="text-lg font-semibold capitalize">
              {location.substring(1) || "Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
              <button className="text-neutral-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
              </button>
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
      </main>
    </div>
  );
}

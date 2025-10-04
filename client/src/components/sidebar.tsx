import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  QrCode, 
  Home, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Dna,
  Moon,
  Sun,
  Trash2
} from "lucide-react";
import { useLocation } from "wouter";
import GlobalSearch from "@/components/global-search";
import { useTheme } from "@/contexts/theme-context";

interface SidebarProps {
  onNavigate: (page: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'animals', label: 'Animals', icon: QrCode, path: '/animals' },
    { id: 'cages', label: 'Cages', icon: Home, path: '/cages' },
    { id: 'strains', label: 'Strains', icon: Dna, path: '/strains' },
    { id: 'qr-scanner', label: 'QR Scanner', icon: QrCode, path: '/qr-scanner' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
    { id: 'trash', label: 'Trash', icon: Trash2, path: '/trash' },
  ];

  if ((user as any)?.role === 'Success Manager' || (user as any)?.role === 'Admin') {
    menuItems.push({ id: 'users', label: 'User Management', icon: Users, path: '/users' });
  }

  // Admin-only features - full access to everything
  if ((user as any)?.role === 'Admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Settings, path: '/admin' });
  }

  return (
    <div className="w-64 bg-card border-r border-border flex-shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">Lab Management</h1>
        {user && (
          <div className="mt-4 flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={(user as any).profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials((user as any).firstName || undefined, (user as any).lastName || undefined)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground" data-testid="text-user-name">
                {((user as any)?.firstName || (user as any)?.lastName)
                  ? `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim()
                  : (user as any)?.email || 'User'
                }
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-user-role">
                {(user as any).role || 'Employee'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Global Search */}
      <div className="p-4 border-b border-border">
        <GlobalSearch onNavigate={onNavigate} />
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Button
                variant={location === item.path ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onNavigate(item.path)}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </li>
          ))}
          
          <li className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 mr-3" />
              ) : (
                <Moon className="w-4 h-4 mr-3" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </li>
          
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

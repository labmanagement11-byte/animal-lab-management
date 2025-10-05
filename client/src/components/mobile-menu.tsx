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
  Trash2,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/theme-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (page: string) => void;
}

export default function MobileMenu({ open, onOpenChange, onNavigate }: MobileMenuProps) {
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
    { id: 'blank-qr', label: 'Generar QR en Blanco', icon: QrCode, path: '/blank-qr' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
    { id: 'trash', label: 'Trash', icon: Trash2, path: '/trash' },
  ];

  if ((user as any)?.role === 'Success Manager' || (user as any)?.role === 'Admin') {
    menuItems.push({ id: 'users', label: 'User Management', icon: Users, path: '/users' });
  }

  if ((user as any)?.role === 'Admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Settings, path: '/admin' });
  }

  const handleNavigate = (path: string) => {
    onNavigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        
        {user && (
          <>
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={(user as any).profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials((user as any).firstName || undefined, (user as any).lastName || undefined)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {((user as any)?.firstName || (user as any)?.lastName)
                      ? `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim()
                      : (user as any)?.email || 'User'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {(user as any).role || 'Employee'}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        <nav className="px-4 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <li key={item.id}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-between h-12"
                    onClick={() => handleNavigate(item.path)}
                    data-testid={`mobile-menu-${item.id}`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        <Separator className="my-4" />

        <div className="px-4 pb-6 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-12"
            onClick={toggleTheme}
            data-testid="mobile-menu-theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 mr-3" />
            ) : (
              <Moon className="w-5 h-5 mr-3" />
            )}
            <span className="font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="mobile-menu-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

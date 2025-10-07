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
  ChevronRight,
  Languages
} from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/theme-context";
import { useLanguage } from "@/contexts/language-context";
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
  const { language, toggleLanguage, t } = useLanguage();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getDisplayName = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    
    if (email) {
      const localPart = email.split('@')[0];
      const parts = localPart.split(/[._-]/);
      return parts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
    
    return 'Usuario';
  };

  const menuItems = [
    { id: 'dashboard', label: t.nav.dashboard as string, icon: LayoutDashboard, path: '/' },
    { id: 'animals', label: t.nav.animals as string, icon: QrCode, path: '/animals' },
    { id: 'cages', label: t.nav.cages as string, icon: Home, path: '/cages' },
    { id: 'strains', label: t.nav.strains as string, icon: Dna, path: '/strains' },
    { id: 'blank-qr', label: t.nav.blankQr as string, icon: QrCode, path: '/blank-qr' },
    { id: 'reports', label: t.nav.reports as string, icon: FileText, path: '/reports' },
    { id: 'trash', label: t.nav.trash as string, icon: Trash2, path: '/trash' },
  ];

  if ((user as any)?.role === 'Success Manager' || (user as any)?.role === 'Admin') {
    menuItems.push({ id: 'users', label: t.nav.users as string, icon: Users, path: '/users' });
  }

  if ((user as any)?.role === 'Admin') {
    menuItems.push({ id: 'admin', label: t.nav.admin as string, icon: Settings, path: '/admin' });
  }

  const handleNavigate = (path: string) => {
    onNavigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-left">{t.nav.menu}</SheetTitle>
        </SheetHeader>
        
        {user ? (
          <div>
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={(user as any).profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials((user as any).firstName || undefined, (user as any).lastName || undefined)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate" data-testid="text-user-name">
                    {getDisplayName((user as any)?.firstName, (user as any)?.lastName, (user as any)?.email)}
                  </p>
                  <p className="text-sm text-muted-foreground truncate" data-testid="text-user-role">
                    {(user as any).role || 'Employee'}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </div>
        ) : null}

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
            <span className="font-medium">{theme === "dark" ? t.theme.lightMode : t.theme.darkMode}</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start h-12"
            onClick={toggleLanguage}
            data-testid="mobile-menu-language"
          >
            <Languages className="w-5 h-5 mr-3" />
            <span className="font-medium">{language === "en" ? t.theme.spanish : t.theme.english}</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="mobile-menu-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">{t.actions.signOut}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

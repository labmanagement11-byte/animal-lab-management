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
  Languages,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import GlobalSearch from "@/components/global-search";
import { useTheme } from "@/contexts/theme-context";
import { useLanguage } from "@/contexts/language-context";

interface SidebarProps {
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ onNavigate, isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const menuItems = [
    { id: 'dashboard', label: t.nav.dashboard as string, icon: LayoutDashboard, path: '/' },
    { id: 'animals', label: t.nav.animals as string, icon: QrCode, path: '/animals' },
    { id: 'cages', label: t.nav.cages as string, icon: Home, path: '/cages' },
    { id: 'strains', label: t.nav.strains as string, icon: Dna, path: '/strains' },
    { id: 'qr-scanner', label: t.qr.qrCodeScanner as string, icon: QrCode, path: '/qr-scanner' },
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
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}
      
      <div 
        className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar"
      >
        <div className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">{t.nav.labManagement}</h1>
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

        <div className="p-4 border-b border-border">
          <GlobalSearch onNavigate={handleNavigate} />
        </div>

        <nav className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Button
                  variant={location === item.path ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigate(item.path)}
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
                {theme === "dark" ? t.theme.lightMode : t.theme.darkMode}
              </Button>
            </li>
            
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={toggleLanguage}
                data-testid="button-toggle-language"
              >
                <Languages className="w-4 h-4 mr-3" />
                {language === "en" ? t.theme.spanish : t.theme.english}
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
                {t.actions.signOut}
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}

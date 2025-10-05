import { useLocation } from "wouter";
import { LayoutDashboard, QrCode, Home, FileText, Scan, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onNavigate: (path: string) => void;
  onMenuClick: () => void;
}

export default function MobileBottomNav({ onNavigate, onMenuClick }: MobileBottomNavProps) {
  const [location] = useLocation();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, path: '/', label: 'Dashboard' },
    { id: 'animals', icon: QrCode, path: '/animals', label: 'Animals' },
    { id: 'cages', icon: Home, path: '/cages', label: 'Cages' },
    { id: 'scanner', icon: Scan, path: '/qr-scanner', label: 'Scan' },
    { id: 'menu', icon: Menu, path: '#', label: 'Menu', isMenu: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isMenu) {
      onMenuClick();
    } else {
      onNavigate(item.path);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = !item.isMenu && location === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                isActive && "text-primary",
                !isActive && "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`mobile-nav-${item.id}`}
            >
              <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

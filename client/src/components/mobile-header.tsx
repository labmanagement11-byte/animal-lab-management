import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import GlobalSearch from "@/components/global-search";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MobileHeaderProps {
  onMenuClick: () => void;
  onNavigate: (path: string) => void;
}

export default function MobileHeader({ onMenuClick, onNavigate }: MobileHeaderProps) {
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-primary">Lab Manager</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              data-testid="button-mobile-search"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials((user as any)?.firstName, (user as any)?.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="p-4 max-w-[calc(100vw-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Search for animals, cages, and users</DialogDescription>
          </DialogHeader>
          <GlobalSearch onNavigate={(path) => {
            onNavigate(path);
            setShowSearch(false);
          }} />
        </DialogContent>
      </Dialog>
    </>
  );
}

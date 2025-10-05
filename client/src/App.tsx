import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Animals from "@/pages/animals";
import Cages from "@/pages/cages";
import Strains from "@/pages/strains";
import StrainDetail from "@/pages/strain-detail";
import QrScanner from "@/pages/qr-scanner";
import QrCodes from "@/pages/qr-codes";
import HealthAlerts from "@/pages/health-alerts";
import Reports from "@/pages/reports";
import Trash from "@/pages/trash";
import Admin from "@/pages/admin";
import Users from "@/pages/users";
import BlankQr from "@/pages/blank-qr";
import ClaimBlankQr from "@/pages/claim-blank-qr";
import CageQrDetail from "@/pages/cage-qr-detail";
import AnimalQrDetail from "@/pages/animal-qr-detail";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import MobileMenu from "@/components/mobile-menu";
import { useLocation } from "wouter";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { useState } from "react";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar onNavigate={handleNavigate} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - Hidden on desktop */}
        <div className="md:hidden">
          <MobileHeader 
            onMenuClick={() => setMobileMenuOpen(true)} 
            onNavigate={handleNavigate}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/animals" component={Animals} />
            <Route path="/cages" component={Cages} />
            <Route path="/strains/:id" component={StrainDetail} />
            <Route path="/strains" component={Strains} />
            <Route path="/qr-scanner" component={QrScanner} />
            <Route path="/qr-codes" component={QrCodes} />
            <Route path="/health-alerts" component={HealthAlerts} />
            <Route path="/blank-qr" component={BlankQr} />
            <Route path="/reports" component={Reports} />
            <Route path="/trash" component={Trash} />
            <Route path="/admin" component={Admin} />
            <Route path="/users" component={Users} />
            <Route path="/qr/blank/:qrId" component={ClaimBlankQr} />
            <Route path="/qr/cage/:id" component={CageQrDetail} />
            <Route path="/qr/animal/:id" component={AnimalQrDetail} />
            <Route component={NotFound} />
          </Switch>
        </div>

        {/* Mobile Bottom Navigation - Hidden on desktop */}
        <div className="md:hidden">
          <MobileBottomNav 
            onNavigate={handleNavigate}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
        </div>

        {/* Mobile Menu - Only for mobile */}
        <MobileMenu
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

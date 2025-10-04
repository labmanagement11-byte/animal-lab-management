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
import QrScanner from "@/pages/qr-scanner";
import Reports from "@/pages/reports";
import Trash from "@/pages/trash";
import Admin from "@/pages/admin";
import Users from "@/pages/users";
import CageQrDetail from "@/pages/cage-qr-detail";
import AnimalQrDetail from "@/pages/animal-qr-detail";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";
import { useLocation } from "wouter";
import { ThemeProvider } from "@/contexts/theme-context";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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
      <Sidebar onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/animals" component={Animals} />
          <Route path="/cages" component={Cages} />
          <Route path="/strains" component={Strains} />
          <Route path="/qr-scanner" component={QrScanner} />
          <Route path="/reports" component={Reports} />
          <Route path="/trash" component={Trash} />
          <Route path="/admin" component={Admin} />
          <Route path="/users" component={Users} />
          <Route path="/qr/cage/:id" component={CageQrDetail} />
          <Route path="/qr/animal/:id" component={AnimalQrDetail} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

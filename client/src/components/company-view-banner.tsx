import { useCompany } from "@/contexts/company-context";
import { Button } from "@/components/ui/button";
import { Building2, X } from "lucide-react";
import { useLocation } from "wouter";

export default function CompanyViewBanner() {
  const { isInCompanyView, activeCompanyName, exitCompany } = useCompany();
  const [, setLocation] = useLocation();

  if (!isInCompanyView) {
    return null;
  }

  const handleExit = () => {
    exitCompany();
    setLocation('/companies');
  };

  return (
    <div 
      className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white px-4 py-3 shadow-md z-30"
      data-testid="company-view-banner"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-medium">Viewing Company:</span>
            <span className="font-bold text-base" data-testid="text-active-company-name">
              {activeCompanyName}
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExit}
          className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white border-white/30"
          data-testid="button-exit-company-view"
        >
          <X className="w-4 h-4 mr-2" />
          Exit Company View
        </Button>
      </div>
    </div>
  );
}

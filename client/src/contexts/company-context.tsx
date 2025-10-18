import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { queryClient } from '@/lib/queryClient';

interface CompanyContextType {
  activeCompanyId: string | null;
  activeCompanyName: string | null;
  enterCompany: (companyId: string, companyName: string) => void;
  exitCompany: () => void;
  isInCompanyView: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'activeCompany';

interface StoredCompany {
  id: string;
  name: string;
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [activeCompany, setActiveCompany] = useState<StoredCompany | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const enterCompany = (companyId: string, companyName: string) => {
    const company = { id: companyId, name: companyName };
    // Write to sessionStorage FIRST, before invalidating queries
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(company));
    setActiveCompany(company);
    // Now invalidate queries - fetchers will see the updated sessionStorage
    queryClient.invalidateQueries();
  };

  const exitCompany = () => {
    // Remove from sessionStorage FIRST, before invalidating queries
    sessionStorage.removeItem(STORAGE_KEY);
    setActiveCompany(null);
    // Now invalidate queries - fetchers will see sessionStorage is cleared
    queryClient.invalidateQueries();
  };

  const value: CompanyContextType = {
    activeCompanyId: activeCompany?.id || null,
    activeCompanyName: activeCompany?.name || null,
    enterCompany,
    exitCompany,
    isInCompanyView: !!activeCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

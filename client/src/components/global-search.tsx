import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, X, QrCode, Home, User, Calendar, Beaker } from "lucide-react";
import type { Animal, Cage, User as UserType } from "@shared/schema";
import { calculateAge, formatDate } from "@/utils/dateUtils";
import { useLocation } from "wouter";

interface SearchResult {
  id: string;
  type: 'animal' | 'cage' | 'user';
  title: string;
  subtitle: string;
  badge?: string;
  icon: any;
  data: Animal | Cage | UserType;
}

interface GlobalSearchProps {
  onNavigate?: (path: string) => void;
}

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [, setLocation] = useLocation();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: debouncedSearch.length >= 2,
  });

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchTerm("");
    
    if (result.type === 'animal') {
      setLocation('/animals');
    } else if (result.type === 'cage') {
      setLocation('/cages');
    } else if (result.type === 'user') {
      setLocation('/users');
    }
    
    if (onNavigate) {
      if (result.type === 'animal') {
        onNavigate('/animals');
      } else if (result.type === 'cage') {
        onNavigate('/cages');
      } else if (result.type === 'user') {
        onNavigate('/users');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Monitoring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Sick':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Quarantine':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatSearchResult = (item: any, type: string): SearchResult => {
    switch (type) {
      case 'animal':
        return {
          id: item.id,
          type: 'animal',
          title: `Animal ${item.animalNumber}`,
          subtitle: `${item.breed} • ${item.gender || 'Unknown'} • Cage ${item.cage?.cageNumber || 'Unassigned'}`,
          badge: item.healthStatus,
          icon: QrCode,
          data: item
        };
      case 'cage':
        return {
          id: item.id,
          type: 'cage',
          title: `Cage ${item.cageNumber}`,
          subtitle: `${item.location} • Room ${item.roomNumber} • Capacity: ${item.capacity || 'N/A'}`,
          badge: item.isActive === null || item.isActive ? 'Active' : 'Inactive',
          icon: Home,
          data: item
        };
      case 'user':
        return {
          id: item.id,
          type: 'user',
          title: item.firstName && item.lastName 
            ? `${item.firstName} ${item.lastName}` 
            : item.email || 'User',
          subtitle: `${item.role || 'Employee'} • ${item.email}`,
          badge: item.role,
          icon: User,
          data: item
        };
      default:
        return {
          id: item.id,
          type: 'animal',
          title: 'Unknown',
          subtitle: '',
          icon: Search,
          data: item
        };
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search animals, cages, users..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="pl-10 pr-10"
          data-testid="input-global-search"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setSearchTerm("");
              setShowResults(false);
            }}
            data-testid="button-clear-search"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dialog */}
      <Dialog open={showResults && searchTerm.length >= 2} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Search Results</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            )}

            {!isLoading && searchResults && searchResults.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No results found for "{debouncedSearch}"</p>
              </div>
            )}

            {!isLoading && searchResults && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result) => {
                  const IconComponent = result.icon;
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleResultClick(result)}
                      data-testid={`search-result-${result.type}-${result.id}`}
                    >
                      <div className="flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-foreground truncate">
                            {result.title}
                          </p>
                          {result.badge && (
                            <Badge className={getStatusColor(result.badge)}>
                              {result.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
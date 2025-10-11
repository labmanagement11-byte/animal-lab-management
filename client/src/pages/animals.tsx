import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2, Calendar, User, Beaker, Grid, List, Table, LayoutGrid, Square } from "lucide-react";
import AnimalForm from "@/components/animal-form";
import FloatingActionButton from "@/components/floating-action-button";
import type { Animal, User as UserType, Cage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { calculateAge, formatDate } from "@/utils/dateUtils";

export default function Animals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAnimalForm, setShowAnimalForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "small-cards" | "large-cards" | "by-cage">("large-cards");
  const [initialCageId, setInitialCageId] = useState<string | undefined>(undefined);
  const lastAppliedCageIdRef = useRef<string | null>(null);

  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: searchTerm ? ['/api/animals/search', searchTerm] : ['/api/animals'],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/animals/search?q=${encodeURIComponent(searchTerm)}`
        : '/api/animals';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const { data: cages } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const deleteAnimalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/animals/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/animals';
        }
      });
      toast({
        title: "Success",
        description: "Animal deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete animal",
        variant: "destructive",
      });
    },
  });

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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getUserName = (userId: string | null | undefined) => {
    if (!userId || !users) return 'N/A';
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getCageInfo = (cageId: string | null | undefined) => {
    if (!cageId || !cages) return null;
    return cages.find(c => c.id === cageId) || null;
  };

  const getCageDisplay = (cageId: string | null | undefined) => {
    const cage = getCageInfo(cageId);
    return cage ? `${cage.cageNumber} - ${cage.location}` : 'No cage assigned';
  };

  // Group animals by cage for by-cage view
  const animalsByCage = animals?.reduce((acc, animal) => {
    const cageId = animal.cageId || 'unassigned';
    if (!acc[cageId]) {
      acc[cageId] = [];
    }
    acc[cageId].push(animal);
    return acc;
  }, {} as Record<string, Animal[]>) || {};

  const handleEdit = (animal: Animal) => {
    setEditingAnimal(animal);
    setShowAnimalForm(true);
  };

  const handleDelete = (animal: Animal) => {
    if (confirm('Are you sure you want to delete this animal?')) {
      deleteAnimalMutation.mutate(animal.id);
    }
  };

  const handleFormClose = () => {
    setShowAnimalForm(false);
    setEditingAnimal(null);
    setInitialCageId(undefined);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    let queryString = url.search;
    
    if (!queryString && url.hash.includes('?')) {
      queryString = url.hash.substring(url.hash.indexOf('?'));
    }
    
    const urlParams = new URLSearchParams(queryString);
    const cageId = urlParams.get('cageId');
    
    if (cageId && cageId !== lastAppliedCageIdRef.current && !showAnimalForm && !editingAnimal) {
      lastAppliedCageIdRef.current = cageId;
      setInitialCageId(cageId);
      setShowAnimalForm(true);
      
      setLocation('/animals', { replace: true });
    }
  }, [location, showAnimalForm, editingAnimal, setLocation]);

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 pt-1 md:pt-6">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8 pt-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Animals</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2">Manage laboratory animals and their information</p>
      </div>
      
      <div className="flex items-center justify-center mb-4 md:mb-6">
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
              data-testid="button-view-table"
            >
              <Table className="w-4 h-4 mr-2" />
              Table
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === "small-cards" ? "default" : "outline"}
              onClick={() => setViewMode("small-cards")}
              data-testid="button-view-small-cards"
            >
              <Square className="w-4 h-4 mr-2" />
              Small
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === "large-cards" ? "default" : "outline"}
              onClick={() => setViewMode("large-cards")}
              data-testid="button-view-large-cards"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Large
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === "by-cage" ? "default" : "outline"}
              onClick={() => setViewMode("by-cage")}
              data-testid="button-view-by-cage"
            >
              <Grid className="w-4 h-4 mr-2" />
              By Cage
            </Button>
          </div>
          <Button onClick={() => setShowAnimalForm(true)} data-testid="button-add-animal">
            <Plus className="w-4 h-4 mr-2" />
            Add Animal
          </Button>
        </div>
      </div>

      {/* Mobile View Selector */}
      <div className="md:hidden mb-4">
        <Select value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
          <SelectTrigger className="w-full" data-testid="mobile-view-selector">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="table">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                <span>Table View</span>
              </div>
            </SelectItem>
            <SelectItem value="small-cards">
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                <span>Small Cards</span>
              </div>
            </SelectItem>
            <SelectItem value="large-cards">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                <span>Large Cards</span>
              </div>
            </SelectItem>
            <SelectItem value="by-cage">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4" />
                <span>By Cage</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search animals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Animals List */}
      <Card>
        <CardHeader>
          <CardTitle>Animals ({animals?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : animals && animals.length > 0 ? (
            viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-medium">Animal ID</th>
                      <th className="border border-border p-3 text-left font-medium">Strain</th>
                      <th className="border border-border p-3 text-left font-medium">Status</th>
                      <th className="border border-border p-3 text-left font-medium">Age</th>
                      <th className="border border-border p-3 text-left font-medium">Gender</th>
                      <th className="border border-border p-3 text-left font-medium">Cage</th>
                      <th className="border border-border p-3 text-left font-medium">Weight</th>
                      <th className="border border-border p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((animal) => (
                      <tr key={animal.id} className="hover:bg-muted/30 cursor-pointer" data-testid={`table-row-${animal.id}`} onClick={() => setSelectedAnimal(animal)}>
                        <td className="border border-border p-3 font-medium" data-testid={`table-animal-id-${animal.id}`}>
                          {animal.animalNumber}
                        </td>
                        <td className="border border-border p-3">{animal.breed}</td>
                        <td className="border border-border p-3">
                          <Badge className={getStatusColor(animal.healthStatus || 'Healthy')}>
                            {animal.healthStatus || 'Healthy'}
                          </Badge>
                        </td>
                        <td className="border border-border p-3">{calculateAge(animal.dateOfBirth)}</td>
                        <td className="border border-border p-3">{animal.gender || 'N/A'}</td>
                        <td className="border border-border p-3">{getCageDisplay(animal.cageId)}</td>
                        <td className="border border-border p-3">{animal.weight ? `${animal.weight}g` : 'N/A'}</td>
                        <td className="border border-border p-3">
                          <div className="flex items-center space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(animal);
                              }}
                              data-testid={`table-edit-${animal.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(animal);
                              }}
                              disabled={deleteAnimalMutation.isPending}
                              data-testid={`table-delete-${animal.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : viewMode === "small-cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {animals.map((animal) => (
                  <Card key={animal.id} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors" data-testid={`small-card-${animal.id}`} onClick={() => setSelectedAnimal(animal)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground" data-testid={`small-card-id-${animal.id}`}>
                          {animal.animalNumber}
                        </h3>
                        <Badge className={getStatusColor(animal.healthStatus || 'Healthy')}>
                          {animal.healthStatus || 'Healthy'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(animal);
                          }}
                          data-testid={`small-edit-${animal.id}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(animal);
                          }}
                          disabled={deleteAnimalMutation.isPending}
                          data-testid={`small-delete-${animal.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div><span className="font-medium">Strain:</span> {animal.breed}</div>
                      <div><span className="font-medium">Age:</span> {calculateAge(animal.dateOfBirth)}</div>
                      <div><span className="font-medium">Gender:</span> {animal.gender || 'N/A'}</div>
                      <div><span className="font-medium">Cage:</span> {getCageDisplay(animal.cageId)}</div>
                      {animal.genotype && <div><span className="font-medium">Genotype:</span> {animal.genotype}</div>}
                      {animal.probes && (
                        <>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                            <Beaker className="w-2 h-2 mr-1" />
                            Probes
                          </Badge>
                          {animal.allele && animal.allele.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {animal.allele.map((item, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : viewMode === "large-cards" ? (
              <div className="space-y-4">
                {animals.map((animal) => (
                  <Card key={animal.id} className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" data-testid={`large-card-${animal.id}`} onClick={() => setSelectedAnimal(animal)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-lg font-semibold text-foreground" data-testid={`large-card-id-${animal.id}`}>
                            {animal.animalNumber}
                          </h3>
                          <Badge className={getStatusColor(animal.healthStatus || 'Healthy')}>
                            {animal.healthStatus || 'Healthy'}
                          </Badge>
                          {animal.status && animal.status !== 'Active' && (
                            <Badge variant="secondary">
                              {animal.status}
                            </Badge>
                          )}
                          {animal.probes && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                              <Beaker className="w-3 h-3 mr-1" />
                              Probes
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {/* Basic Information */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-muted-foreground">Basic Info</h4>
                            <div className="space-y-1">
                              <div><span className="font-medium">Strain:</span> {animal.breed}</div>
                              <div><span className="font-medium">Genotype:</span> {animal.genotype || 'N/A'}</div>
                              <div><span className="font-medium">Gender:</span> {animal.gender || 'N/A'}</div>
                              <div><span className="font-medium">Color:</span> {animal.color || 'N/A'}</div>
                              <div><span className="font-medium">Generation:</span> {animal.generation || 'N/A'}</div>
                              <div><span className="font-medium">Cage:</span> {getCageDisplay(animal.cageId)}</div>
                            </div>
                          </div>

                          {/* Physical & Age */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-muted-foreground">Physical & Age</h4>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="font-medium">DOB:</span> 
                                {formatDate(animal.dateOfBirth)}
                              </div>
                              <div><span className="font-medium">Age:</span> {calculateAge(animal.dateOfBirth)}</div>
                              <div><span className="font-medium">Weight:</span> {animal.weight ? `${animal.weight}g` : 'N/A'}</div>
                            </div>
                          </div>

                          {/* Research Data */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-muted-foreground">Research Data</h4>
                            <div className="space-y-1">
                              <div><span className="font-medium">Protocol:</span> {animal.protocol || 'N/A'}</div>
                              <div><span className="font-medium">Breeding Start:</span> {formatDate(animal.breedingStartDate)}</div>
                              <div><span className="font-medium">DOG:</span> {formatDate(animal.dateOfGenotyping)}</div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="font-medium">Genotyping User:</span> 
                                {getUserName(animal.genotypingUserId)}
                              </div>
                              {animal.probeType && (
                                <div><span className="font-medium">Probe Type:</span> {animal.probeType}</div>
                              )}
                              {animal.allele && animal.allele.length > 0 && (
                                <div>
                                  <span className="font-medium">Allele:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {animal.allele.map((item, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {(animal.diseases || animal.notes) && (
                          <div className="mt-4 pt-3 border-t border-border">
                            {animal.diseases && (
                              <div className="mb-2">
                                <span className="font-medium text-muted-foreground">Diseases:</span>
                                <p className="text-sm mt-1">{animal.diseases}</p>
                              </div>
                            )}
                            {animal.notes && (
                              <div>
                                <span className="font-medium text-muted-foreground">Notes:</span>
                                <p className="text-sm mt-1">{animal.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(animal);
                          }}
                          data-testid={`large-edit-${animal.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(animal);
                          }}
                          disabled={deleteAnimalMutation.isPending}
                          data-testid={`large-delete-${animal.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(animalsByCage).map(([cageId, cageAnimals]) => {
                  const cageInfo = cageId === 'unassigned' ? null : getCageInfo(cageId);
                  const cageTitle = cageId === 'unassigned' 
                    ? 'Unassigned Animals' 
                    : cageInfo 
                      ? `${cageInfo.cageNumber} - ${cageInfo.location}`
                      : `Cage ${cageId}`;
                  
                  return (
                    <Card key={cageId} className="p-4" data-testid={`cage-group-${cageId}`}>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Grid className="w-4 h-4" />
                          {cageTitle}
                          <Badge variant="secondary">{cageAnimals.length} animal{cageAnimals.length !== 1 ? 's' : ''}</Badge>
                        </h3>
                        {cageInfo && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Capacity: {cageInfo.capacity} | Status: {cageInfo.status || 'Active'}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cageAnimals.map((animal) => (
                          <Card key={animal.id} className="p-3 bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors" data-testid={`compact-animal-${animal.id}`} onClick={() => setSelectedAnimal(animal)}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground" data-testid={`compact-animal-id-${animal.id}`}>
                                  {animal.animalNumber}
                                </h4>
                                <Badge className={getStatusColor(animal.healthStatus || 'Healthy')}>
                                  {animal.healthStatus || 'Healthy'}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(animal);
                                  }}
                                  data-testid={`compact-edit-${animal.id}`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(animal);
                                  }}
                                  disabled={deleteAnimalMutation.isPending}
                                  data-testid={`compact-delete-${animal.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-xs space-y-1">
                              <div><span className="font-medium">Breed:</span> {animal.breed}</div>
                              <div><span className="font-medium">Age:</span> {calculateAge(animal.dateOfBirth)}</div>
                              <div><span className="font-medium">Gender:</span> {animal.gender || 'N/A'}</div>
                              <div><span className="font-medium">Weight:</span> {animal.weight ? `${animal.weight}g` : 'N/A'}</div>
                              {animal.genotype && <div><span className="font-medium">Genotype:</span> {animal.genotype}</div>}
                              {animal.probes && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                  <Beaker className="w-2 h-2 mr-1" />
                                  Probes
                                </Badge>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-animals">
                {searchTerm ? 'No animals found matching your search.' : 'No animals found. Add your first animal to get started.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button - Mobile Only */}
      <FloatingActionButton 
        onClick={() => setShowAnimalForm(true)}
        label="Add Animal"
      />

      {/* Animal Form Modal */}
      <Dialog open={showAnimalForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <AnimalForm 
            animal={editingAnimal}
            onClose={handleFormClose}
            initialCageId={initialCageId}
          />
        </DialogContent>
      </Dialog>

      {/* Animal Detail Modal */}
      <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogTitle className="sr-only">Animal Details</DialogTitle>
          {selectedAnimal && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="detail-animal-number">
                    {selectedAnimal.animalNumber}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getStatusColor(selectedAnimal.healthStatus || 'Healthy')}>
                      {selectedAnimal.healthStatus || 'Healthy'}
                    </Badge>
                    {selectedAnimal.status && selectedAnimal.status !== 'Active' && (
                      <Badge variant="secondary">
                        {selectedAnimal.status}
                      </Badge>
                    )}
                    {selectedAnimal.probes && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        <Beaker className="w-3 h-3 mr-1" />
                        Probes
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      handleEdit(selectedAnimal);
                      setSelectedAnimal(null);
                    }}
                    data-testid="button-edit-from-detail"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedAnimal);
                      setSelectedAnimal(null);
                    }}
                    data-testid="button-delete-from-detail"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-foreground">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-muted-foreground">Strain:</span> {selectedAnimal.breed}</div>
                    <div><span className="font-medium text-muted-foreground">Genotype:</span> {selectedAnimal.genotype || 'N/A'}</div>
                    <div><span className="font-medium text-muted-foreground">Gender:</span> {selectedAnimal.gender || 'N/A'}</div>
                    <div><span className="font-medium text-muted-foreground">Color:</span> {selectedAnimal.color || 'N/A'}</div>
                    <div><span className="font-medium text-muted-foreground">Generation:</span> {selectedAnimal.generation || 'N/A'}</div>
                    <div><span className="font-medium text-muted-foreground">Cage:</span> {getCageDisplay(selectedAnimal.cageId)}</div>
                  </div>
                </Card>

                {/* Physical & Age Information */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-foreground">Physical & Age</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">Date of Birth:</span> 
                      <span>{formatDate(selectedAnimal.dateOfBirth)}</span>
                    </div>
                    <div><span className="font-medium text-muted-foreground">Age:</span> {calculateAge(selectedAnimal.dateOfBirth)}</div>
                    <div><span className="font-medium text-muted-foreground">Weight:</span> {selectedAnimal.weight ? `${selectedAnimal.weight}g` : 'N/A'}</div>
                  </div>
                </Card>

                {/* Research Data */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-foreground">Research Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-muted-foreground">Protocol:</span> {selectedAnimal.protocol || 'N/A'}</div>
                    <div><span className="font-medium text-muted-foreground">Breeding Start:</span> {formatDate(selectedAnimal.breedingStartDate)}</div>
                    <div><span className="font-medium text-muted-foreground">Date of Genotyping (DOG):</span> {formatDate(selectedAnimal.dateOfGenotyping)}</div>
                    <div className="flex items-start gap-1">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium text-muted-foreground">Genotyping User:</span> 
                        <div>{getUserName(selectedAnimal.genotypingUserId)}</div>
                      </div>
                    </div>
                    {selectedAnimal.probeType && (
                      <div><span className="font-medium text-muted-foreground">Probe Type:</span> {selectedAnimal.probeType}</div>
                    )}
                    {selectedAnimal.allele && selectedAnimal.allele.length > 0 && (
                      <div>
                        <span className="font-medium text-muted-foreground">Allele:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedAnimal.allele.map((item, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-allele-${idx}`}>
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Health & Notes */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-foreground">Health & Notes</h3>
                  <div className="space-y-3 text-sm">
                    {selectedAnimal.diseases && (
                      <div>
                        <span className="font-medium text-muted-foreground">Diseases:</span>
                        <p className="mt-1 text-foreground">{selectedAnimal.diseases}</p>
                      </div>
                    )}
                    {selectedAnimal.notes && (
                      <div>
                        <span className="font-medium text-muted-foreground">Notes:</span>
                        <p className="mt-1 text-foreground">{selectedAnimal.notes}</p>
                      </div>
                    )}
                    {!selectedAnimal.diseases && !selectedAnimal.notes && (
                      <p className="text-muted-foreground">No health issues or notes recorded.</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

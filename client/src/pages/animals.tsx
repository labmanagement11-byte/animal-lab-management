import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Eye, Edit, Trash2, QrCode, Calendar, User, Beaker, Grid, List } from "lucide-react";
import AnimalForm from "@/components/animal-form";
import QrCodeGenerator from "@/components/qr-code-generator";
import type { Animal, User as UserType, Cage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { calculateAge, formatDate } from "@/utils/dateUtils";

export default function Animals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAnimalForm, setShowAnimalForm] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [viewMode, setViewMode] = useState<"individual" | "by-cage">("individual");

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
      await apiRequest("DELETE", `/api/animals/${id}`);
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

  const handleGenerateQr = (animal: Animal) => {
    setSelectedAnimal(animal);
    setShowQrGenerator(true);
  };

  const handleDelete = (animal: Animal) => {
    if (confirm('Are you sure you want to delete this animal?')) {
      deleteAnimalMutation.mutate(animal.id);
    }
  };

  const handleFormClose = () => {
    setShowAnimalForm(false);
    setEditingAnimal(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Animals</h2>
          <p className="text-muted-foreground">Manage laboratory animals and their information</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={viewMode === "individual" ? "default" : "outline"}
              onClick={() => setViewMode("individual")}
              data-testid="button-view-individual"
            >
              <List className="w-4 h-4 mr-2" />
              Individual
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

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search animals by ID, breed, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

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
            viewMode === "individual" ? (
              <div className="space-y-4">
                {animals.map((animal) => (
                  <Card key={animal.id} className="p-4" data-testid={`card-animal-${animal.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-lg font-semibold text-foreground" data-testid={`text-animal-id-${animal.id}`}>
                            {animal.animalNumber}
                          </h3>
                          <Badge className={getStatusColor(animal.healthStatus || 'Healthy')}>
                            {animal.healthStatus || 'Healthy'}
                          </Badge>
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
                              <div><span className="font-medium">Breed:</span> {animal.breed}</div>
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
                          onClick={() => handleEdit(animal)}
                          data-testid={`button-edit-${animal.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleGenerateQr(animal)}
                          data-testid={`button-qr-${animal.id}`}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDelete(animal)}
                          disabled={deleteAnimalMutation.isPending}
                          data-testid={`button-delete-${animal.id}`}
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
                            Capacity: {cageInfo.capacity} | Type: {cageInfo.cageType}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cageAnimals.map((animal) => (
                          <Card key={animal.id} className="p-3 bg-accent/30" data-testid={`compact-animal-${animal.id}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground" data-testid={`compact-animal-id-${animal.id}`}>
                                  {animal.animalNumber}
                                </h4>
                                <Badge size="sm" className={getStatusColor(animal.healthStatus || 'Healthy')}>
                                  {animal.healthStatus || 'Healthy'}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleEdit(animal)}
                                  data-testid={`compact-edit-${animal.id}`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleGenerateQr(animal)}
                                  data-testid={`compact-qr-${animal.id}`}
                                >
                                  <QrCode className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDelete(animal)}
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
                                <Badge variant="outline" size="sm" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
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

      {/* Animal Form Modal */}
      <Dialog open={showAnimalForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl">
          <AnimalForm 
            animal={editingAnimal}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* QR Code Generator Modal */}
      <Dialog open={showQrGenerator} onOpenChange={setShowQrGenerator}>
        <DialogContent>
          {selectedAnimal && (
            <QrCodeGenerator 
              animal={selectedAnimal}
              onClose={() => setShowQrGenerator(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

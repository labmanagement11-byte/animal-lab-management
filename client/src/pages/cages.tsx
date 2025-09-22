import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Home, MapPin, QrCode, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Cage, Animal, Strain } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import CageQrCodeGenerator from "@/components/cage-qr-code-generator";

const cageFormSchema = z.object({
  cageNumber: z.string().min(1, "Cage number is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  location: z.string().min(1, "Location is required"),
  capacity: z.string().min(1, "Capacity is required"),
  status: z.enum(['Active', 'Breeding', 'Holding']).default('Active'),
  strainId: z.string().optional(),
});

type CageFormData = z.infer<typeof cageFormSchema>;

export default function Cages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCageForm, setShowCageForm] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [editingCage, setEditingCage] = useState<Cage | null>(null);
  const [selectedCage, setSelectedCage] = useState<Cage | null>(null);
  const [expandedCages, setExpandedCages] = useState<Set<string>>(new Set());

  const { data: cages, isLoading } = useQuery<Cage[]>({
    queryKey: searchTerm ? ['/api/cages/search', searchTerm] : ['/api/cages'],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/cages/search?q=${encodeURIComponent(searchTerm)}`
        : '/api/cages';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
  });

  const { data: strains } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  const form = useForm<CageFormData>({
    resolver: zodResolver(cageFormSchema),
    defaultValues: {
      cageNumber: editingCage?.cageNumber || "",
      roomNumber: editingCage?.roomNumber || "",
      location: editingCage?.location || "",
      capacity: editingCage?.capacity?.toString() || "",
      status: editingCage?.status || "Active",
      strainId: editingCage?.strainId || undefined,
    },
  });

  const createCageMutation = useMutation({
    mutationFn: async (data: CageFormData) => {
      const payload = {
        ...data,
        capacity: parseInt(data.capacity),
        strainId: data.strainId === "" || data.strainId === "none" ? undefined : data.strainId,
      };
      await apiRequest("POST", "/api/cages", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/cages';
        }
      });
      toast({
        title: "Success",
        description: "Cage created successfully",
      });
      handleCloseForm();
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
        description: "Failed to create cage",
        variant: "destructive",
      });
    },
  });

  const updateCageMutation = useMutation({
    mutationFn: async (data: CageFormData) => {
      const payload = {
        ...data,
        capacity: parseInt(data.capacity),
        strainId: data.strainId === "" || data.strainId === "none" ? undefined : data.strainId,
      };
      await apiRequest("PUT", `/api/cages/${editingCage!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/cages';
        }
      });
      toast({
        title: "Success",
        description: "Cage updated successfully",
      });
      handleCloseForm();
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
        description: "Failed to update cage",
        variant: "destructive",
      });
    },
  });

  const deleteCageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/cages';
        }
      });
      toast({
        title: "Success",
        description: "Cage deleted successfully",
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
        description: "Failed to delete cage",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (cage: Cage) => {
    setEditingCage(cage);
    form.reset({
      cageNumber: cage.cageNumber,
      roomNumber: cage.roomNumber,
      location: cage.location,
      capacity: cage.capacity?.toString() || "",
      status: cage.status || "Active",
      strainId: cage.strainId || undefined,
    });
    setShowCageForm(true);
  };

  const handleGenerateQr = (cage: Cage) => {
    setSelectedCage(cage);
    setShowQrGenerator(true);
  };

  const handleCloseForm = () => {
    setShowCageForm(false);
    setEditingCage(null);
    form.reset({
      cageNumber: "",
      roomNumber: "",
      location: "",
      capacity: "",
      status: "Active",
      strainId: undefined,
    });
  };

  const onSubmit = (data: CageFormData) => {
    if (editingCage) {
      updateCageMutation.mutate(data);
    } else {
      createCageMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200';
      case 'Breeding':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200';
      case 'Holding':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
    }
  };

  const getHealthStatusColor = (status: string) => {
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

  const getAnimalsInCage = (cageId: string) => {
    if (!animals) return [];
    return animals.filter(animal => animal.cageId === cageId);
  };

  const toggleCageExpansion = (cageId: string) => {
    const newExpanded = new Set(expandedCages);
    if (newExpanded.has(cageId)) {
      newExpanded.delete(cageId);
    } else {
      newExpanded.add(cageId);
    }
    setExpandedCages(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Cage Management</h2>
          <p className="text-muted-foreground mt-1">Manage laboratory animal housing</p>
        </div>
        <Button onClick={() => setShowCageForm(true)} data-testid="button-add-cage">
          <Plus className="w-4 h-4 mr-2" />
          Add Cage
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-cages"
          />
        </div>
      </div>

      {/* Cages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cages?.map((cage) => (
          <Card key={cage.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Cage {cage.cageNumber}
                </CardTitle>
                <Badge className={getStatusColor(cage.status || 'Active')}>
                  {cage.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground">Room:</span>
                  <span className="ml-2 font-medium" data-testid={`text-room-${cage.id}`}>{cage.roomNumber}</span>
                </div>

                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-2 font-medium" data-testid={`text-location-${cage.id}`}>{cage.location}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="ml-2 font-medium" data-testid={`text-capacity-${cage.id}`}>{cage.capacity || 'N/A'} animals</span>
                </div>

                {/* Animals Section */}
                {!isLoadingAnimals && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Animals:</span>
                        <span className="font-medium" data-testid={`text-animal-count-${cage.id}`}>
                          {getAnimalsInCage(cage.id).length}
                        </span>
                        <span className="text-muted-foreground">
                          / {cage.capacity || '∞'}
                        </span>
                      </div>
                      {getAnimalsInCage(cage.id).length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCageExpansion(cage.id)}
                          data-testid={`button-toggle-animals-${cage.id}`}
                        >
                          {expandedCages.has(cage.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Expanded Animal List with Detailed Information */}
                    {expandedCages.has(cage.id) && getAnimalsInCage(cage.id).length > 0 && (
                      <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Animals in this cage:
                        </h4>
                        <div className="space-y-3">
                          {getAnimalsInCage(cage.id).map((animal) => (
                            <div
                              key={animal.id}
                              className="bg-background rounded-lg p-3 border border-border shadow-sm"
                              data-testid={`animal-in-cage-${animal.id}`}
                            >
                              {/* Animal Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-base" data-testid={`animal-number-${animal.id}`}>
                                    {animal.animalNumber}
                                  </span>
                                  <Badge className={getHealthStatusColor(animal.healthStatus || 'Healthy')}>
                                    {animal.healthStatus || 'Healthy'}
                                  </Badge>
                                  {animal.status && animal.status !== 'Active' && (
                                    <Badge variant="secondary" className="text-xs">
                                      {animal.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Animal Details Grid */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {/* Basic Information */}
                                <div className="space-y-1">
                                  <div className="text-muted-foreground font-medium">Basic Info</div>
                                  <div><span className="text-muted-foreground">Strain:</span> {animal.breed}</div>
                                  {animal.gender && <div><span className="text-muted-foreground">Gender:</span> {animal.gender}</div>}
                                  {animal.weight && <div><span className="text-muted-foreground">Weight:</span> {animal.weight}g</div>}
                                  {animal.color && <div><span className="text-muted-foreground">Color:</span> {animal.color}</div>}
                                  {animal.generation && <div><span className="text-muted-foreground">Generation:</span> {animal.generation}</div>}
                                </div>

                                {/* Dates and Times */}
                                <div className="space-y-1">
                                  <div className="text-muted-foreground font-medium">Dates & Times</div>
                                  {animal.dateOfBirth && (
                                    <div><span className="text-muted-foreground">Birth Date:</span> {new Date(animal.dateOfBirth).toLocaleDateString()}</div>
                                  )}
                                  {animal.age && (
                                    <div><span className="text-muted-foreground">Age:</span> {animal.age} weeks</div>
                                  )}
                                  {animal.breedingStartDate && (
                                    <div><span className="text-muted-foreground">Breeding Start:</span> {new Date(animal.breedingStartDate).toLocaleDateString()}</div>
                                  )}
                                  {animal.dateOfGenotyping && (
                                    <div><span className="text-muted-foreground">Genotyping Date:</span> {new Date(animal.dateOfGenotyping).toLocaleDateString()}</div>
                                  )}
                                  {animal.createdAt && (
                                    <div><span className="text-muted-foreground">Added:</span> {new Date(animal.createdAt).toLocaleDateString()}</div>
                                  )}
                                </div>
                              </div>

                              {/* Health and Disease Information */}
                              {(animal.diseases || animal.notes) && (
                                <div className="mt-3 pt-2 border-t border-border space-y-2">
                                  {animal.diseases && (
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Diseases/Conditions:</div>
                                      <div className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded">
                                        {animal.diseases}
                                      </div>
                                    </div>
                                  )}
                                  {animal.notes && (
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Notes:</div>
                                      <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-2 rounded">
                                        {animal.notes}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Additional Information */}
                              {(animal.genotype || animal.protocol) && (
                                <div className="mt-2 pt-2 border-t border-border">
                                  <div className="text-xs space-y-1">
                                    {animal.genotype && (
                                      <div><span className="text-muted-foreground">Genotype:</span> {animal.genotype}</div>
                                    )}
                                    {animal.protocol && (
                                      <div><span className="text-muted-foreground">Protocol:</span> {animal.protocol}</div>
                                    )}
                                    {animal.probes && (
                                      <div><span className="text-muted-foreground">Probes:</span> Yes</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty cage message */}
                    {getAnimalsInCage(cage.id).length === 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2" data-testid={`empty-cage-${cage.id}`}>
                        No animals currently assigned to this cage
                      </div>
                    )}
                  </div>
                )}

                {/* Loading state for animals */}
                {isLoadingAnimals && (
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Loading animals...</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleEdit(cage)}
                    data-testid={`button-edit-${cage.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleGenerateQr(cage)}
                    data-testid={`button-qr-${cage.id}`}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => deleteCageMutation.mutate(cage.id)}
                    disabled={deleteCageMutation.isPending}
                    data-testid={`button-delete-${cage.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {cages?.length === 0 && (
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No cages found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No cages match your search criteria." : "Get started by adding your first cage."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCageForm(true)} data-testid="button-add-first-cage">
              <Plus className="w-4 h-4 mr-2" />
              Add First Cage
            </Button>
          )}
        </div>
      )}

      {/* Cage Form Modal */}
      <Dialog open={showCageForm} onOpenChange={setShowCageForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCage ? 'Edit Cage' : 'Add New Cage'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cageNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cage Number</FormLabel>
                    <FormControl>
                      <Input placeholder="C-001" {...field} data-testid="input-cage-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Room A" {...field} data-testid="input-room-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Rack 1, Shelf 2" {...field} data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (number of animals)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} data-testid="input-capacity" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} data-testid="select-cage-status">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active (Green)</SelectItem>
                        <SelectItem value="Breeding">Breeding (Blue)</SelectItem>
                        <SelectItem value="Holding">Holding (Purple)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strain (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} data-testid="select-cage-strain">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select strain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No strain selected</SelectItem>
                        {strains?.map((strain) => (
                          <SelectItem key={strain.id} value={strain.id}>
                            {strain.name}
                            {strain.category && <span className="text-muted-foreground"> ({strain.category})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseForm}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCageMutation.isPending || updateCageMutation.isPending}
                  data-testid="button-submit-cage"
                >
                  {(createCageMutation.isPending || updateCageMutation.isPending) 
                    ? 'Saving...' 
                    : (editingCage ? 'Update Cage' : 'Add Cage')
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cage QR Code Generator Modal */}
      <Dialog open={showQrGenerator} onOpenChange={setShowQrGenerator}>
        <DialogContent className="max-w-2xl">
          {selectedCage && (
            <CageQrCodeGenerator 
              cage={selectedCage}
              onClose={() => setShowQrGenerator(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Home, Calendar, Thermometer, AlertCircle, FileText, QrCode, Dna, Activity } from "lucide-react";
import type { Animal, Cage } from "@shared/schema";

export default function AnimalQrDetail() {
  const params = useParams();
  const animalId = params.id;

  // Fetch animal details
  const { data: animal, isLoading: isLoadingAnimal } = useQuery<Animal>({
    queryKey: ['/api/animals', animalId],
    queryFn: async () => {
      const response = await fetch(`/api/animals/${animalId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!animalId,
  });

  // Fetch cage details if animal has a cage
  const { data: cage } = useQuery<Cage>({
    queryKey: ['/api/cages', animal?.cageId],
    queryFn: async () => {
      const response = await fetch(`/api/cages/${animal?.cageId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!animal?.cageId,
  });

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

  if (isLoadingAnimal) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading animal details...</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Animal Not Found</h1>
          <p className="text-muted-foreground">The requested animal could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-animal-qr-title">
                Animal {animal.animalNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                Laboratory Animal Management System
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Animal Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Animal Overview
              <Badge className={getHealthStatusColor(animal.healthStatus || 'Healthy')}>
                {animal.healthStatus || 'Healthy'}
              </Badge>
              {animal.status && animal.status !== 'Active' && (
                <Badge variant="secondary" className="text-xs">
                  {animal.status}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Animal ID:</span>
                      <span className="font-medium" data-testid="text-animal-id">{animal.animalNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Strain:</span>
                      <span className="font-medium">{animal.breed}</span>
                    </div>
                    {animal.gender && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium">{animal.gender}</span>
                      </div>
                    )}
                    {animal.weight && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="font-medium">{animal.weight}g</span>
                      </div>
                    )}
                    {animal.color && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Color:</span>
                        <span className="font-medium">{animal.color}</span>
                      </div>
                    )}
                    {animal.generation && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Generation:</span>
                        <span className="font-medium">{animal.generation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates and Status */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Dates & Timeline</h3>
                  <div className="space-y-2">
                    {animal.dateOfBirth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Birth Date:</span>
                        <span className="font-medium">{new Date(animal.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                    {animal.age && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{animal.age} weeks</span>
                      </div>
                    )}
                    {animal.breedingStartDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Breeding Start:</span>
                        <span className="font-medium">{new Date(animal.breedingStartDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {animal.dateOfGenotyping && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Genotyping Date:</span>
                        <span className="font-medium">{new Date(animal.dateOfGenotyping).toLocaleDateString()}</span>
                      </div>
                    )}
                    {animal.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Added to System:</span>
                        <span className="font-medium">{new Date(animal.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Housing Information */}
        {animal.cageId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Housing Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cage ID:</span>
                  <span className="font-medium" data-testid="text-cage-id">{animal.cageId}</span>
                </div>
                {cage && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cage Number:</span>
                      <span className="font-medium">{cage.cageNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">{cage.roomNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{cage.location}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Genetic Information */}
        {(animal.genotype || animal.protocol) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="w-5 h-5" />
                Genetic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {animal.genotype && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Genotype:</span>
                    <span className="font-medium font-mono text-sm">{animal.genotype}</span>
                  </div>
                )}
                {animal.protocol && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocol:</span>
                    <span className="font-medium">{animal.protocol}</span>
                  </div>
                )}
                {animal.probes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Probes:</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health and Disease Information */}
        {(animal.diseases || animal.notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Health Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {animal.diseases && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-red-700 dark:text-red-300">Diseases/Conditions</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
                    {animal.diseases}
                  </div>
                </div>
              )}
              {animal.notes && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">Notes</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg">
                    {animal.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-muted-foreground">
          <p>Laboratory Animal Management System</p>
          <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
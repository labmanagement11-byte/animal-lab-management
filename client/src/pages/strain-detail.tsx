import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Beaker, Box, Users } from "lucide-react";
import type { Strain, Cage, Animal } from "@shared/schema";
import { formatDate } from "@/utils/dateUtils";

export default function StrainDetail() {
  const [, params] = useRoute("/strains/:id");
  const [, setLocation] = useLocation();
  const strainId = params?.id;

  const { data: strains, isLoading: strainsLoading } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  const { data: cages, isLoading: cagesLoading } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const { data: animals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
  });

  const strain = strains?.find(s => s.id === strainId);
  const strainCages = cages?.filter(c => c.strainId === strainId && !c.deletedAt) || [];
  const strainAnimals = animals?.filter(a => {
    const animalCage = cages?.find(c => c.id === a.cageId);
    return animalCage?.strainId === strainId && !a.deletedAt;
  }) || [];

  const isLoading = strainsLoading || cagesLoading || animalsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-40 bg-muted rounded"></div>
          <div className="h-60 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!strain) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Beaker className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Cepa no encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              La cepa que buscas no existe o fue eliminada
            </p>
            <Button onClick={() => setLocation('/strains')}>
              Volver a Cepas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/strains')}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Cepas
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Beaker className="w-7 h-7 md:w-8 md:h-8" />
              {strain.name}
            </h1>
            {strain.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {strain.description}
              </p>
            )}
          </div>
          <Badge variant={strain.isActive ? "default" : "secondary"} data-testid="badge-status">
            {strain.isActive ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jaulas</p>
                <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-total-cages">
                  {strainCages.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Animales</p>
                <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-total-animals">
                  {strainAnimals.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jaulas Activas</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {strainCages.filter(c => c.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Jaulas con esta Cepa ({strainCages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {strainCages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Número</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sala</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ubicación</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Capacidad</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Animales</th>
                  </tr>
                </thead>
                <tbody>
                  {strainCages.map((cage) => {
                    const cageAnimals = animals?.filter(a => a.cageId === cage.id && !a.deletedAt) || [];
                    return (
                      <tr 
                        key={cage.id} 
                        className="border-b border-border hover:bg-accent/50 cursor-pointer"
                        onClick={() => setLocation(`/qr/cage/${cage.id}`)}
                        data-testid={`row-cage-${cage.id}`}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">{cage.cageNumber}</td>
                        <td className="py-3 px-4 text-foreground">{cage.roomNumber}</td>
                        <td className="py-3 px-4 text-foreground">{cage.location || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">{cage.capacity}</td>
                        <td className="py-3 px-4">
                          <Badge variant={cage.isActive ? "default" : "secondary"}>
                            {cage.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground">{cageAnimals.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Box className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay jaulas con esta cepa</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Animals */}
      <Card>
        <CardHeader>
          <CardTitle>Animales con esta Cepa ({strainAnimals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {strainAnimals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID Animal</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Jaula</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Género</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Peso</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado de Salud</th>
                  </tr>
                </thead>
                <tbody>
                  {strainAnimals.map((animal) => {
                    const cage = cages?.find(c => c.id === animal.cageId);
                    return (
                      <tr 
                        key={animal.id} 
                        className="border-b border-border hover:bg-accent/50 cursor-pointer"
                        onClick={() => setLocation(`/qr/animal/${animal.id}`)}
                        data-testid={`row-animal-${animal.id}`}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">{animal.animalNumber}</td>
                        <td className="py-3 px-4 text-foreground">{cage?.cageNumber || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">{animal.gender || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">
                          {animal.weight ? `${animal.weight}g` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getHealthStatusColor(animal.healthStatus || 'Healthy')}>
                            {animal.healthStatus || 'Healthy'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay animales con esta cepa</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

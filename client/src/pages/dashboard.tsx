import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, QrCodeIcon, Eye, Edit, QrCode as QrCodeLucide, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import AnimalForm from "@/components/animal-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FloatingActionButton from "@/components/floating-action-button";
import type { Animal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DashboardStats {
  totalAnimals: number;
  activeCages: number;
  qrCodes: number;
  healthAlerts: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAnimalForm, setShowAnimalForm] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: animals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
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

  if (statsLoading || animalsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 md:p-6 min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(/attached_assets/0b47e439-4a5b-47c4-b4c2-ea206254a130_1759679399654.jpg)`
      }}
    >
      {/* Overlay para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 -z-10"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-white dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-100 dark:text-gray-100 hidden md:block">Manage your laboratory animals and cages</p>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Button 
            onClick={() => setShowAnimalForm(true)}
            data-testid="button-add-animal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Animal
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Horizontal scroll on mobile */}
      <div className="mb-6 md:mb-8 relative z-10">
        <div className="md:hidden mb-4">
          <h3 className="text-sm font-semibold text-white px-1">Statistics</h3>
        </div>
        <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6">
          <div className="flex md:contents gap-4 overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
            <Card 
              className="flex-shrink-0 w-72 md:w-auto snap-center cursor-pointer hover:shadow-lg transition-shadow bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm" 
              onClick={() => setLocation('/animals')}
              data-testid="card-total-animals"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Animals</p>
                    <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-total-animals">
                      {stats?.totalAnimals || 0}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-500">Active</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <QrCodeIcon className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="flex-shrink-0 w-72 md:w-auto snap-center cursor-pointer hover:shadow-lg transition-shadow bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
              onClick={() => setLocation('/cages')}
              data-testid="card-active-cages"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Cages</p>
                    <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-active-cages">
                      {stats?.activeCages || 0}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">In use</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center">
                    <QrCodeIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="flex-shrink-0 w-72 md:w-auto snap-center cursor-pointer hover:shadow-lg transition-shadow bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
              onClick={() => setLocation('/qr-codes')}
              data-testid="card-qr-codes"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">QR Codes</p>
                    <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-qr-codes">
                      {stats?.qrCodes || 0}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Generated</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center">
                    <QrCodeLucide className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="flex-shrink-0 w-72 md:w-auto snap-center cursor-pointer hover:shadow-lg transition-shadow bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
              onClick={() => setLocation('/health-alerts')}
              data-testid="card-health-alerts"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Health Alerts</p>
                    <p className="text-3xl font-bold text-destructive mt-2" data-testid="text-health-alerts">
                      {stats?.healthAlerts || 0}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-orange-500">Attention</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center">
                    <QrCodeIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Recent Animals */}
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm relative z-10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg md:text-xl">Recent Animals</CardTitle>
          <Button variant="outline" size="sm" data-testid="button-view-all-animals">
            <span className="hidden md:inline">View All</span>
            <span className="md:hidden">All</span>
          </Button>
        </CardHeader>
        <CardContent>
          {animals && animals.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cage</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Breed</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Weight</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.slice(0, 10).map((animal) => (
                      <tr key={animal.id} className="border-b border-border hover:bg-accent/50" data-testid={`row-animal-${animal.id}`}>
                        <td className="py-3 px-4 font-medium text-foreground" data-testid={`text-animal-id-${animal.id}`}>
                          {animal.animalNumber}
                        </td>
                        <td className="py-3 px-4 text-foreground" data-testid={`text-cage-id-${animal.id}`}>
                          {(animal as any).cageNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-foreground" data-testid={`text-breed-${animal.id}`}>
                          {animal.breed}
                        </td>
                        <td className="py-3 px-4 text-foreground" data-testid={`text-weight-${animal.id}`}>
                          {animal.weight ? `${animal.weight}g` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(animal.healthStatus || 'Healthy')} data-testid={`status-${animal.id}`}>
                            {animal.healthStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" data-testid={`button-view-${animal.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-edit-${animal.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-qr-${animal.id}`}>
                              <QrCodeLucide className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {animals.slice(0, 5).map((animal) => (
                  <Card key={animal.id} className="border-l-4 border-l-primary" data-testid={`card-animal-${animal.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground text-lg" data-testid={`text-animal-id-${animal.id}`}>
                            {animal.animalNumber}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-breed-${animal.id}`}>
                            {animal.breed}
                          </p>
                        </div>
                        <Badge className={getStatusColor(animal.healthStatus || 'Healthy')} data-testid={`status-${animal.id}`}>
                          {animal.healthStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Cage: </span>
                            <span className="font-medium" data-testid={`text-cage-id-${animal.id}`}>
                              {(animal as any).cageNumber || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Weight: </span>
                            <span className="font-medium" data-testid={`text-weight-${animal.id}`}>
                              {animal.weight ? `${animal.weight}g` : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" data-testid={`button-view-${animal.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" data-testid={`button-qr-${animal.id}`}>
                            <QrCodeLucide className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-animals">No animals found</p>
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
      <Dialog open={showAnimalForm} onOpenChange={setShowAnimalForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AnimalForm onClose={() => setShowAnimalForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

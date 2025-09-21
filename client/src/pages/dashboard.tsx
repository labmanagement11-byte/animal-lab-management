import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, QrCodeIcon, Eye, Edit, QrCode as QrCodeLucide } from "lucide-react";
import { useState } from "react";
import AnimalForm from "@/components/animal-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Animal } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalAnimals: number;
  activeCages: number;
  qrCodes: number;
  healthAlerts: number;
}

export default function Dashboard() {
  const { toast } = useToast();
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Manage your laboratory animals and cages</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowAnimalForm(true)}
            data-testid="button-add-animal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Animal
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Animals</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-animals">
                  {stats?.totalAnimals || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <QrCodeIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cages</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-active-cages">
                  {stats?.activeCages || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <QrCodeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">QR Codes Generated</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-qr-codes">
                  {stats?.qrCodes || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <QrCodeLucide className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Alerts</p>
                <p className="text-3xl font-bold text-destructive" data-testid="text-health-alerts">
                  {stats?.healthAlerts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <QrCodeIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Animals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Animals</CardTitle>
          <Button variant="outline" size="sm" data-testid="button-view-all-animals">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {animals && animals.length > 0 ? (
            <div className="overflow-x-auto">
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
                        {animal.cageId || 'N/A'}
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
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-animals">No animals found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Animal Form Modal */}
      <Dialog open={showAnimalForm} onOpenChange={setShowAnimalForm}>
        <DialogContent className="max-w-2xl">
          <AnimalForm onClose={() => setShowAnimalForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

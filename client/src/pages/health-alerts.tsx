import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Edit, QrCode, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AnimalForm from "@/components/animal-form";
import QrCodeGenerator from "@/components/qr-code-generator";
import type { Animal, Cage } from "@shared/schema";
import { calculateAge, formatDate } from "@/utils/dateUtils";
import { useLocation } from "wouter";

export default function HealthAlerts() {
  const [, setLocation] = useLocation();
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);

  const { data: animals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
  });

  const { data: cages } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  // Filter animals with health alerts (Sick or Quarantine)
  const alertAnimals = animals?.filter(
    animal => !animal.deletedAt && (animal.healthStatus === 'Sick' || animal.healthStatus === 'Quarantine')
  ) || [];

  const getCageName = (cageId: string | null) => {
    if (!cageId || !cages) return 'N/A';
    const cage = cages.find(c => c.id === cageId);
    return cage ? cage.cageNumber : 'Unknown';
  };

  const getCageRoom = (cageId: string | null) => {
    if (!cageId || !cages) return 'N/A';
    const cage = cages.find(c => c.id === cageId);
    return cage ? cage.roomNumber : 'N/A';
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Sick':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
      case 'Quarantine':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    setShowEditForm(true);
  };

  const handleGenerateQr = (animal: Animal) => {
    setSelectedAnimal(animal);
    setShowQrGenerator(true);
  };

  const handleViewDetails = (animal: Animal) => {
    setLocation(`/qr/animal/${animal.id}`);
  };

  if (animalsLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Health Alerts</h2>
          <p className="text-sm text-muted-foreground">Loading health alerts...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Health Alerts
          </h2>
          <p className="text-sm text-muted-foreground">Animals requiring immediate attention</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-sm" data-testid="badge-total-alerts">
            {alertAnimals.length} Alert{alertAnimals.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Alerts Grid */}
      {alertAnimals.length > 0 ? (
        <>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Animals with Health Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Animal ID</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cage</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Room</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Breed</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Age</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Health Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Notes</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertAnimals.map((animal) => (
                        <tr 
                          key={animal.id} 
                          className="border-b border-border hover:bg-accent/50 transition-colors"
                          data-testid={`row-alert-${animal.id}`}
                        >
                          <td className="py-3 px-4 font-medium text-foreground" data-testid={`text-animal-id-${animal.id}`}>
                            {animal.animalNumber}
                          </td>
                          <td className="py-3 px-4 text-foreground" data-testid={`text-cage-${animal.id}`}>
                            {getCageName(animal.cageId)}
                          </td>
                          <td className="py-3 px-4 text-foreground" data-testid={`text-room-${animal.id}`}>
                            {getCageRoom(animal.cageId)}
                          </td>
                          <td className="py-3 px-4 text-foreground">{animal.breed}</td>
                          <td className="py-3 px-4 text-foreground">
                            {animal.dateOfBirth ? `${calculateAge(animal.dateOfBirth)} weeks` : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getHealthStatusColor(animal.healthStatus || 'Healthy')} data-testid={`badge-health-${animal.id}`}>
                              {animal.healthStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                            {animal.diseases || animal.notes || 'No notes'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleViewDetails(animal)}
                                data-testid={`button-view-${animal.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {alertAnimals.map((animal) => (
              <Card 
                key={animal.id} 
                className={`border-l-4 ${animal.healthStatus === 'Sick' ? 'border-l-red-500' : 'border-l-purple-500'}`}
                data-testid={`card-alert-${animal.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <p className="font-semibold text-foreground text-lg" data-testid={`text-animal-id-${animal.id}`}>
                          {animal.animalNumber}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{animal.breed}</p>
                    </div>
                    <Badge className={getHealthStatusColor(animal.healthStatus || 'Healthy')} data-testid={`badge-health-${animal.id}`}>
                      {animal.healthStatus}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Cage: </span>
                      <span className="font-medium ml-1">{getCageName(animal.cageId)}</span>
                      <span className="text-muted-foreground ml-2">Room: </span>
                      <span className="font-medium ml-1">{getCageRoom(animal.cageId)}</span>
                    </div>
                    {animal.dateOfBirth && (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Age: </span>
                        <span className="font-medium ml-1">{calculateAge(animal.dateOfBirth)} weeks</span>
                      </div>
                    )}
                    {(animal.diseases || animal.notes) && (
                      <div className="text-sm bg-muted p-2 rounded">
                        <span className="text-muted-foreground">Notes: </span>
                        <span className="text-foreground">{animal.diseases || animal.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewDetails(animal)}
                      data-testid={`button-view-${animal.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEdit(animal)}
                      data-testid={`button-edit-${animal.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleGenerateQr(animal)}
                      data-testid={`button-qr-${animal.id}`}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Health Alerts</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-no-alerts">
                All animals are healthy! No animals in Sick or Quarantine status.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Animal Modal */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAnimal && (
            <AnimalForm 
              animal={selectedAnimal} 
              onClose={() => {
                setShowEditForm(false);
                setSelectedAnimal(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Generator Modal */}
      <Dialog open={showQrGenerator} onOpenChange={setShowQrGenerator}>
        <DialogContent>
          {selectedAnimal && (
            <QrCodeGenerator
              animal={selectedAnimal}
              onClose={() => {
                setShowQrGenerator(false);
                setSelectedAnimal(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

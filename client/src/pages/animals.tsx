import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Search, Eye, Edit, Trash2, QrCode } from "lucide-react";
import AnimalForm from "@/components/animal-form";
import QrCodeGenerator from "@/components/qr-code-generator";
import type { Animal } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

export default function Animals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAnimalForm, setShowAnimalForm] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

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

  const deleteAnimalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/animals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
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
        <Button onClick={() => setShowAnimalForm(true)} data-testid="button-add-animal">
          <Plus className="w-4 h-4 mr-2" />
          Add Animal
        </Button>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Animal ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cage</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Breed</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Age</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Weight</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gender</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {animals.map((animal) => (
                    <tr key={animal.id} className="border-b border-border hover:bg-accent/50" data-testid={`row-animal-${animal.id}`}>
                      <td className="py-3 px-4 font-medium text-foreground" data-testid={`text-animal-id-${animal.id}`}>
                        {animal.animalNumber}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {animal.cageId || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {animal.breed}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {animal.age ? `${animal.age} weeks` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {animal.weight ? `${animal.weight}g` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {animal.gender || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(animal.healthStatus || 'Healthy')}>
                          {animal.healthStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

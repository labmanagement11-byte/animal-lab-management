import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trash2, 
  RotateCcw, 
  AlertCircle, 
  Calendar,
  MapPin,
  Activity,
  AlertTriangle
} from "lucide-react";
import type { Animal, Cage, Strain, User as UserType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, calculateDaysUntilPermanentDeletion } from "@/utils/dateUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Trash() {
  const { toast } = useToast();
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: "animal" | "cage" | "strain" } | null>(null);
  const [activeTab, setActiveTab] = useState<"animals" | "cages" | "strains">("animals");

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  const canPermanentlyDelete = currentUser?.role === 'Admin' || currentUser?.role === 'Director';

  const { data: deletedAnimals = [], isLoading: loadingAnimals } = useQuery<Animal[]>({
    queryKey: ['/api/animals/trash'],
  });

  const { data: deletedCages = [], isLoading: loadingCages } = useQuery<Cage[]>({
    queryKey: ['/api/cages/trash'],
  });

  const { data: deletedStrains = [], isLoading: loadingStrains } = useQuery<Strain[]>({
    queryKey: ['/api/strains/trash'],
  });

  const canViewUsers = currentUser?.role === 'Success Manager' || currentUser?.role === 'Admin';

  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    enabled: !!currentUser && canViewUsers,
  });

  const restoreAnimalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/animals/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals/trash'] });
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
      toast({
        title: "Success",
        description: "Animal restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore animal",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteAnimalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/animals/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals/trash'] });
      setDeletingItem(null);
      toast({
        title: "Success",
        description: "Animal permanently deleted",
      });
    },
    onError: () => {
      setDeletingItem(null);
      toast({
        title: "Error",
        description: "Failed to permanently delete animal",
        variant: "destructive",
      });
    },
  });

  const restoreCageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/cages/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cages/trash'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cages'] });
      toast({
        title: "Success",
        description: "Cage restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore cage",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteCageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cages/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cages/trash'] });
      setDeletingItem(null);
      toast({
        title: "Success",
        description: "Cage permanently deleted",
      });
    },
    onError: () => {
      setDeletingItem(null);
      toast({
        title: "Error",
        description: "Failed to permanently delete cage",
        variant: "destructive",
      });
    },
  });

  const restoreStrainMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/strains/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains/trash'] });
      queryClient.invalidateQueries({ queryKey: ['/api/strains'] });
      toast({
        title: "Success",
        description: "Strain restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore strain",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteStrainMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/strains/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains/trash'] });
      setDeletingItem(null);
      toast({
        title: "Success",
        description: "Strain permanently deleted",
      });
    },
    onError: () => {
      setDeletingItem(null);
      toast({
        title: "Error",
        description: "Failed to permanently delete strain",
        variant: "destructive",
      });
    },
  });

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return 'N/A';
    if (!canViewUsers) return userId.substring(0, 8);
    if (!users) return 'Loading...';
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId.substring(0, 8);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Breeding':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Transferred':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Sacrificed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDaysUntilDeletion = (deletedAt: Date | string | null) => {
    if (!deletedAt) return null;
    return calculateDaysUntilPermanentDeletion(deletedAt);
  };

  const isLoading = loadingAnimals || loadingCages || loadingStrains;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2" data-testid="text-page-title">
              <Trash2 className="h-8 w-8" />
              Trash
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deleted items are kept for 10 days before permanent removal
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <Card className="border-yellow-500 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Items in trash will be automatically and permanently deleted after 10 days. 
                  {canPermanentlyDelete && " As an Admin/Director, you can permanently delete items immediately."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "animals" | "cages" | "strains")} className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="animals" data-testid="tab-animals">
              Animals ({deletedAnimals.length})
            </TabsTrigger>
            <TabsTrigger value="cages" data-testid="tab-cages">
              Cages ({deletedCages.length})
            </TabsTrigger>
            <TabsTrigger value="strains" data-testid="tab-strains">
              Strains ({deletedStrains.length})
            </TabsTrigger>
          </TabsList>

          {/* Animals Tab */}
          <TabsContent value="animals" className="space-y-4 mt-6">
            {deletedAnimals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-deleted-animals">
                    No deleted animals
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {deletedAnimals.map((animal) => {
                  const daysLeft = getDaysUntilDeletion(animal.deletedAt);
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
                  
                  return (
                    <Card key={animal.id} className={isExpiringSoon ? "border-red-500 dark:border-red-700" : ""} data-testid={`card-deleted-animal-${animal.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg" data-testid={`text-animal-number-${animal.id}`}>
                              {animal.animalNumber}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {animal.breed}
                            </p>
                          </div>
                          {animal.status && (
                            <Badge className={getStatusColor(animal.status)} data-testid={`badge-status-${animal.id}`}>
                              {animal.status}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Deletion Info */}
                        <div className="bg-muted p-3 rounded-md space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Deleted:</span>
                            <span className="font-medium">{formatDate(animal.deletedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">By:</span>
                            <span className="font-medium">{getUserName(animal.deletedBy)}</span>
                          </div>
                          {daysLeft !== null && (
                            <div className={`flex items-center gap-2 text-sm ${isExpiringSoon ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                              {isExpiringSoon && <AlertTriangle className="h-4 w-4" />}
                              <span>Permanent deletion in: {daysLeft} days</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreAnimalMutation.mutate(animal.id)}
                            disabled={restoreAnimalMutation.isPending}
                            className="flex-1"
                            data-testid={`button-restore-animal-${animal.id}`}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          {canPermanentlyDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingItem({ id: animal.id, type: "animal" })}
                              className="flex-1"
                              data-testid={`button-permanent-delete-animal-${animal.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Forever
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Cages Tab */}
          <TabsContent value="cages" className="space-y-4 mt-6">
            {deletedCages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-deleted-cages">
                    No deleted cages
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {deletedCages.map((cage) => {
                  const daysLeft = getDaysUntilDeletion(cage.deletedAt);
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
                  
                  return (
                    <Card key={cage.id} className={isExpiringSoon ? "border-red-500 dark:border-red-700" : ""} data-testid={`card-deleted-cage-${cage.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg" data-testid={`text-cage-number-${cage.id}`}>
                              {cage.cageNumber}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {cage.location}
                            </div>
                          </div>
                          <Badge variant="outline">
                            Capacity: {cage.capacity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Deletion Info */}
                        <div className="bg-muted p-3 rounded-md space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Deleted:</span>
                            <span className="font-medium">{formatDate(cage.deletedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">By:</span>
                            <span className="font-medium">{getUserName(cage.deletedBy)}</span>
                          </div>
                          {daysLeft !== null && (
                            <div className={`flex items-center gap-2 text-sm ${isExpiringSoon ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                              {isExpiringSoon && <AlertTriangle className="h-4 w-4" />}
                              <span>Permanent deletion in: {daysLeft} days</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreCageMutation.mutate(cage.id)}
                            disabled={restoreCageMutation.isPending}
                            className="flex-1"
                            data-testid={`button-restore-cage-${cage.id}`}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          {canPermanentlyDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingItem({ id: cage.id, type: "cage" })}
                              className="flex-1"
                              data-testid={`button-permanent-delete-cage-${cage.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Forever
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Strains Tab */}
          <TabsContent value="strains" className="space-y-4 mt-6">
            {deletedStrains.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-deleted-strains">
                    No deleted strains
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {deletedStrains.map((strain) => {
                  const daysLeft = getDaysUntilDeletion(strain.deletedAt);
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
                  
                  return (
                    <Card key={strain.id} className={isExpiringSoon ? "border-red-500 dark:border-red-700" : ""} data-testid={`card-deleted-strain-${strain.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg" data-testid={`text-strain-name-${strain.id}`}>
                              {strain.name}
                            </CardTitle>
                            {strain.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {strain.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Deletion Info */}
                        <div className="bg-muted p-3 rounded-md space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Deleted:</span>
                            <span className="font-medium">{formatDate(strain.deletedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">By:</span>
                            <span className="font-medium">{getUserName(strain.deletedBy)}</span>
                          </div>
                          {daysLeft !== null && (
                            <div className={`flex items-center gap-2 text-sm ${isExpiringSoon ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                              {isExpiringSoon && <AlertTriangle className="h-4 w-4" />}
                              <span>Permanent deletion in: {daysLeft} days</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreStrainMutation.mutate(strain.id)}
                            disabled={restoreStrainMutation.isPending}
                            className="flex-1"
                            data-testid={`button-restore-strain-${strain.id}`}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          {canPermanentlyDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingItem({ id: strain.id, type: "strain" })}
                              className="flex-1"
                              data-testid={`button-permanent-delete-strain-${strain.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Forever
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {deletingItem?.type === "animal" ? "animal" : deletingItem?.type === "cage" ? "cage" : "strain"} from the database.
                Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-permanent-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingItem) {
                    if (deletingItem.type === "animal") {
                      permanentDeleteAnimalMutation.mutate(deletingItem.id);
                    } else if (deletingItem.type === "cage") {
                      permanentDeleteCageMutation.mutate(deletingItem.id);
                    } else {
                      permanentDeleteStrainMutation.mutate(deletingItem.id);
                    }
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-permanent-delete"
              >
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

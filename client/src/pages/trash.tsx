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
  AlertTriangle,
  QrCode as QrCodeIcon,
  CheckSquare,
  Square
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Animal, Cage, Strain, QrCode, User as UserType } from "@shared/schema";
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
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: "animal" | "cage" | "strain" | "qrcode" | "user" } | null>(null);
  const [activeTab, setActiveTab] = useState<"animals" | "cages" | "strains" | "qrcodes" | "users">("animals");
  const [selectedAnimals, setSelectedAnimals] = useState<Set<string>>(new Set());
  const [selectedCages, setSelectedCages] = useState<Set<string>>(new Set());
  const [selectedStrains, setSelectedStrains] = useState<Set<string>>(new Set());
  const [selectedQrCodes, setSelectedQrCodes] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  const canPermanentlyDelete = currentUser?.role === 'Admin' || currentUser?.role === 'Director';
  const isAdmin = currentUser?.role === 'Admin';

  const { data: deletedAnimals = [], isLoading: loadingAnimals } = useQuery<Animal[]>({
    queryKey: ['/api/animals/trash'],
  });

  const { data: deletedCages = [], isLoading: loadingCages } = useQuery<Cage[]>({
    queryKey: ['/api/cages/trash'],
  });

  const { data: deletedStrains = [], isLoading: loadingStrains } = useQuery<Strain[]>({
    queryKey: ['/api/strains/trash'],
  });

  const { data: deletedQrCodes = [], isLoading: loadingQrCodes } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes/trash'],
  });

  const { data: deletedUsers = [], isLoading: loadingUsers } = useQuery<UserType[]>({
    queryKey: ['/api/users/trash'],
    enabled: isAdmin,
  });

  const canViewUsers = currentUser?.role === 'Success Manager' || currentUser?.role === 'Admin';

  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    enabled: !!currentUser && canViewUsers,
  });

  const restoreAnimalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/animals/${id}/restore`, { method: "POST" });
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
      await apiRequest(`/api/animals/${id}/permanent`, { method: "DELETE" });
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
      await apiRequest(`/api/cages/${id}/restore`, { method: "POST" });
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
      await apiRequest(`/api/cages/${id}/permanent`, { method: "DELETE" });
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
      await apiRequest(`/api/strains/${id}/restore`, { method: "POST" });
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
      await apiRequest(`/api/strains/${id}/permanent`, { method: "DELETE" });
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

  const restoreQrCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/qr-codes/${id}/restore`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes/trash'] });
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      toast({
        title: "Success",
        description: "QR Code restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore QR code",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteQrCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/qr-codes/${id}/permanent`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes/trash'] });
      setDeletingItem(null);
      toast({
        title: "Success",
        description: "QR Code permanently deleted",
      });
    },
    onError: () => {
      setDeletingItem(null);
      toast({
        title: "Error",
        description: "Failed to permanently delete QR code",
        variant: "destructive",
      });
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/users/${id}/restore`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/trash'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore user",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/users/${id}/permanent`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/trash'] });
      setDeletingItem(null);
      toast({
        title: "Success",
        description: "User permanently deleted",
      });
    },
    onError: () => {
      setDeletingItem(null);
      toast({
        title: "Error",
        description: "Failed to permanently delete user",
        variant: "destructive",
      });
    },
  });

  const batchDeleteAnimalsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("/api/animals/batch-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals/trash'] });
      setSelectedAnimals(new Set());
      setBatchDeleting(false);
      toast({
        title: "Success",
        description: "Selected animals deleted successfully",
      });
    },
    onError: () => {
      setBatchDeleting(false);
      toast({
        title: "Error",
        description: "Failed to delete selected animals",
        variant: "destructive",
      });
    },
  });

  const batchDeleteCagesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("/api/cages/batch-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cages/trash'] });
      setSelectedCages(new Set());
      setBatchDeleting(false);
      toast({
        title: "Success",
        description: "Selected cages deleted successfully",
      });
    },
    onError: () => {
      setBatchDeleting(false);
      toast({
        title: "Error",
        description: "Failed to delete selected cages",
        variant: "destructive",
      });
    },
  });

  const batchDeleteStrainsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("/api/strains/batch-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains/trash'] });
      setSelectedStrains(new Set());
      setBatchDeleting(false);
      toast({
        title: "Success",
        description: "Selected strains deleted successfully",
      });
    },
    onError: () => {
      setBatchDeleting(false);
      toast({
        title: "Error",
        description: "Failed to delete selected strains",
        variant: "destructive",
      });
    },
  });

  const batchDeleteQrCodesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("/api/qr-codes/batch-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes/trash'] });
      setSelectedQrCodes(new Set());
      setBatchDeleting(false);
      toast({
        title: "Success",
        description: "Selected QR codes deleted successfully",
      });
    },
    onError: () => {
      setBatchDeleting(false);
      toast({
        title: "Error",
        description: "Failed to delete selected QR codes",
        variant: "destructive",
      });
    },
  });

  const batchDeleteUsersMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("/api/users/batch-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/trash'] });
      setSelectedUsers(new Set());
      setBatchDeleting(false);
      toast({
        title: "Success",
        description: "Selected users deleted successfully",
      });
    },
    onError: () => {
      setBatchDeleting(false);
      toast({
        title: "Error",
        description: "Failed to delete selected users",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (tab: string) => {
    switch(tab) {
      case 'animals':
        setSelectedAnimals(new Set(deletedAnimals.map(a => a.id)));
        break;
      case 'cages':
        setSelectedCages(new Set(deletedCages.map(c => c.id)));
        break;
      case 'strains':
        setSelectedStrains(new Set(deletedStrains.map(s => s.id)));
        break;
      case 'qrcodes':
        setSelectedQrCodes(new Set(deletedQrCodes.map(q => q.id)));
        break;
      case 'users':
        setSelectedUsers(new Set(deletedUsers.map(u => u.id)));
        break;
    }
  };

  const handleDeselectAll = (tab: string) => {
    switch(tab) {
      case 'animals':
        setSelectedAnimals(new Set());
        break;
      case 'cages':
        setSelectedCages(new Set());
        break;
      case 'strains':
        setSelectedStrains(new Set());
        break;
      case 'qrcodes':
        setSelectedQrCodes(new Set());
        break;
      case 'users':
        setSelectedUsers(new Set());
        break;
    }
  };

  const handleBatchDelete = () => {
    setBatchDeleting(true);
    switch(activeTab) {
      case 'animals':
        batchDeleteAnimalsMutation.mutate(Array.from(selectedAnimals));
        break;
      case 'cages':
        batchDeleteCagesMutation.mutate(Array.from(selectedCages));
        break;
      case 'strains':
        batchDeleteStrainsMutation.mutate(Array.from(selectedStrains));
        break;
      case 'qrcodes':
        batchDeleteQrCodesMutation.mutate(Array.from(selectedQrCodes));
        break;
      case 'users':
        batchDeleteUsersMutation.mutate(Array.from(selectedUsers));
        break;
    }
  };

  const toggleSelection = (id: string, tab: string) => {
    switch(tab) {
      case 'animals': {
        const newSet = new Set(selectedAnimals);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        setSelectedAnimals(newSet);
        break;
      }
      case 'cages': {
        const newSet = new Set(selectedCages);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        setSelectedCages(newSet);
        break;
      }
      case 'strains': {
        const newSet = new Set(selectedStrains);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        setSelectedStrains(newSet);
        break;
      }
      case 'qrcodes': {
        const newSet = new Set(selectedQrCodes);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        setSelectedQrCodes(newSet);
        break;
      }
      case 'users': {
        const newSet = new Set(selectedUsers);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        setSelectedUsers(newSet);
        break;
      }
    }
  };

  const getSelectedCount = () => {
    switch(activeTab) {
      case 'animals':
        return selectedAnimals.size;
      case 'cages':
        return selectedCages.size;
      case 'strains':
        return selectedStrains.size;
      case 'qrcodes':
        return selectedQrCodes.size;
      case 'users':
        return selectedUsers.size;
      default:
        return 0;
    }
  };

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

  const isLoading = loadingAnimals || loadingCages || loadingStrains || loadingQrCodes || (isAdmin && loadingUsers);

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
    <div 
      className="flex-1 overflow-auto bg-cover bg-center bg-no-repeat bg-fixed relative min-h-screen"
      style={{
        backgroundImage: `url(/attached_assets/c524eee6-37c9-42cd-9754-07e7e4ac2dcd_1759682477394.jpg)`
      }}
    >
      <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
      <div className="p-4 md:p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ml-[122px] mr-[122px]">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white dark:text-white flex items-center gap-2" data-testid="text-page-title">
              <Trash2 className="h-8 w-8" />
              Trash
            </h1>
            <p className="text-sm text-gray-100 dark:text-gray-100 mt-1">
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "animals" | "cages" | "strains" | "qrcodes" | "users")} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'md:w-[1000px] grid-cols-5' : 'md:w-[800px] grid-cols-4'}`}>
            <TabsTrigger value="animals" data-testid="tab-animals">
              Animals ({deletedAnimals.length})
            </TabsTrigger>
            <TabsTrigger value="cages" data-testid="tab-cages">
              Cages ({deletedCages.length})
            </TabsTrigger>
            <TabsTrigger value="strains" data-testid="tab-strains">
              Strains ({deletedStrains.length})
            </TabsTrigger>
            <TabsTrigger value="qrcodes" data-testid="tab-qrcodes">
              QR Codes ({deletedQrCodes.length})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" data-testid="tab-users">
                Users ({deletedUsers.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Bulk Actions Bar */}
          {canPermanentlyDelete && getSelectedCount() === 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(activeTab)}
                data-testid="button-select-all"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select All
              </Button>
            </div>
          )}

          {canPermanentlyDelete && getSelectedCount() > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">
                  {getSelectedCount()} selected
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeselectAll(activeTab)}
                data-testid="button-deselect-all"
              >
                <Square className="h-4 w-4 mr-2" />
                Deselect All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={batchDeleting}
                data-testid="button-delete-selected"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {batchDeleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          )}

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
                        <div className="flex items-start gap-3">
                          {canPermanentlyDelete && (
                            <Checkbox
                              checked={selectedAnimals.has(animal.id)}
                              onCheckedChange={() => toggleSelection(animal.id, 'animals')}
                              className="mt-1"
                              data-testid={`checkbox-animal-${animal.id}`}
                            />
                          )}
                          <div className="flex items-start justify-between gap-2 flex-1">
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
                        <div className="flex items-start gap-3">
                          {canPermanentlyDelete && (
                            <Checkbox
                              checked={selectedCages.has(cage.id)}
                              onCheckedChange={() => toggleSelection(cage.id, 'cages')}
                              className="mt-1"
                              data-testid={`checkbox-cage-${cage.id}`}
                            />
                          )}
                          <div className="flex items-start justify-between gap-2 flex-1">
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
                        <div className="flex items-start gap-3">
                          {canPermanentlyDelete && (
                            <Checkbox
                              checked={selectedStrains.has(strain.id)}
                              onCheckedChange={() => toggleSelection(strain.id, 'strains')}
                              className="mt-1"
                              data-testid={`checkbox-strain-${strain.id}`}
                            />
                          )}
                          <div className="flex items-start justify-between gap-2 flex-1">
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

          {/* QR Codes Tab */}
          <TabsContent value="qrcodes" className="space-y-4 mt-6">
            {deletedQrCodes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-deleted-qrcodes">
                    No deleted QR codes
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {deletedQrCodes.map((qrCode) => {
                  const daysLeft = getDaysUntilDeletion(qrCode.deletedAt);
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
                  
                  return (
                    <Card key={qrCode.id} className={isExpiringSoon ? "border-red-500 dark:border-red-700" : ""} data-testid={`card-deleted-qrcode-${qrCode.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {canPermanentlyDelete && (
                            <Checkbox
                              checked={selectedQrCodes.has(qrCode.id)}
                              onCheckedChange={() => toggleSelection(qrCode.id, 'qrcodes')}
                              className="mt-1"
                              data-testid={`checkbox-qrcode-${qrCode.id}`}
                            />
                          )}
                          <div className="flex items-start justify-between gap-2 flex-1">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-qrcode-id-${qrCode.id}`}>
                                <QrCodeIcon className="h-5 w-5" />
                                QR {qrCode.id.substring(0, 8)}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {qrCode.isBlank ? "Blank QR Code" : "Linked QR Code"}
                              </p>
                            </div>
                            {qrCode.cageId && (
                              <Badge variant="outline">
                                Cage ID: {qrCode.cageId.substring(0, 8)}
                              </Badge>
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
                            <span className="font-medium">{formatDate(qrCode.deletedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">By:</span>
                            <span className="font-medium">{getUserName(qrCode.deletedBy)}</span>
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
                            onClick={() => restoreQrCodeMutation.mutate(qrCode.id)}
                            disabled={restoreQrCodeMutation.isPending}
                            className="flex-1"
                            data-testid={`button-restore-qrcode-${qrCode.id}`}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          {canPermanentlyDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingItem({ id: qrCode.id, type: "qrcode" })}
                              className="flex-1"
                              data-testid={`button-permanent-delete-qrcode-${qrCode.id}`}
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

          {/* Users Tab */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-4 mt-6">
              {deletedUsers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-deleted-users">
                      No deleted users
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  {deletedUsers.map((user) => {
                    const daysLeft = getDaysUntilDeletion(user.deletedAt);
                    const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
                    
                    return (
                      <Card key={user.id} className={isExpiringSoon ? "border-red-500 dark:border-red-700" : ""} data-testid={`card-deleted-user-${user.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={() => toggleSelection(user.id, 'users')}
                              className="mt-1"
                              data-testid={`checkbox-user-${user.id}`}
                            />
                            <div className="flex items-start justify-between gap-2 flex-1">
                              <div className="flex-1">
                                <CardTitle className="text-lg" data-testid={`text-user-name-${user.id}`}>
                                  {user.firstName} {user.lastName}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {user.email}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {user.role}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Deletion Info */}
                          <div className="bg-muted p-3 rounded-md space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Deleted:</span>
                              <span className="font-medium">{formatDate(user.deletedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">By:</span>
                              <span className="font-medium">{getUserName(user.deletedBy)}</span>
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
                              onClick={() => restoreUserMutation.mutate(user.id)}
                              disabled={restoreUserMutation.isPending}
                              className="flex-1"
                              data-testid={`button-restore-user-${user.id}`}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingItem({ id: user.id, type: "user" })}
                              className="flex-1"
                              data-testid={`button-permanent-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Forever
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {
                  deletingItem?.type === "animal" ? "animal" : 
                  deletingItem?.type === "cage" ? "cage" : 
                  deletingItem?.type === "qrcode" ? "QR code" : 
                  deletingItem?.type === "user" ? "user" :
                  "strain"
                } from the database.
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
                    } else if (deletingItem.type === "qrcode") {
                      permanentDeleteQrCodeMutation.mutate(deletingItem.id);
                    } else if (deletingItem.type === "user") {
                      permanentDeleteUserMutation.mutate(deletingItem.id);
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

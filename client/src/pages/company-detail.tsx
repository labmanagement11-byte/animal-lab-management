import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Building2, Users, Beaker, TestTube2, QrCode, 
  PackageOpen, Plus, Trash2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Animal, Cage, User, Strain, Genotype, QrCode as QrCodeType, Company } from "@shared/schema";

interface CompanyOverview {
  company: Company;
  animals: Animal[];
  cages: Cage[];
  users: User[];
  strains: Strain[];
  genotypes: Genotype[];
  qrCodes: QrCodeType[];
  stats: {
    totalAnimals: number;
    activeCages: number;
    totalUsers: number;
    qrCodes: number;
  };
}

export default function CompanyDetail() {
  const [, params] = useRoute("/companies/:companyId");
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);

  const companyId = params?.companyId;

  const { data: overview, isLoading } = useQuery<CompanyOverview>({
    queryKey: ['/api/companies', companyId, 'overview'],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/overview`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch company overview');
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const availableUsers = allUsers?.filter(u => !u.companyId && !u.deletedAt) || [];

  const assignUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/companies/${companyId}/users`, {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuario asignado",
        description: "El usuario ha sido asignado a la compañía exitosamente.",
      });
      setShowAddUserDialog(false);
      setSelectedUserId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al asignar usuario",
        variant: "destructive",
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/companies/${companyId}/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuario removido",
        description: "El usuario ha sido removido de la compañía.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al remover usuario",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Compañía no encontrada</h3>
            <Link href="/companies">
              <Button variant="outline" className="mt-4" data-testid="button-back-to-companies">
                Volver a compañías
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { company, animals, cages, users, strains, genotypes, qrCodes, stats } = overview;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header with breadcrumb */}
      <div className="mb-6">
        <Link href="/companies">
          <Button variant="ghost" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a compañías
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              {company.name}
            </h1>
            {company.description && (
              <p className="text-muted-foreground mt-2">{company.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card data-testid="stat-animals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Animales</CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnimals}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-cages">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jaulas Activas</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCages}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-qrcodes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Códigos QR</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qrCodes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different data views */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="w-4 h-4 mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="animals" data-testid="tab-animals">
                <Beaker className="w-4 h-4 mr-2" />
                Animales
              </TabsTrigger>
              <TabsTrigger value="cages" data-testid="tab-cages">
                <PackageOpen className="w-4 h-4 mr-2" />
                Jaulas
              </TabsTrigger>
              <TabsTrigger value="strains" data-testid="tab-strains">
                <TestTube2 className="w-4 h-4 mr-2" />
                Cepas
              </TabsTrigger>
              <TabsTrigger value="genotypes" data-testid="tab-genotypes">
                <TestTube2 className="w-4 h-4 mr-2" />
                Genotipos
              </TabsTrigger>
              <TabsTrigger value="qrcodes" data-testid="tab-qrcodes">
                <QrCode className="w-4 h-4 mr-2" />
                QR Codes
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Empleados de {company.name}</h3>
                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-user">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Usuario a {company.name}</DialogTitle>
                      <DialogDescription>
                        Selecciona un usuario para asignarlo a esta compañía
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger data-testid="select-user">
                          <SelectValue placeholder="Seleccionar usuario..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground text-center">
                              No hay usuarios disponibles
                            </div>
                          ) : (
                            availableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.email} - {user.role}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddUserDialog(false)}
                          data-testid="button-cancel-add-user"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => assignUserMutation.mutate(selectedUserId)}
                          disabled={!selectedUserId || assignUserMutation.isPending}
                          data-testid="button-confirm-add-user"
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay usuarios asignados a esta compañía</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <Card key={user.id} data-testid={`user-card-${user.id}`}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <Badge variant="outline" className="mt-1">{user.role}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`¿Remover ${user.email} de ${company.name}?`)) {
                              removeUserMutation.mutate(user.id);
                            }
                          }}
                          data-testid={`button-remove-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Animals Tab */}
            <TabsContent value="animals">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-4">{animals.length} Animales</h3>
                {animals.length === 0 ? (
                  <div className="text-center py-12">
                    <Beaker className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay animales en esta compañía</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {animals.map((animal) => (
                      <Card key={animal.id} data-testid={`animal-card-${animal.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{animal.animalNumber}</p>
                              <p className="text-sm text-muted-foreground">Raza: {animal.breed}</p>
                              <p className="text-sm text-muted-foreground">Género: {animal.gender}</p>
                            </div>
                            <Badge variant={animal.healthStatus === 'Healthy' ? 'default' : 'destructive'}>
                              {animal.healthStatus}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Cages Tab */}
            <TabsContent value="cages">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-4">{cages.length} Jaulas</h3>
                {cages.length === 0 ? (
                  <div className="text-center py-12">
                    <PackageOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay jaulas en esta compañía</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {cages.map((cage) => (
                      <Card key={cage.id} data-testid={`cage-card-${cage.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{cage.cageNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                Ubicación: {cage.location} - Sala: {cage.roomNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Capacidad: {cage.capacity}
                              </p>
                            </div>
                            <Badge variant={cage.isActive ? 'default' : 'secondary'}>
                              {cage.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Strains Tab */}
            <TabsContent value="strains">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-4">{strains.length} Cepas</h3>
                {strains.length === 0 ? (
                  <div className="text-center py-12">
                    <TestTube2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay cepas en esta compañía</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {strains.map((strain) => (
                      <Card key={strain.id} data-testid={`strain-card-${strain.id}`}>
                        <CardContent className="p-4">
                          <p className="font-medium">{strain.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Genotypes Tab */}
            <TabsContent value="genotypes">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-4">{genotypes.length} Genotipos</h3>
                {genotypes.length === 0 ? (
                  <div className="text-center py-12">
                    <TestTube2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay genotipos en esta compañía</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {genotypes.map((genotype) => (
                      <Card key={genotype.id} data-testid={`genotype-card-${genotype.id}`}>
                        <CardContent className="p-4">
                          <p className="font-medium">{genotype.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* QR Codes Tab */}
            <TabsContent value="qrcodes">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-4">{qrCodes.length} Códigos QR</h3>
                {qrCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay códigos QR en esta compañía</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {qrCodes.map((qr) => (
                      <Card key={qr.id} data-testid={`qr-card-${qr.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm font-mono">{qr.id.substring(0, 8)}...</p>
                              <p className="text-sm text-muted-foreground">
                                {qr.isBlank ? 'QR en Blanco' : 'QR Asignado'}
                              </p>
                            </div>
                            <Badge variant={qr.isBlank ? 'outline' : 'default'}>
                              {qr.cageId ? 'Vinculado' : 'Disponible'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

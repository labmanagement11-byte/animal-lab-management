import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Dna, Trash2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Genotype {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export default function GenotypesPage() {
  const [, setLocation] = useLocation();
  const [genotypeInput, setGenotypeInput] = useState("");
  const { toast } = useToast();

  const { data: genotypes, isLoading } = useQuery<Genotype[]>({
    queryKey: ['/api/genotypes'],
  });

  const createGenotypeMutation = useMutation({
    mutationFn: (name: string) => apiRequest('POST', '/api/genotypes', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/genotypes'] });
      toast({
        title: "Éxito",
        description: "Genotipo guardado exitosamente.",
      });
      setGenotypeInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al guardar el genotipo.",
        variant: "destructive",
      });
    },
  });

  const deleteGenotypeMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/genotypes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/genotypes'] });
      toast({
        title: "Éxito",
        description: "Genotipo eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al eliminar el genotipo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genotypeInput.trim()) {
      toast({
        title: "Error",
        description: "El nombre del genotipo es requerido.",
        variant: "destructive",
      });
      return;
    }

    createGenotypeMutation.mutate(genotypeInput.trim());
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro que desea eliminar este genotipo?")) {
      deleteGenotypeMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8 ml-[122px] mr-[122px]">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Gestión de Genotipos</h2>
          <p className="text-muted-foreground mt-1">Agregar y gestionar genotipos de animales</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Agregar Nuevo Genotipo
          </CardTitle>
          <CardDescription>
            Ingrese el nombre del genotipo para agregarlo al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="genotype-name" className="sr-only">Nombre del Genotipo</Label>
              <Input
                id="genotype-name"
                placeholder="Ingrese nombre del genotipo (ej: WT, HET, KO)"
                value={genotypeInput}
                onChange={(e) => setGenotypeInput(e.target.value)}
                data-testid="input-genotype-name"
                disabled={createGenotypeMutation.isPending}
              />
            </div>
            <Button 
              type="submit" 
              disabled={createGenotypeMutation.isPending || !genotypeInput.trim()}
              data-testid="button-save-genotype"
            >
              {createGenotypeMutation.isPending ? "Guardando..." : "Guardar Genotipo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5" />
            Resumen de Genotipos
          </CardTitle>
          <CardDescription>
            Vista general de genotipos guardados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-genotypes">
                {genotypes?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total de Genotipos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="text-recent-genotypes">
                {genotypes?.filter(g => {
                  const createdDate = new Date(g.createdAt);
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                  return createdDate > oneWeekAgo;
                }).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Agregados Esta Semana</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Genotipos Guardados</CardTitle>
          <CardDescription>
            Lista de todos los genotipos agregados al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando genotipos...</p>
            </div>
          ) : !genotypes || genotypes.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-genotypes">
              <Dna className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay genotipos guardados</h3>
              <p className="text-muted-foreground mb-4">
                Comience agregando su primer genotipo usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {genotypes.map((genotype) => (
                <div
                  key={genotype.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`genotype-item-${genotype.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2" data-testid={`genotype-name-${genotype.id}`}>
                      {genotype.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Agregado {new Date(genotype.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(genotype.id);
                    }}
                    disabled={deleteGenotypeMutation.isPending}
                    data-testid={`button-delete-genotype-${genotype.id}`}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

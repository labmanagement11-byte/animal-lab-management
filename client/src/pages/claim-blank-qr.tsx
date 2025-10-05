import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QrCode, Plus, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { QrCode as QrCodeType, Strain } from "@shared/schema";
import { useLocation } from "wouter";

export default function ClaimBlankQr() {
  const [, params] = useRoute("/qr/blank/:qrId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [claimed, setClaimed] = useState(false);

  const qrId = params?.qrId;

  const [formData, setFormData] = useState({
    cageNumber: "",
    roomNumber: "BB00028",
    location: "",
    capacity: 5,
    isActive: true,
    status: "Active",
    strainId: "",
    notes: "",
  });

  const { data: qrCode, isLoading: qrLoading } = useQuery<QrCodeType>({
    queryKey: ['/api/qr-codes', qrId],
    enabled: !!qrId,
    queryFn: async () => {
      const response = await fetch(`/api/qr-codes/${qrId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('QR code not found');
      }
      return response.json();
    },
  });

  const { data: strains } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  const createCageAndClaimMutation = useMutation({
    mutationFn: async () => {
      const newCage = await apiRequest("POST", "/api/cages", formData);
      await apiRequest("POST", `/api/qr-codes/${qrCode?.id}/claim`, { cageId: newCage.id });
      return newCage;
    },
    onSuccess: (cage) => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cages'] });
      setClaimed(true);
      toast({
        title: "¡Éxito!",
        description: `Jaula ${cage.cageNumber} creada y vinculada al código QR`,
      });
      setTimeout(() => {
        setLocation(`/qr/cage/${cage.id}`);
      }, 2000);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Sesión expirada. Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Error al crear la jaula",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cageNumber.trim()) {
      toast({
        title: "Error",
        description: "El número de jaula es requerido",
        variant: "destructive",
      });
      return;
    }
    createCageAndClaimMutation.mutate();
  };

  if (qrLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando código QR...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Código QR no encontrado</h3>
            <p className="text-sm text-muted-foreground">
              El código QR escaneado no existe o ya fue utilizado
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (qrCode.cageId || !qrCode.isBlank) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Código QR ya vinculado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Este código QR ya está asociado a una jaula
            </p>
            <Button onClick={() => setLocation(`/qr/cage/${qrCode.cageId}`)}>
              Ver Jaula
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">¡Jaula creada exitosamente!</h3>
            <p className="text-sm text-muted-foreground">
              Redirigiendo a la información de la jaula...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Plus className="w-7 h-7" />
          Crear Nueva Jaula
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Completa la información para vincular este código QR a una nueva jaula
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Jaula</CardTitle>
            <CardDescription>
              Ingresa los detalles de la nueva jaula que deseas crear
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cageNumber">Número de Jaula *</Label>
                <Input
                  id="cageNumber"
                  value={formData.cageNumber}
                  onChange={(e) => setFormData({ ...formData, cageNumber: e.target.value })}
                  placeholder="Ej: C-001"
                  required
                  data-testid="input-cage-number"
                />
              </div>

              <div>
                <Label htmlFor="roomNumber">Sala</Label>
                <Select
                  value={formData.roomNumber}
                  onValueChange={(value) => setFormData({ ...formData, roomNumber: value })}
                >
                  <SelectTrigger data-testid="select-room-number">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BB00028">BB00028</SelectItem>
                    <SelectItem value="ZRC-C61">ZRC-C61</SelectItem>
                    <SelectItem value="ZRC-SC14">ZRC-SC14</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Rack A, Nivel 2"
                  data-testid="input-location"
                />
              </div>

              <div>
                <Label htmlFor="capacity">Capacidad</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 5 })}
                  data-testid="input-capacity"
                />
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Breeding">Breeding</SelectItem>
                    <SelectItem value="Holding">Holding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="strainId">Cepa (Strain)</Label>
                <Select
                  value={formData.strainId}
                  onValueChange={(value) => setFormData({ ...formData, strainId: value })}
                >
                  <SelectTrigger data-testid="select-strain">
                    <SelectValue placeholder="Seleccionar cepa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin cepa</SelectItem>
                    {strains?.map((strain) => (
                      <SelectItem key={strain.id} value={strain.id}>
                        {strain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre la jaula..."
                rows={3}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Jaula activa</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/cages')}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createCageAndClaimMutation.isPending}
                data-testid="button-submit-cage"
              >
                {createCageAndClaimMutation.isPending ? "Creando..." : "Crear Jaula"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

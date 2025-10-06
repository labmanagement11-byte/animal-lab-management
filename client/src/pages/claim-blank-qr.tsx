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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [showNextStepDialog, setShowNextStepDialog] = useState(false);
  const [createdCageId, setCreatedCageId] = useState<string>("");

  const qrId = params?.qrId;

  const [formData, setFormData] = useState({
    cageNumber: "",
    roomNumber: "BB00028",
    location: "",
    capacity: "" as string | number,
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
      const cageResponse = await apiRequest("/api/cages", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });
      const newCage = await cageResponse.json();
      await apiRequest(`/api/qr-codes/${qrCode?.id}/claim`, {
        method: "POST",
        body: JSON.stringify({ cageId: newCage.id }),
        headers: { "Content-Type": "application/json" }
      });
      return newCage;
    },
    onSuccess: (cage) => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cages'] });
      setClaimed(true);
      setCreatedCageId(cage.id);
      toast({
        title: "Success!",
        description: `Cage ${cage.cageNumber} created and linked to QR code`,
      });
      setShowNextStepDialog(true);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Extract error message from response body if available
      let errorMessage = "Error creating cage";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.body?.message) {
        errorMessage = error.body.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cageNumber.trim()) {
      toast({
        title: "Error",
        description: "Cage number is required",
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
            <p className="text-muted-foreground mt-4">Loading QR code...</p>
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
            <h3 className="text-lg font-semibold text-foreground mb-2">QR Code Already Linked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This QR code is already associated with a cage
            </p>
            <Button onClick={() => setLocation(`/qr/cage/${qrCode.cageId}`)}>
              View Cage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {!claimed && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Plus className="w-7 h-7" />
              Create New Cage
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Fill in the information to link this QR code to a new cage
            </p>
          </div>

          <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Cage Information</CardTitle>
            <CardDescription>
              Enter the details for the new cage you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cageNumber">Cage Number *</Label>
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
                <Label htmlFor="roomNumber">Room</Label>
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Rack A, Nivel 2"
                  data-testid="input-location"
                />
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : "" })}
                  placeholder="Optional"
                  data-testid="input-capacity"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
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
                    <SelectItem value="Experimental">Experimental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="strainId">Strain</Label>
                <Select
                  value={formData.strainId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, strainId: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-strain">
                    <SelectValue placeholder="Select strain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No strain</SelectItem>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the cage..."
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
              <Label htmlFor="isActive">Active cage</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/cages')}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createCageAndClaimMutation.isPending}
                data-testid="button-submit-cage"
              >
                {createCageAndClaimMutation.isPending ? "Creating..." : "Create Cage"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
        </>
      )}

      <AlertDialog open={showNextStepDialog} onOpenChange={setShowNextStepDialog}>
        <AlertDialogContent data-testid="dialog-next-step">
          <AlertDialogHeader>
            <AlertDialogTitle>Cage Created Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              What would you like to do next?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setLocation(`/qr/cage/${createdCageId}`)}
              data-testid="button-view-cage"
            >
              View Cage
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setLocation(`/animals?cageId=${createdCageId}`)}
              data-testid="button-add-animals"
            >
              Add Animals
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

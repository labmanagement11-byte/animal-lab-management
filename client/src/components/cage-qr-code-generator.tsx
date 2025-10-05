import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Copy, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Cage, Animal } from "@shared/schema";
import { calculateAge, formatDate } from "@/utils/dateUtils";

interface CageQrCodeGeneratorProps {
  cage: Cage;
  onClose: () => void;
}

export default function CageQrCodeGenerator({ cage, onClose }: CageQrCodeGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Fetch animals in this cage
  const { data: cageAnimals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['/api/animals/by-cage', cage.id],
    queryFn: async () => {
      const response = await fetch(`/api/animals?cageId=${cage.id}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const allAnimals = await response.json();
      return allAnimals.filter((animal: Animal) => animal.cageId === cage.id);
    },
  });

  // Generate URL for QR code that links to cage detail page
  const qrData = `${window.location.origin}/qr/cage/${cage.id}`;

  const createQrCodeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/qr-codes", {
        method: "POST",
        body: JSON.stringify({
          cageId: cage.id,
          qrData: qrData,
        }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      toast({
        title: "Success",
        description: "Cage QR code generated and saved successfully",
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
        description: "Failed to save QR code",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Generate real QR code using qrcode library
    const generateQrCode = async () => {
      if (!canvasRef.current) return;

      try {
        const canvas = canvasRef.current;
        
        // Generate QR code on canvas
        await QRCode.toCanvas(canvas, qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Convert to data URL for download
        const dataUrl = canvas.toDataURL('image/png');
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (cageAnimals && qrData) {
      generateQrCode();
    }
  }, [cage, cageAnimals, qrData]);

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

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-Cage-${cage.cageNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      toast({
        title: "Copied",
        description: "Cage QR link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    createQrCodeMutation.mutate();
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Cage QR Code Generator</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6 mt-4">
        {/* Cage Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Cage Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Cage Number:</span> 
              <span className="ml-2 font-medium" data-testid="text-cage-qr-number">{cage.cageNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Room:</span> 
              <span className="ml-2 font-medium" data-testid="text-cage-qr-room">{cage.roomNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span> 
              <span className="ml-2 font-medium" data-testid="text-cage-qr-location">{cage.location}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Capacity:</span> 
              <span className="ml-2 font-medium" data-testid="text-cage-qr-capacity">{cage.capacity || 'N/A'} animals</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span> 
              <span className="ml-2">
                <Badge variant="secondary" data-testid="badge-cage-qr-status">
                  {cage.status || 'Active'}
                </Badge>
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Animals:</span> 
              <span className="ml-2 font-medium" data-testid="text-cage-qr-animal-count">
                {isLoadingAnimals ? 'Loading...' : `${cageAnimals?.length || 0} animals`}
              </span>
            </div>
          </div>
        </div>

        {/* Animals in Cage */}
        {!isLoadingAnimals && cageAnimals && cageAnimals.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3">Animals in this Cage ({cageAnimals.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cageAnimals.map((animal) => (
                <Card key={animal.id} className="p-3 bg-background">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium" data-testid={`text-animal-qr-${animal.id}`}>
                        {animal.animalNumber}
                      </span>
                      <Badge className={getStatusColor(animal.healthStatus || 'Healthy')}>
                        {animal.healthStatus || 'Healthy'}
                      </Badge>
                    </div>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div>Strain: {animal.breed}</div>
                      <div>Gender: {animal.gender || 'N/A'}</div>
                      <div>Age: {calculateAge(animal.dateOfBirth)}</div>
                      {animal.weight && <div>Weight: {animal.weight}g</div>}
                      {animal.genotype && <div>Genotype: {animal.genotype}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isLoadingAnimals && (!cageAnimals || cageAnimals.length === 0) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200" data-testid="text-empty-cage">
              This cage currently has no animals assigned to it.
            </p>
          </div>
        )}

        {/* QR Code */}
        <div className="text-center">
          <canvas
            ref={canvasRef}
            className="border border-border rounded-lg mx-auto"
            style={{ maxWidth: '200px', maxHeight: '200px' }}
          />
          <p className="text-sm text-muted-foreground mt-2">
            QR Code for Cage {cage.cageNumber}
          </p>
          <p className="text-xs text-muted-foreground">
            Contains information about {cageAnimals?.length || 0} animal{cageAnimals?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            data-testid="button-download-cage-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyData}
            data-testid="button-copy-cage-data"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button
            onClick={handleSave}
            disabled={createQrCodeMutation.isPending}
            data-testid="button-save-cage-qr"
          >
            {createQrCodeMutation.isPending ? 'Saving...' : 'Save to Database'}
          </Button>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} data-testid="button-close-cage-qr">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import PrintQrCode from "@/components/print-qr-code";
import type { Animal } from "@shared/schema";

interface QrCodeGeneratorProps {
  animal: Animal;
  onClose: () => void;
}

export default function QrCodeGenerator({ animal, onClose }: QrCodeGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const qrData = JSON.stringify({
    animalId: animal.id,
    animalNumber: animal.animalNumber,
    cageId: animal.cageId,
    breed: animal.breed,
    weight: animal.weight,
    gender: animal.gender,
    healthStatus: animal.healthStatus,
    diseases: animal.diseases,
    notes: animal.notes,
  });

  const createQrCodeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/qr-codes", {
        animalId: animal.id,
        cageId: animal.cageId,
        qrData: qrData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      toast({
        title: "Success",
        description: "QR code generated and saved successfully",
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
    const generateQrCode = async () => {
      if (!canvasRef.current) return;

      try {
        // Generate real QR code using qrcode library
        const canvas = canvasRef.current;
        await QRCode.toCanvas(canvas, qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Convert to data URL for download/copy functionality
        const dataUrl = canvas.toDataURL('image/png');
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      }
    };

    generateQrCode();
  }, [animal, qrData, toast]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${animal.animalNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      toast({
        title: "Copied",
        description: "QR data copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy data",
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
        <DialogTitle>QR Code Generator</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6 mt-4">
        {/* Animal Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Animal Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">ID:</span> 
              <span className="ml-2" data-testid="text-qr-animal-id">{animal.animalNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cage:</span> 
              <span className="ml-2" data-testid="text-qr-cage-id">{animal.cageId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Breed:</span> 
              <span className="ml-2" data-testid="text-qr-breed">{animal.breed}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span> 
              <span className="ml-2" data-testid="text-qr-weight">{animal.weight ? `${animal.weight}g` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center">
          <canvas
            ref={canvasRef}
            className="border border-border rounded-lg mx-auto"
            style={{ maxWidth: '200px', maxHeight: '200px' }}
          />
          <p className="text-sm text-muted-foreground mt-2">
            QR Code for {animal.animalNumber}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyData}
            data-testid="button-copy-data"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Data
          </Button>
          <PrintQrCode animal={animal} qrDataUrl={qrDataUrl} />
          <Button
            onClick={handleSave}
            disabled={createQrCodeMutation.isPending}
            data-testid="button-save-qr"
          >
            {createQrCodeMutation.isPending ? 'Saving...' : 'Save to Database'}
          </Button>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} data-testid="button-close-qr">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

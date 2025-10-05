import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Printer, QrCode as QrCodeIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { QrCode } from "@shared/schema";

interface BlankQrGeneratorProps {
  onClose: () => void;
}

export default function BlankQrGenerator({ onClose }: BlankQrGeneratorProps) {
  const { toast } = useToast();
  const [count, setCount] = useState(1);
  const [generatedQrCodes, setGeneratedQrCodes] = useState<QrCode[]>([]);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const generateQrMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await apiRequest("POST", "/api/qr-codes/generate-blank", { count });
      return response;
    },
    onSuccess: (data: QrCode[]) => {
      setGeneratedQrCodes(data);
      toast({
        title: "Success",
        description: `Generated ${data.length} blank QR code${data.length > 1 ? 's' : ''} successfully`,
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
        description: "Failed to generate QR codes",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (generatedQrCodes.length > 0) {
      generatedQrCodes.forEach((qrCode) => {
        const canvas = canvasRefs.current[qrCode.id];
        if (canvas) {
          QRCode.toCanvas(canvas, qrCode.qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        }
      });
    }
  }, [generatedQrCodes]);

  const handleGenerate = () => {
    if (count < 1 || count > 20) {
      toast({
        title: "Error",
        description: "Count must be between 1 and 20",
        variant: "destructive",
      });
      return;
    }
    generateQrMutation.mutate(count);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <QrCodeIcon className="w-5 h-5" />
          Generate Blank QR Codes
        </DialogTitle>
      </DialogHeader>

      <Card>
        <CardHeader>
          <CardTitle>Generate QR Codes</CardTitle>
          <CardDescription>
            Create 1-20 blank QR codes for cage labeling. Print them and scan later to link with cages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="qr-count">Number of QR Codes (1-20)</Label>
              <Input
                id="qr-count"
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                data-testid="input-qr-count"
                disabled={generateQrMutation.isPending}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={generateQrMutation.isPending || count < 1 || count > 20}
                data-testid="button-generate-qr"
              >
                {generateQrMutation.isPending ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedQrCodes.length > 0 && (
        <>
          <div className="flex gap-2 print:hidden">
            <Button
              onClick={handlePrint}
              className="flex-1"
              data-testid="button-print-qr"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print QR Codes
            </Button>
          </div>

          <div className="print-content">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
              {generatedQrCodes.map((qrCode) => (
                <Card key={qrCode.id} className="print:break-inside-avoid print:border print:border-gray-300" data-testid={`qr-card-${qrCode.id}`}>
                  <CardContent className="p-4 flex flex-col items-center">
                    <canvas
                      ref={(el) => canvasRefs.current[qrCode.id] = el}
                      className="w-full max-w-[200px]"
                    />
                    <p className="text-xs text-center mt-2 text-muted-foreground print:text-black">
                      ID: {qrCode.id.substring(0, 8)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border print:hidden">
        <Button variant="outline" onClick={onClose} data-testid="button-close-blank-qr">
          Close
        </Button>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
}

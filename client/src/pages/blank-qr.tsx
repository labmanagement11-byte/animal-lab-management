import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, QrCode as QrCodeIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { QrCode } from "@shared/schema";

export default function BlankQrPage() {
  const { toast } = useToast();
  const [count, setCount] = useState(1);
  const [generatedQrCodes, setGeneratedQrCodes] = useState<QrCode[]>([]);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const generateQrMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await apiRequest<QrCode[]>("POST", "/api/qr-codes/generate-blank", { count });
      return response;
    },
    onSuccess: (data: QrCode[]) => {
      setGeneratedQrCodes(data);
      toast({
        title: "Éxito",
        description: `Se generaron ${data.length} código${data.length > 1 ? 's' : ''} QR en blanco exitosamente`,
      });
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
        description: "Error al generar códigos QR",
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
        description: "La cantidad debe estar entre 1 y 20",
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
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <QrCodeIcon className="w-8 h-8" />
          Generar QR en Blanco
        </h1>
        <p className="text-muted-foreground mt-2">
          Crea códigos QR en blanco para imprimir y vincular posteriormente con jaulas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar Códigos QR</CardTitle>
          <CardDescription>
            Crea entre 1 y 20 códigos QR en blanco. Imprime y escanea luego para vincularlos con jaulas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="qr-count">Cantidad de códigos QR (1-20)</Label>
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
                {generateQrMutation.isPending ? "Generando..." : "Generar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedQrCodes.length > 0 && (
        <>
          <div className="flex gap-2 print:hidden mt-6">
            <Button
              onClick={handlePrint}
              className="flex-1"
              data-testid="button-print-qr"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Códigos QR
            </Button>
          </div>

          <div className="print-content mt-6">
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

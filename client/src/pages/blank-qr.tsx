import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, QrCode as QrCodeIcon, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { QrCode } from "@shared/schema";

export default function BlankQrPage() {
  const { toast } = useToast();
  const qrSize = 150; // Tamaño fijo óptimo para las etiquetas
  const [selectedQrs, setSelectedQrs] = useState<Set<string>>(new Set());
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const { data: allQrCodes, refetch: refetchQrs } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes'],
  });

  const blankQrCodes = allQrCodes?.filter(qr => qr.isBlank && !qr.cageId) || [];

  const generateQrMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/qr-codes/generate-blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      return response.json() as Promise<QrCode[]>;
    },
    onSuccess: (data: QrCode[]) => {
      refetchQrs();
      toast({
        title: "Éxito",
        description: `Se generaron 72 códigos QR en blanco exitosamente`,
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

  const deleteQrMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map(id =>
          apiRequest(`/api/qr-codes/${id}`, {
            method: "DELETE",
          })
        )
      );
    },
    onSuccess: () => {
      refetchQrs();
      setSelectedQrs(new Set());
      toast({
        title: "Éxito",
        description: "Códigos QR eliminados exitosamente",
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
        description: "Error al eliminar códigos QR",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (blankQrCodes.length > 0) {
      blankQrCodes.forEach((qrCode) => {
        const canvas = canvasRefs.current[qrCode.id];
        if (canvas) {
          QRCode.toCanvas(canvas, qrCode.qrData, {
            width: qrSize,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        }
      });
    }
  }, [blankQrCodes, qrSize]);

  const handleGenerate = () => {
    generateQrMutation.mutate();
  };

  const handleDeleteSelected = () => {
    if (selectedQrs.size === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un código QR para eliminar",
        variant: "destructive",
      });
      return;
    }
    deleteQrMutation.mutate(Array.from(selectedQrs));
  };

  const handleSelectAll = () => {
    if (selectedQrs.size === blankQrCodes.length) {
      setSelectedQrs(new Set());
    } else {
      setSelectedQrs(new Set(blankQrCodes.map(qr => qr.id)));
    }
  };

  const handleSelectQr = (qrId: string) => {
    const newSelected = new Set(selectedQrs);
    if (newSelected.has(qrId)) {
      newSelected.delete(qrId);
    } else {
      newSelected.add(qrId);
    }
    setSelectedQrs(newSelected);
  };

  const handlePrintSelected = () => {
    if (selectedQrs.size === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un código QR para imprimir",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedQrData = blankQrCodes.filter(qr => selectedQrs.has(qr.id));
    
    // Dividir los QR codes en páginas de 72 etiquetas
    const qrCodesPerPage = 72;
    const pages: string[] = [];
    
    for (let i = 0; i < selectedQrData.length; i += qrCodesPerPage) {
      const pageQrCodes = selectedQrData.slice(i, i + qrCodesPerPage);
      let pageHtml = '';
      const isLastPage = i + qrCodesPerPage >= selectedQrData.length;
      
      pageQrCodes.forEach((qrCode) => {
        const canvas = canvasRefs.current[qrCode.id];
        if (canvas) {
          const dataUrl = canvas.toDataURL();
          pageHtml += `
            <div class="qr-label">
              <img src="${dataUrl}" alt="QR Code" />
              <p>${qrCode.id.substring(0, 8)}</p>
            </div>
          `;
        }
      });
      
      pages.push(`<div class="page${isLastPage ? ' last-page' : ''}">${pageHtml}</div>`);
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Códigos QR - Formato Etiquetas (${selectedQrData.length} códigos)</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
            }
            
            /* Formato para pantalla - vista previa */
            @media screen {
              body {
                background: #f0f0f0;
                padding: 20px;
              }
              .page {
                background: white;
                width: 8.5in;
                height: 11in;
                margin: 0 auto 20px;
                padding: 0;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                display: grid;
                grid-template-columns: repeat(6, 1.26in);
                grid-template-rows: repeat(12, 0.87in);
                gap: 0;
              }
              .qr-label {
                width: 1.26in;
                height: 0.87in;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border: 1px dashed #ddd;
                padding: 0;
              }
              .qr-label img {
                width: 0.6in;
                height: 0.6in;
                object-fit: contain;
                margin-bottom: 2px;
              }
              .qr-label p {
                font-size: 5px;
                margin: 0;
                color: #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
              }
            }
            
            /* Formato para impresión - exacto */
            @media print {
              @page {
                size: 8.5in 11in;
                margin: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
              }
              
              .page {
                width: 8.5in;
                height: 11in;
                margin: 0;
                padding: 0;
                display: grid;
                grid-template-columns: repeat(6, 1.26in);
                grid-template-rows: repeat(12, 0.87in);
                gap: 0;
                page-break-after: always;
              }
              
              .page.last-page {
                page-break-after: avoid;
              }
              
              .qr-label {
                width: 1.26in;
                height: 0.87in;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 0;
                page-break-inside: avoid;
              }
              
              .qr-label img {
                width: 0.6in;
                height: 0.6in;
                object-fit: contain;
                margin-bottom: 2px;
              }
              
              .qr-label p {
                font-size: 5px;
                margin: 0;
                color: #000;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          ${pages.join('')}
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 500);
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 max-w-7xl">
      <div className="mb-4 md:mb-6 ml-[122px] mr-[122px]">
        <h1 className="text-lg md:text-3xl font-bold text-foreground flex items-center gap-2">
          <QrCodeIcon className="w-6 h-6 md:w-8 md:w-8" />
          Generar QR en Blanco
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-2">
          Crea códigos QR en blanco para imprimir y vincular posteriormente con jaulas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generador */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generar Códigos QR</CardTitle>
            <CardDescription>
              Genera automáticamente 72 códigos QR en blanco (1 hoja completa)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                Se generarán 72 códigos QR
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Formato: 6 columnas × 12 filas en hoja carta (1.26" × 0.87")
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateQrMutation.isPending}
              className="w-full"
              data-testid="button-generate-qr"
            >
              {generateQrMutation.isPending ? "Generando..." : "Generar 72 Códigos QR"}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de QR Codes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Códigos QR Disponibles ({blankQrCodes.length})</CardTitle>
                <CardDescription>
                  Selecciona los códigos que deseas imprimir
                </CardDescription>
              </div>
              {blankQrCodes.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    data-testid="button-select-all"
                  >
                    {selectedQrs.size === blankQrCodes.length ? "Deseleccionar todo" : "Seleccionar todo"}
                  </Button>
                  <Button
                    onClick={handlePrintSelected}
                    disabled={selectedQrs.size === 0}
                    size="sm"
                    data-testid="button-print-selected"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir ({selectedQrs.size})
                  </Button>
                  <Button
                    onClick={handleDeleteSelected}
                    disabled={selectedQrs.size === 0 || deleteQrMutation.isPending}
                    size="sm"
                    variant="destructive"
                    data-testid="button-delete-selected"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteQrMutation.isPending ? "Eliminando..." : `Eliminar (${selectedQrs.size})`}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {blankQrCodes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {blankQrCodes.map((qrCode) => (
                  <Card 
                    key={qrCode.id} 
                    className={`cursor-pointer transition-all ${
                      selectedQrs.has(qrCode.id) 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSelectQr(qrCode.id)}
                    data-testid={`qr-card-${qrCode.id}`}
                  >
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="flex items-center justify-between w-full mb-2">
                        <Checkbox 
                          checked={selectedQrs.has(qrCode.id)}
                          onCheckedChange={() => handleSelectQr(qrCode.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-${qrCode.id}`}
                        />
                      </div>
                      <canvas
                        ref={(el) => canvasRefs.current[qrCode.id] = el}
                        className="w-full"
                      />
                      <p className="text-xs text-center mt-2 text-muted-foreground">
                        ID: {qrCode.id.substring(0, 8)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <QrCodeIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hay códigos QR disponibles</h3>
                <p className="text-sm text-muted-foreground">
                  Genera códigos QR usando el formulario de la izquierda
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

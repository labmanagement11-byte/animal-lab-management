import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, QrCode as QrCodeIcon, Trash2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { QrCode } from "@shared/schema";

interface LabelData {
  labelText: string;
  secondaryText: string;
  backgroundColor: string;
}

export default function BlankQrPage() {
  const { toast } = useToast();
  const qrSize = 150;
  const QR_COUNT = 30; // Ahora generamos 30 códigos QR
  const [selectedQrs, setSelectedQrs] = useState<Set<string>>(new Set());
  const [labelData, setLabelData] = useState<LabelData[]>(
    Array(QR_COUNT).fill(null).map(() => ({
      labelText: '',
      secondaryText: '',
      backgroundColor: '#a8d5ba'
    }))
  );
  const [showInputs, setShowInputs] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customSecondaryText, setCustomSecondaryText] = useState('');
  const [customColor, setCustomColor] = useState('#a8d5ba');
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const { data: allQrCodes, refetch: refetchQrs } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes'],
  });

  const blankQrCodes = allQrCodes?.filter(qr => qr.isBlank && !qr.cageId) || [];

  const generateQrMutation = useMutation({
    mutationFn: async (data: LabelData[]) => {
      const response = await apiRequest("/api/qr-codes/generate-blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelData: data }),
      });
      return response.json() as Promise<QrCode[]>;
    },
    onSuccess: (data: QrCode[]) => {
      refetchQrs();
      setShowInputs(false);
      setLabelData(Array(QR_COUNT).fill(null).map(() => ({
        labelText: '',
        secondaryText: '',
        backgroundColor: '#a8d5ba'
      })));
      toast({
        title: "Éxito",
        description: `Se generaron ${QR_COUNT} códigos QR con texto personalizado exitosamente`,
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
        description: error.message || "Error al generar códigos QR",
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
    // Validate that at least one label has text
    const hasText = labelData.some(data => data.labelText.trim() !== '');
    if (!hasText) {
      toast({
        title: "Error",
        description: "Ingresa al menos un texto para generar los códigos QR",
        variant: "destructive",
      });
      return;
    }
    generateQrMutation.mutate(labelData);
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

  const handleAutofill = () => {
    if (!customText.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un texto para auto-rellenar",
        variant: "destructive",
      });
      return;
    }
    const newData = Array(QR_COUNT).fill(null).map(() => ({
      labelText: customText.trim(),
      secondaryText: customSecondaryText.trim(),
      backgroundColor: customColor
    }));
    setLabelData(newData);
    setCustomText('');
    setCustomSecondaryText('');
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
    
    // Dividir los QR codes en páginas de 30 etiquetas (Avery 8160)
    const qrCodesPerPage = 30;
    const pages: string[] = [];
    
    for (let i = 0; i < selectedQrData.length; i += qrCodesPerPage) {
      const pageQrCodes = selectedQrData.slice(i, i + qrCodesPerPage);
      let pageHtml = '';
      const isLastPage = i + qrCodesPerPage >= selectedQrData.length;
      
      pageQrCodes.forEach((qrCode) => {
        const canvas = canvasRefs.current[qrCode.id];
        if (canvas) {
          const dataUrl = canvas.toDataURL();
          const bgColor = qrCode.backgroundColor || '#a8d5ba';
          pageHtml += `
            <div class="qr-label" style="background-color: ${bgColor};">
              <div class="label-content">
                <div class="text-section">
                  <div class="label-main-text">${qrCode.labelText || ''}</div>
                  <div class="label-secondary-text">${qrCode.secondaryText || ''}</div>
                  <div class="label-tertiary-text">Merghoub Lab</div>
                </div>
                <div class="qr-section">
                  <img src="${dataUrl}" alt="QR Code" />
                </div>
              </div>
              <div class="label-footer"></div>
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
          <title>Imprimir Códigos QR - Avery 8160 (${selectedQrData.length} códigos)</title>
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
                padding: 0.5in 0.1875in;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                display: grid;
                grid-template-columns: repeat(3, 2.625in);
                grid-template-rows: repeat(10, 1in);
                gap: 0;
              }
              .qr-label {
                width: 2.625in;
                height: 1in;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                border: 1px dashed #ddd;
                box-sizing: border-box;
                overflow: hidden;
              }
              .label-content {
                flex: 1;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                padding: 0.1in 0.15in 0.05in 0.15in;
                gap: 0.15in;
              }
              .text-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-end;
                gap: 0.02in;
                max-width: calc(100% - 0.75in);
              }
              .label-main-text {
                font-size: 14px;
                font-weight: bold;
                color: #000;
                white-space: nowrap;
                text-align: right;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
              }
              .label-secondary-text {
                font-size: 8px;
                color: #000;
                white-space: nowrap;
                text-align: right;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
              }
              .label-tertiary-text {
                font-size: 7px;
                color: #000;
                white-space: nowrap;
                text-align: right;
                font-style: italic;
              }
              .qr-section {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-section img {
                width: 0.6in;
                height: 0.6in;
                object-fit: contain;
                display: block;
              }
              .label-footer {
                height: 0.12in;
                background-color: #000;
                width: 100%;
                flex-shrink: 0;
              }
            }
            
            /* Formato para impresión - Avery 8160 exacto */
            @media print {
              @page {
                size: 8.5in 11in;
                margin: 0.5in 0.1875in 0.5in 0.1875in;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              html, body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .page {
                width: 8.125in;
                height: 10in;
                margin: 0;
                padding: 0;
                display: grid;
                grid-template-columns: repeat(3, 2.625in);
                grid-template-rows: repeat(10, 1in);
                column-gap: 0;
                row-gap: 0;
                page-break-after: always;
              }
              
              .page.last-page {
                page-break-after: avoid;
              }
              
              .qr-label {
                width: 2.625in;
                height: 1in;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-sizing: border-box;
                page-break-inside: avoid;
                overflow: hidden;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .label-content {
                flex: 1;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                padding: 0.1in 0.15in 0.05in 0.15in;
                gap: 0.15in;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .text-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-end;
                gap: 0.02in;
                max-width: calc(100% - 0.75in);
              }
              
              .label-main-text {
                font-size: 14px;
                font-weight: bold;
                color: #000 !important;
                white-space: nowrap;
                text-align: right;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
              }
              
              .label-secondary-text {
                font-size: 8px;
                color: #000 !important;
                white-space: nowrap;
                text-align: right;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
              }
              
              .label-tertiary-text {
                font-size: 7px;
                color: #000 !important;
                white-space: nowrap;
                text-align: right;
                font-style: italic;
              }
              
              .qr-section {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .qr-section img {
                width: 0.6in;
                height: 0.6in;
                object-fit: contain;
                display: block;
              }
              
              .label-footer {
                height: 0.12in;
                background-color: #000 !important;
                width: 100%;
                flex-shrink: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
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
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-3xl font-bold text-foreground flex items-center gap-2">
          <QrCodeIcon className="w-6 h-6 md:w-8 md:h-8" />
          Generar QR con Texto Personalizado
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-2">
          Crea 30 códigos QR con texto personalizado para imprimir en formato Avery 8160
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generador */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generar 30 Códigos QR</CardTitle>
            <CardDescription>
              Ingresa el texto personalizado para cada etiqueta (Avery 8160)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                Se generarán 30 códigos QR
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Formato: 3 columnas × 10 filas en hoja carta (1" × 2⅝" - Avery 8160)
              </p>
            </div>

            {!showInputs ? (
              <Button
                onClick={() => setShowInputs(true)}
                className="w-full"
                data-testid="button-show-inputs"
              >
                Ingresar Textos Personalizados
              </Button>
            ) : (
              <>
                <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-lg">
                  <label className="text-sm font-medium">Auto-rellenar todos los QR con los mismos valores</label>
                  <Input
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Texto principal (ej: Pmel)"
                    data-testid="input-custom-text"
                  />
                  <Input
                    value={customSecondaryText}
                    onChange={(e) => setCustomSecondaryText(e.target.value)}
                    placeholder="Texto secundario (ej: 000-000-000-000)"
                    className="text-sm"
                    data-testid="input-custom-secondary"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Color de fondo:</label>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-8 w-16 cursor-pointer rounded border"
                      data-testid="input-custom-color"
                    />
                    <span className="text-xs text-muted-foreground flex-1">{customColor}</span>
                    <Button
                      onClick={handleAutofill}
                      variant="outline"
                      size="sm"
                      data-testid="button-autofill"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Auto-rellenar
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end mb-2">
                  <Button
                    onClick={() => setLabelData(Array(QR_COUNT).fill(null).map(() => ({
                      labelText: '',
                      secondaryText: '',
                      backgroundColor: '#a8d5ba'
                    })))}
                    variant="outline"
                    size="sm"
                    data-testid="button-clear"
                  >
                    Limpiar Todo
                  </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  {labelData.map((data, index) => (
                    <div key={index} className="space-y-2 mb-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-8">{index + 1}.</span>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={data.labelText}
                            onChange={(e) => {
                              const newData = [...labelData];
                              newData[index] = { ...newData[index], labelText: e.target.value };
                              setLabelData(newData);
                            }}
                            placeholder="Texto principal (ej: Pmel)"
                            className="w-full"
                            data-testid={`input-label-${index}`}
                          />
                          <Input
                            value={data.secondaryText}
                            onChange={(e) => {
                              const newData = [...labelData];
                              newData[index] = { ...newData[index], secondaryText: e.target.value };
                              setLabelData(newData);
                            }}
                            placeholder="Texto secundario (ej: 000-000-000-000)"
                            className="w-full text-sm"
                            data-testid={`input-secondary-${index}`}
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Color:</label>
                            <input
                              type="color"
                              value={data.backgroundColor}
                              onChange={(e) => {
                                const newData = [...labelData];
                                newData[index] = { ...newData[index], backgroundColor: e.target.value };
                                setLabelData(newData);
                              }}
                              className="h-8 w-16 cursor-pointer rounded border"
                              data-testid={`input-color-${index}`}
                            />
                            <span className="text-xs text-muted-foreground">{data.backgroundColor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowInputs(false)}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generateQrMutation.isPending}
                    className="flex-1"
                    data-testid="button-generate-qr"
                  >
                    {generateQrMutation.isPending ? "Generando..." : `Generar ${QR_COUNT} QR`}
                  </Button>
                </div>
              </>
            )}
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
                      {qrCode.labelText && (
                        <p className="text-sm font-bold text-center mb-2 text-foreground">
                          {qrCode.labelText}
                        </p>
                      )}
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

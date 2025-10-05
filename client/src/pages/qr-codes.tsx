import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, QrCode as QrCodeIcon, Calendar, Box } from "lucide-react";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import type { QrCode, Cage } from "@shared/schema";
import { formatDate } from "@/utils/dateUtils";

export default function QrCodes() {
  const { data: qrCodes, isLoading } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes'],
  });

  const { data: cages } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    if (qrCodes && qrCodes.length > 0) {
      qrCodes.forEach((qrCode) => {
        const canvas = canvasRefs.current[qrCode.id];
        if (canvas && qrCode.qrData) {
          QRCode.toCanvas(canvas, qrCode.qrData, {
            width: 150,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        }
      });
    }
  }, [qrCodes]);

  const getCageName = (cageId: string | null) => {
    if (!cageId || !cages) return 'Blank QR';
    const cage = cages.find(c => c.id === cageId);
    return cage ? cage.cageNumber : 'Unknown Cage';
  };

  const handlePrint = (qrCode: QrCode) => {
    const canvas = canvasRefs.current[qrCode.id];
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cage = cages?.find(c => c.id === qrCode.cageId);
    const qrDataUrl = canvas.toDataURL();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .print-container {
              text-align: center;
              max-width: 400px;
            }
            .qr-image {
              margin: 20px 0;
            }
            .info {
              margin: 10px 0;
              font-size: 14px;
            }
            .title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            @media print {
              body {
                display: flex;
                justify-content: center;
                align-items: center;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="title">${qrCode.isBlank ? 'Blank QR Code' : 'Cage QR Code'}</div>
            ${cage ? `<div class="info"><strong>Cage:</strong> ${cage.cageNumber}</div>` : ''}
            ${cage ? `<div class="info"><strong>Room:</strong> ${cage.roomNumber}</div>` : ''}
            <div class="qr-image">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="info"><strong>Created:</strong> ${formatDate(qrCode.createdAt)}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground">QR Codes</h2>
          <p className="text-sm text-muted-foreground">Loading QR codes...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-40 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">QR Codes</h2>
          <p className="text-sm text-muted-foreground">View and print all generated QR codes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm" data-testid="badge-total-qr-codes">
            <QrCodeIcon className="w-4 h-4 mr-1" />
            {qrCodes?.length || 0} Total
          </Badge>
        </div>
      </div>

      {/* QR Codes Grid */}
      {qrCodes && qrCodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {qrCodes.map((qrCode) => (
            <Card key={qrCode.id} className="hover:shadow-lg transition-shadow" data-testid={`card-qr-${qrCode.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {getCageName(qrCode.cageId)}
                  </CardTitle>
                  <Badge variant={qrCode.isBlank ? "secondary" : "default"} data-testid={`badge-type-${qrCode.id}`}>
                    {qrCode.isBlank ? 'Blank' : 'Assigned'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* QR Code Display */}
                <div className="flex justify-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[qrCode.id] = el;
                    }}
                    data-testid={`canvas-qr-${qrCode.id}`}
                  />
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm mb-4">
                  {qrCode.cageId && cages && (
                    <div className="flex items-center text-muted-foreground">
                      <Box className="w-4 h-4 mr-2" />
                      <span>{cages.find(c => c.id === qrCode.cageId)?.roomNumber || 'N/A'}</span>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(qrCode.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handlePrint(qrCode)}
                  data-testid={`button-print-${qrCode.id}`}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print QR Code
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <QrCodeIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No QR Codes Found</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-no-qr-codes">
                Generate QR codes from the Animals or Cages pages
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

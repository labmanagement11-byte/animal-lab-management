import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, QrCode as QrCodeIcon, Calendar, Box, Trash2, RotateCcw, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { QrCode, Cage } from "@shared/schema";
import { formatDate } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function QrCodes() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("used");
  
  const { data: qrCodes, isLoading } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes'],
  });

  const { data: deletedQrCodes, isLoading: isLoadingDeleted } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes-trash'],
  });

  const { data: cages } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const deleteQrMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/qr-codes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "QR Code deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes-trash'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete QR code",
        variant: "destructive",
      });
    },
  });

  const restoreQrMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/qr-codes/${id}/restore`, { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "QR Code restored successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes-trash'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore QR code",
        variant: "destructive",
      });
    },
  });

  // Export functions
  const prepareExportData = () => {
    let dataToExport: QrCode[] = [];
    
    switch(activeTab) {
      case 'used':
        dataToExport = qrCodes?.filter(qr => !qr.isBlank && qr.cageId) || [];
        break;
      case 'blank':
        dataToExport = qrCodes?.filter(qr => qr.isBlank || !qr.cageId) || [];
        break;
      case 'trash':
        dataToExport = deletedQrCodes || [];
        break;
      default:
        dataToExport = qrCodes || [];
    }
    
    return dataToExport.map(qr => ({
      'QR ID': qr.id,
      'Type': qr.isBlank ? 'Blank' : 'Assigned',
      'Cage': getCageName(qr.cageId),
      'Room': qr.cageId && cages ? cages.find(c => c.id === qr.cageId)?.roomNumber || 'N/A' : 'N/A',
      'Created Date': formatDate(qr.createdAt),
      'Status': activeTab === 'trash' ? 'Deleted' : 'Active'
    }));
  };

  const exportToCSV = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `qr-codes-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "QR codes exported to CSV successfully!",
    });
  };

  const exportToExcel = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QR Codes');
    XLSX.writeFile(wb, `qr-codes-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Success",
      description: "QR codes exported to Excel successfully!",
    });
  };

  const exportToPDF = () => {
    const data = prepareExportData();
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('QR Codes Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Status: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    
    autoTable(doc, {
      startY: 45,
      head: [['QR ID', 'Type', 'Cage', 'Room', 'Created Date', 'Status']],
      body: data.map(row => [
        row['QR ID'].substring(0, 8) + '...',
        row['Type'],
        row['Cage'],
        row['Room'],
        row['Created Date'],
        row['Status']
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    doc.save(`qr-codes-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Success",
      description: "QR codes exported to PDF successfully!",
    });
  };

  useEffect(() => {
    const allQrCodes = [...(qrCodes || []), ...(deletedQrCodes || [])];
    if (allQrCodes.length > 0) {
      allQrCodes.forEach((qrCode) => {
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
  }, [qrCodes, deletedQrCodes]);

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

  const renderQrCodeCard = (qrCode: QrCode, isDeleted: boolean = false) => (
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
        <div className="flex gap-2">
          {!isDeleted ? (
            <>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handlePrint(qrCode)}
                data-testid={`button-print-${qrCode.id}`}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => deleteQrMutation.mutate(qrCode.id)}
                disabled={deleteQrMutation.isPending}
                data-testid={`button-delete-${qrCode.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => restoreQrMutation.mutate(qrCode.id)}
              disabled={restoreQrMutation.isPending}
              data-testid={`button-restore-${qrCode.id}`}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading || isLoadingDeleted) {
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
      <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-semibold text-foreground">QR Codes</h2>
          <p className="text-xs md:text-sm text-muted-foreground">View and manage all generated QR codes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm" data-testid="badge-used-qr-codes">
            <QrCodeIcon className="w-4 h-4 mr-1" />
            {qrCodes?.filter(qr => !qr.isBlank && qr.cageId).length || 0} Used
          </Badge>
          <Badge variant="secondary" className="text-sm" data-testid="badge-blank-qr-codes">
            <QrCodeIcon className="w-4 h-4 mr-1" />
            {qrCodes?.filter(qr => qr.isBlank || !qr.cageId).length || 0} Blank
          </Badge>
          {(deletedQrCodes?.length || 0) > 0 && (
            <Badge variant="destructive" className="text-sm" data-testid="badge-deleted-qr-codes">
              <Trash2 className="w-4 h-4 mr-1" />
              {deletedQrCodes?.length || 0} Deleted
            </Badge>
          )}
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV} data-testid="menu-export-csv">
                <FileText className="w-4 h-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} data-testid="menu-export-excel">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} data-testid="menu-export-pdf">
                <FileText className="w-4 h-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Used QR Codes Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">QR Codes Usados</CardTitle>
              <QrCodeIcon className="w-8 h-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-primary mb-2">
                {qrCodes?.filter(qr => !qr.isBlank && qr.cageId).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Códigos QR asignados a jaulas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Blank QR Codes Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">QR Codes en Blanco</CardTitle>
              <QrCodeIcon className="w-8 h-8 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-secondary-foreground mb-2">
                {qrCodes?.filter(qr => qr.isBlank || !qr.cageId).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Códigos QR disponibles para usar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deleted QR Codes Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">QR Codes Eliminados</CardTitle>
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-destructive mb-2">
                {deletedQrCodes?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Códigos QR en la papelera
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

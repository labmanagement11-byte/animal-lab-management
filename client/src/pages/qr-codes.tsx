import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode as QrCodeIcon, Trash2, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import type { QrCode } from "@shared/schema";
import { formatDate } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function QrCodes() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("used");
  
  const { data: qrCodes, isLoading } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes'],
  });

  const { data: deletedQrCodes, isLoading: isLoadingDeleted } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes-trash'],
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
      'Label Text': qr.labelText || 'N/A',
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
      head: [['QR ID', 'Type', 'Label Text', 'Created Date', 'Status']],
      body: data.map(row => [
        row['QR ID'].substring(0, 8) + '...',
        row['Type'],
        row['Label Text'],
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
        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${activeTab === 'used' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveTab('used')}
          data-testid="card-used-qr"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Used QR Codes</CardTitle>
              <QrCodeIcon className="w-8 h-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-primary mb-2">
                {qrCodes?.filter(qr => !qr.isBlank && qr.cageId).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                QR codes assigned to cages
              </p>
              {activeTab === 'used' && (
                <p className="text-xs text-primary mt-2 font-medium">
                  Selected for export
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blank QR Codes Card */}
        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${activeTab === 'blank' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveTab('blank')}
          data-testid="card-blank-qr"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Blank QR Codes</CardTitle>
              <QrCodeIcon className="w-8 h-8 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-secondary-foreground mb-2">
                {qrCodes?.filter(qr => qr.isBlank || !qr.cageId).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                QR codes available to use
              </p>
              {activeTab === 'blank' && (
                <p className="text-xs text-primary mt-2 font-medium">
                  Selected for export
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deleted QR Codes Card */}
        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${activeTab === 'trash' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveTab('trash')}
          data-testid="card-trash-qr"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Deleted QR Codes</CardTitle>
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold mb-2 text-[#104acc]">
                {deletedQrCodes?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                QR codes in the trash
              </p>
              {activeTab === 'trash' && (
                <p className="text-xs text-primary mt-2 font-medium">
                  Selected for export
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

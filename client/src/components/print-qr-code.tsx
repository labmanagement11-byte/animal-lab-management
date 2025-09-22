import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import type { Animal } from "@shared/schema";
import { calculateAge, formatDate } from "@/utils/dateUtils";

interface PrintQrCodeProps {
  animal: Animal;
  qrDataUrl?: string;
}

export default function PrintQrCode({ animal, qrDataUrl }: PrintQrCodeProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Animal QR Code - ${animal.animalNumber}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: white;
                }
                .print-container {
                  max-width: 600px;
                  margin: 0 auto;
                  border: 2px solid #000;
                  padding: 20px;
                  page-break-inside: avoid;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 15px;
                  margin-bottom: 20px;
                }
                .title {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .subtitle {
                  font-size: 14px;
                  color: #666;
                }
                .content {
                  display: flex;
                  gap: 30px;
                  align-items: flex-start;
                }
                .qr-section {
                  flex-shrink: 0;
                  text-align: center;
                }
                .qr-code {
                  border: 1px solid #ccc;
                  padding: 10px;
                  background: white;
                }
                .info-section {
                  flex: 1;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 10px 20px;
                  margin-bottom: 15px;
                }
                .info-item {
                  padding: 8px 0;
                  border-bottom: 1px solid #eee;
                }
                .label {
                  font-weight: bold;
                  color: #333;
                  font-size: 12px;
                  margin-bottom: 2px;
                }
                .value {
                  font-size: 14px;
                  color: #000;
                }
                .notes {
                  margin-top: 15px;
                  padding: 10px;
                  background: #f9f9f9;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                }
                .footer {
                  margin-top: 20px;
                  padding-top: 15px;
                  border-top: 1px solid #ddd;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .print-container { border: 2px solid #000; page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      }
    }
  };

  const handleDownloadPDF = () => {
    // Simple download implementation - could be enhanced with a proper PDF library
    const link = document.createElement('a');
    if (qrDataUrl) {
      link.href = qrDataUrl;
      link.download = `animal-${animal.animalNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFieldValue = (value: any, field: string) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    if (field === 'dateOfBirth' && value) {
      const age = calculateAge(new Date(value));
      return `${formatDate(new Date(value))} (${age})`;
    }
    
    if (field === 'weight' && value) {
      return `${value}g`;
    }
    
    if ((field === 'breedingStartDate' || field === 'dateOfGenotyping') && value) {
      return formatDate(new Date(value));
    }
    
    return value.toString();
  };

  return (
    <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-print-qr">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Animal Information & QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Print Preview */}
          <div ref={printRef} className="print-container">
            <div className="header">
              <div className="title">Laboratory Animal Information</div>
              <div className="subtitle">Animal ID: {animal.animalNumber}</div>
            </div>
            
            <div className="content">
              {qrDataUrl && (
                <div className="qr-section">
                  <div className="qr-code">
                    <img 
                      src={qrDataUrl} 
                      alt={`QR Code for ${animal.animalNumber}`}
                      style={{ width: '150px', height: '150px' }}
                    />
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    QR Code
                  </div>
                </div>
              )}
              
              <div className="info-section">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="label">Animal Number</div>
                    <div className="value">{animal.animalNumber}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Breed</div>
                    <div className="value">{animal.breed || 'N/A'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Gender</div>
                    <div className="value">{animal.gender || 'N/A'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Health Status</div>
                    <div className="value">{animal.healthStatus || 'N/A'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Date of Birth</div>
                    <div className="value">{formatFieldValue(animal.dateOfBirth, 'dateOfBirth')}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Weight</div>
                    <div className="value">{formatFieldValue(animal.weight, 'weight')}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Genotype</div>
                    <div className="value">{animal.genotype || 'N/A'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Color</div>
                    <div className="value">{animal.color || 'N/A'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Generation</div>
                    <div className="value">{animal.generation || 'N/A'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Protocol</div>
                    <div className="value">{animal.protocol || 'N/A'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Breeding Start</div>
                    <div className="value">{formatFieldValue(animal.breedingStartDate, 'breedingStartDate')}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Date of Genotyping</div>
                    <div className="value">{formatFieldValue(animal.dateOfGenotyping, 'dateOfGenotyping')}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Probes</div>
                    <div className="value">{animal.probes ? 'Yes' : 'No'}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="label">Diseases</div>
                    <div className="value">{animal.diseases || 'None'}</div>
                  </div>
                </div>
                
                {animal.notes && (
                  <div className="notes">
                    <div className="label">Notes:</div>
                    <div style={{ marginTop: '5px' }}>{animal.notes}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="footer">
              <div>Laboratory Animal Management System</div>
              <div>Generated on: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={!qrDataUrl}
              data-testid="button-download-pdf"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
            <Button onClick={handlePrint} data-testid="button-print-document">
              <Printer className="w-4 h-4 mr-2" />
              Print Document
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPrintDialog(false)}
              data-testid="button-close-print"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
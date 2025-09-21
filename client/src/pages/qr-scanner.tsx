import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScannedAnimalData {
  animalId: string;
  animalNumber: string;
  cageId?: string;
  breed: string;
  age?: number;
  weight?: string;
  gender?: string;
  healthStatus?: string;
  diseases?: string;
  notes?: string;
}

export default function QrScanner() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedAnimalData | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const simulateQrScan = () => {
    // Simulate QR code scan with sample data
    const sampleData: ScannedAnimalData = {
      animalId: "animal-123",
      animalNumber: "M-247",
      cageId: "C-089",
      breed: "C57BL/6",
      age: 12,
      weight: "23.5",
      gender: "Male",
      healthStatus: "Healthy",
      diseases: "",
      notes: "Regular health check completed"
    };
    
    setScannedData(sampleData);
    stopCamera();
    
    toast({
      title: "QR Code Scanned",
      description: "Animal information loaded successfully",
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">QR Code Scanner</h2>
          <p className="text-muted-foreground">Scan QR codes to view animal information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isScanning ? (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Click to start camera</p>
                    <Button onClick={startCamera} data-testid="button-start-camera">
                      Start Scanner
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary rounded-lg"></div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                {isScanning ? (
                  <>
                    <Button variant="outline" onClick={stopCamera} data-testid="button-stop-camera">
                      Stop Scanner
                    </Button>
                    <Button onClick={simulateQrScan} data-testid="button-simulate-scan">
                      Simulate Scan (Demo)
                    </Button>
                  </>
                ) : (
                  <Button onClick={simulateQrScan} variant="outline" data-testid="button-demo-scan">
                    Demo Scan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanned Data */}
        <Card>
          <CardHeader>
            <CardTitle>Scanned Animal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {scannedData ? (
              <div className="space-y-4" data-testid="scanned-data">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Animal ID</label>
                    <p className="text-foreground font-medium" data-testid="text-scanned-animal-id">
                      {scannedData.animalNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cage ID</label>
                    <p className="text-foreground" data-testid="text-scanned-cage-id">
                      {scannedData.cageId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Breed</label>
                    <p className="text-foreground" data-testid="text-scanned-breed">
                      {scannedData.breed}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Age</label>
                    <p className="text-foreground" data-testid="text-scanned-age">
                      {scannedData.age ? `${scannedData.age} weeks` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Weight</label>
                    <p className="text-foreground" data-testid="text-scanned-weight">
                      {scannedData.weight ? `${scannedData.weight}g` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-foreground" data-testid="text-scanned-gender">
                      {scannedData.gender || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Health Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(scannedData.healthStatus || 'Healthy')} data-testid="status-scanned">
                      {scannedData.healthStatus}
                    </Badge>
                  </div>
                </div>

                {scannedData.diseases && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Diseases/Conditions</label>
                    <p className="text-foreground mt-1" data-testid="text-scanned-diseases">
                      {scannedData.diseases}
                    </p>
                  </div>
                )}

                {scannedData.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-foreground mt-1" data-testid="text-scanned-notes">
                      {scannedData.notes}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setScannedData(null)} data-testid="button-clear-data">
                    Clear Data
                  </Button>
                  <Button data-testid="button-view-full-record">
                    View Full Record
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-scan">
                  No QR code scanned yet. Use the scanner to scan an animal QR code.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

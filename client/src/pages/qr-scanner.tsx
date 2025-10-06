import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Camera, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Cage, QrCode as QrCodeType } from "@shared/schema";

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

interface BlankQrData {
  id: string;
  qrData: string;
  isBlank: boolean;
}

export default function QrScanner() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedAnimalData | null>(null);
  const [blankQrData, setBlankQrData] = useState<BlankQrData | null>(null);
  const [selectedCageId, setSelectedCageId] = useState<string>("");
  const [qrClaimed, setQrClaimed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: cages } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const claimQrMutation = useMutation({
    mutationFn: async ({ qrId, cageId }: { qrId: string; cageId: string }) => {
      return await apiRequest(`/api/qr-codes/${qrId}/claim`, {
        method: "POST",
        body: JSON.stringify({ cageId }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      setQrClaimed(true);
      toast({
        title: "Success",
        description: "QR code successfully linked to cage",
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
        description: "Failed to link QR code to cage",
        variant: "destructive",
      });
    },
  });

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
    setBlankQrData(null);
    setQrClaimed(false);
    stopCamera();
    
    toast({
      title: "QR Code Scanned",
      description: "Animal information loaded successfully",
    });
  };

  const simulateBlankQrScan = () => {
    // Simulate blank QR code scan
    const blankData: BlankQrData = {
      id: "blank-qr-" + Math.random().toString(36).substr(2, 9),
      qrData: `${window.location.origin}/qr/blank/${Math.random().toString(36).substr(2, 9)}`,
      isBlank: true,
    };
    
    setBlankQrData(blankData);
    setScannedData(null);
    setQrClaimed(false);
    stopCamera();
    
    toast({
      title: "Blank QR Code Scanned",
      description: "Link this QR code to a cage below",
    });
  };

  const handleClaimQr = () => {
    if (!blankQrData || !selectedCageId) {
      toast({
        title: "Error",
        description: "Please select a cage",
        variant: "destructive",
      });
      return;
    }

    claimQrMutation.mutate({ qrId: blankQrData.id, cageId: selectedCageId });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h2 className="text-lg md:text-2xl font-semibold text-foreground">QR Code Scanner</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Scan QR codes to view animal information</p>
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
              
              <div className="flex flex-col space-y-2">
                {isScanning ? (
                  <>
                    <Button variant="outline" onClick={stopCamera} data-testid="button-stop-camera">
                      Stop Scanner
                    </Button>
                    <div className="flex space-x-2">
                      <Button onClick={simulateQrScan} data-testid="button-simulate-scan" className="flex-1">
                        Demo Animal QR
                      </Button>
                      <Button onClick={simulateBlankQrScan} data-testid="button-simulate-blank-qr" className="flex-1" variant="secondary">
                        Demo Blank QR
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={simulateQrScan} variant="outline" data-testid="button-demo-scan" className="flex-1">
                      Demo Animal QR
                    </Button>
                    <Button onClick={simulateBlankQrScan} variant="outline" data-testid="button-demo-blank-scan" className="flex-1">
                      Demo Blank QR
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanned Data */}
        <Card>
          <CardHeader>
            <CardTitle>
              {blankQrData ? "Link Blank QR Code" : "Scanned Animal Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {blankQrData ? (
              <div className="space-y-4" data-testid="blank-qr-data">
                {qrClaimed ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">QR Code Successfully Linked!</h3>
                    <p className="text-muted-foreground mb-4">
                      This QR code is now linked to the selected cage
                    </p>
                    <Button 
                      onClick={() => {
                        setBlankQrData(null);
                        setQrClaimed(false);
                        setSelectedCageId("");
                      }}
                      data-testid="button-scan-another"
                    >
                      Scan Another QR
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">QR Code ID</Label>
                      <p className="text-foreground font-medium mt-1" data-testid="text-blank-qr-id">
                        {blankQrData.id}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="cage-select">Select Cage to Link</Label>
                      <Select
                        value={selectedCageId}
                        onValueChange={setSelectedCageId}
                      >
                        <SelectTrigger id="cage-select" data-testid="select-cage-for-qr">
                          <SelectValue placeholder="Select a cage" />
                        </SelectTrigger>
                        <SelectContent>
                          {cages?.filter(c => c.isActive).map((cage) => (
                            <SelectItem key={cage.id} value={cage.id}>
                              {cage.cageNumber} - {cage.roomNumber} ({cage.location})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setBlankQrData(null)}
                        data-testid="button-cancel-claim"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleClaimQr}
                        disabled={!selectedCageId || claimQrMutation.isPending}
                        data-testid="button-link-qr"
                      >
                        {claimQrMutation.isPending ? "Linking..." : "Link to Cage"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : scannedData ? (
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
                  <Button 
                    onClick={() => setLocation(`/animals`)}
                    data-testid="button-view-full-record"
                  >
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

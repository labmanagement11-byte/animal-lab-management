import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Camera, CheckCircle, Focus, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Cage, QrCode as QrCodeType } from "@shared/schema";
import { Html5Qrcode } from "html5-qrcode";

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
  const [focusMode, setFocusMode] = useState<"auto" | "manual">("auto");
  const [torch, setTorch] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

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

  const initializeFocusControl = async () => {
    // Wait for video element to be ready
    let video: HTMLVideoElement | null = null;
    for (let i = 0; i < 20; i++) {
      video = document.querySelector('#qr-reader video') as HTMLVideoElement;
      if (video && video.srcObject) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!video || !video.srcObject) {
      console.log("Video element not found for focus control");
      return;
    }
    
    // Store video stream reference for focus control
    videoStreamRef.current = video.srcObject as MediaStream;
    
    // Apply initial focus settings
    const track = videoStreamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.() as any;
    
    if (capabilities?.focusMode) {
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: focusMode === "auto" ? "continuous" : "manual" } as any]
        });
      } catch (e) {
        console.log("Focus mode not supported:", e);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Try to fetch animal/QR data from the scanned URL or ID
    try {
      // Check if it's a QR code URL or direct ID
      const qrId = decodedText.includes('/qr/') 
        ? decodedText.split('/qr/').pop()?.split('?')[0]
        : decodedText;

      if (!qrId) {
        toast({
          title: "Invalid QR Code",
          description: "Could not extract ID from scanned code",
          variant: "destructive",
        });
        return;
      }

      // Try to fetch QR code data
      const response = await fetch(`/api/qr-codes/${qrId}`, { credentials: 'include' });
      
      if (response.ok) {
        const qrData = await response.json();
        
        // Check if it's a blank QR code or linked to animal/cage
        if (qrData.status === 'available' || qrData.status === 'unused') {
          // Blank QR code
          setBlankQrData({
            id: qrData.id,
            qrData: decodedText,
            isBlank: true,
          });
          setScannedData(null);
          setQrClaimed(false);
          await stopCamera();
          
          toast({
            title: "Blank QR Code Scanned",
            description: "Link this QR code to a cage below",
          });
        } else if (qrData.animalId) {
          // QR linked to animal - fetch animal data
          const animalResponse = await fetch(`/api/animals/${qrData.animalId}`, { credentials: 'include' });
          if (animalResponse.ok) {
            const animalData = await animalResponse.json();
            setScannedData({
              animalId: animalData.id,
              animalNumber: animalData.animalNumber,
              cageId: animalData.cageId,
              breed: animalData.breed,
              age: animalData.age,
              weight: animalData.weight,
              gender: animalData.gender,
              healthStatus: animalData.healthStatus,
              diseases: animalData.diseases,
              notes: animalData.notes,
            });
            setBlankQrData(null);
            setQrClaimed(false);
            await stopCamera();
            
            toast({
              title: "QR Code Scanned",
              description: "Animal information loaded successfully",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing scanned QR:", error);
      toast({
        title: "Error",
        description: "Failed to process scanned QR code",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    try {
      // Make sure any previous scanner is stopped
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          // Ignore errors when stopping
        }
      }

      // First set isScanning to true so the div appears
      setIsScanning(true);

      // Wait for React to render the div - check for element existence
      const waitForElement = async (id: string, maxAttempts = 50) => {
        for (let i = 0; i < maxAttempts; i++) {
          if (document.getElementById(id)) {
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return false;
      };

      const elementExists = await waitForElement("qr-reader");
      if (!elementExists) {
        setIsScanning(false);
        throw new Error("Scanner element failed to render");
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Enhanced camera configuration for better quality and QR detection
      const config = { 
        fps: 60, // Higher fps for faster, smoother scanning
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          // Dynamic QR box size - 75% of the smaller dimension
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * 0.75);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0, // Square aspect ratio for QR codes
        disableFlip: false, // Enable mirroring if needed
      };

      // Advanced video constraints for optimal QR scanning
      const videoConstraints: any = {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };

      // Try to get camera permissions first
      try {
        // First try with rear camera (environment) with enhanced settings
        const cameraStartPromise = scanner.start(
          videoConstraints,
          config,
          handleScanSuccess,
          (errorMessage) => {
            // Ignore scan errors (they happen frequently when no QR is in view)
          }
        );

        await cameraStartPromise;
        await initializeFocusControl();
        
        toast({
          title: "Escáner Iniciado",
          description: "Apunta la cámara al código QR para escanear",
        });
      } catch (envError) {
        console.log("Rear camera not available, trying front camera:", envError);
        // If rear camera fails, try front camera
        try {
          await scanner.start(
            { facingMode: "user" },
            config,
            handleScanSuccess,
            (errorMessage) => {
              // Ignore scan errors
            }
          );
          
          await initializeFocusControl();
          
          toast({
            title: "Escáner Iniciado",
            description: "Apunta la cámara al código QR para escanear",
          });
        } catch (userError) {
          console.log("Front camera failed, trying any available camera:", userError);
          // If both fail, try any available camera with basic config
          try {
            await scanner.start(
              { facingMode: { ideal: "environment" } },
              config,
              handleScanSuccess,
              (errorMessage) => {
                // Ignore scan errors
              }
            );
            
            await initializeFocusControl();
            
            toast({
              title: "Escáner Iniciado",
              description: "Apunta la cámara al código QR para escanear",
            });
          } catch (finalError) {
            // All attempts failed
            setIsScanning(false);
            throw finalError;
          }
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      setIsScanning(false);
      toast({
        title: "Error de Cámara",
        description: "No se puede acceder a la cámara. Por favor verifica los permisos en la configuración de tu navegador.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    videoStreamRef.current = null;
    setIsScanning(false);
  };

  const toggleFocusMode = async () => {
    if (!videoStreamRef.current) return;
    
    const track = videoStreamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.() as any;
    
    if (!capabilities?.focusMode) {
      toast({
        title: "No disponible",
        description: "Este dispositivo no soporta control de enfoque",
        variant: "destructive",
      });
      return;
    }
    
    const newMode = focusMode === "auto" ? "manual" : "auto";
    
    // Check if manual mode is actually supported
    if (newMode === "manual" && !capabilities.focusMode.includes("manual")) {
      toast({
        title: "No disponible",
        description: "Enfoque manual no soportado en este dispositivo",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await track.applyConstraints({
        advanced: [{ focusMode: newMode === "auto" ? "continuous" : "manual" } as any]
      });
      
      setFocusMode(newMode);
      
      toast({
        title: `Enfoque ${newMode === "auto" ? "Automático" : "Manual"}`,
        description: newMode === "auto" ? "El enfoque se ajustará automáticamente" : "Toca la pantalla para enfocar",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el modo de enfoque",
        variant: "destructive",
      });
    }
  };

  const handleFocusTap = async (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (focusMode !== "manual" || !videoStreamRef.current) return;
    
    const track = videoStreamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.() as any;
    
    // Check if any form of manual focus is supported
    if (!capabilities?.pointsOfInterest && !capabilities?.focusDistance) {
      // Fall back to auto focus mode with proper constraints
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" } as any]
        });
        setFocusMode("auto");
        toast({
          title: "Modo Auto",
          description: "Enfoque manual no soportado. Cambiado a modo automático",
          variant: "destructive",
        });
      } catch (e) {
        console.log("Failed to revert to auto focus:", e);
      }
      return;
    }
    
    try {
      // Calculate focus point based on tap/touch position
      const rect = e.currentTarget.getBoundingClientRect();
      let clientX: number;
      let clientY: number;
      
      if ('touches' in e) {
        // Touch event
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      
      // Try pointsOfInterest first (more precise)
      if (capabilities?.pointsOfInterest) {
        await track.applyConstraints({
          advanced: [{ 
            focusMode: "manual",
            pointsOfInterest: [{ x, y }]
          } as any]
        });
      } else if (capabilities?.focusDistance) {
        // Fallback to focusDistance adjustment
        const distance = 1.0 - Math.sqrt(x * x + y * y) / Math.sqrt(2);
        await track.applyConstraints({
          advanced: [{ 
            focusMode: "manual",
            focusDistance: Math.max(0, Math.min(1, distance))
          } as any]
        });
      }
      
      toast({
        title: "Enfocando",
        description: `Punto ajustado (${Math.round(x * 100)}%, ${Math.round(y * 100)}%)`,
      });
    } catch (error) {
      console.log("Tap-to-focus failed, reverting to auto:", error);
      // Revert to auto focus on failure
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" } as any]
        });
        setFocusMode("auto");
        toast({
          title: "Modo Auto",
          description: "Error en enfoque manual. Cambiado a modo automático",
          variant: "destructive",
        });
      } catch (e) {
        console.log("Failed to revert to auto focus:", e);
      }
    }
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
    <div className="px-4 md:px-6 pb-4 md:pb-6 pt-1 md:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h2 className="text-lg md:text-2xl font-semibold text-foreground">Escáner de Código QR</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Escanea códigos QR para ver información de animales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Escáner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isScanning ? (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center px-4">
                    <Camera className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm md:text-base text-muted-foreground mb-2">Toca para activar la cámara</p>
                    <p className="text-xs text-muted-foreground mb-4">Se te pedirá permiso para usar la cámara</p>
                    <Button 
                      onClick={startCamera} 
                      data-testid="button-start-camera"
                      className="min-h-[44px] px-6 touch-manipulation font-medium"
                      size="lg"
                    >
                      Iniciar Escáner
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div 
                    id="qr-reader" 
                    className="w-full relative touch-manipulation"
                    onClick={handleFocusTap}
                    onTouchStart={handleFocusTap}
                  ></div>
                  {focusMode === "manual" && (
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <p className="text-xs text-white bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                        👆 Toca la pantalla para enfocar
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {isScanning && (
                <div className="flex gap-2 items-stretch">
                  <Button 
                    variant={focusMode === "auto" ? "default" : "outline"} 
                    onClick={toggleFocusMode}
                    className="flex-1 min-h-[44px] touch-manipulation"
                    data-testid="button-toggle-focus"
                  >
                    <Focus className="w-5 h-5 mr-2" />
                    <span className="font-medium">{focusMode === "auto" ? "Auto" : "Manual"}</span>
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 rounded-md min-w-[70px]">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold">60fps</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                {isScanning ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={stopCamera} 
                      data-testid="button-stop-camera"
                      className="min-h-[44px] touch-manipulation"
                    >
                      Detener Escáner
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={simulateQrScan} 
                        data-testid="button-simulate-scan" 
                        className="flex-1 min-h-[44px] touch-manipulation"
                      >
                        Demo Animal QR
                      </Button>
                      <Button 
                        onClick={simulateBlankQrScan} 
                        data-testid="button-simulate-blank-qr" 
                        className="flex-1 min-h-[44px] touch-manipulation" 
                        variant="secondary"
                      >
                        Demo Blank QR
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={simulateQrScan} 
                      variant="outline" 
                      data-testid="button-demo-scan" 
                      className="flex-1 min-h-[44px] touch-manipulation"
                    >
                      Demo Animal QR
                    </Button>
                    <Button 
                      onClick={simulateBlankQrScan} 
                      variant="outline" 
                      data-testid="button-demo-blank-scan" 
                      className="flex-1 min-h-[44px] touch-manipulation"
                    >
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

                    <div className="flex flex-col space-y-2 pt-4">
                      <Button 
                        onClick={handleClaimQr}
                        disabled={!selectedCageId || claimQrMutation.isPending}
                        data-testid="button-link-qr"
                      >
                        {claimQrMutation.isPending ? "Linking..." : "Link to Cage"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation(`/cages?createNew=true&qrId=${blankQrData.id}`)}
                        data-testid="button-create-new-cage"
                      >
                        Create New Cage
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setBlankQrData(null)}
                        data-testid="button-cancel-claim"
                      >
                        Cancel
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

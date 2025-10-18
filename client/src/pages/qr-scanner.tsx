import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Camera, CheckCircle, AlertCircle, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
        title: "Éxito",
        description: "Código QR vinculado a la jaula correctamente",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Sesión expirada. Redirigiendo...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Error al vincular código QR",
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleQrCodeSuccess = async (decodedText: string) => {
    console.log("QR Code escaneado:", decodedText);
    
    // Haptic feedback on mobile - vibration pattern for success
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Double pulse vibration
    }
    
    // Stop scanning immediately to prevent multiple scans
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
      } catch (e) {
        console.log("Error pausing scanner:", e);
      }
    }

    try {
      // Try to fetch animal data
      const animalResponse = await fetch(`/api/qr-codes/scan/${encodeURIComponent(decodedText)}`, {
        credentials: 'include'
      });

      if (animalResponse.ok) {
        const animal = await animalResponse.json();
        
        if (animal.isBlank) {
          // Handle blank QR code
          setBlankQrData({
            id: animal.id,
            qrData: decodedText,
            isBlank: true
          });
          setScannedData(null);
          setQrClaimed(false);
          
          toast({
            title: "Código QR en Blanco",
            description: "Este código está disponible para asignar",
          });
        } else {
          // Handle animal QR code
          setScannedData(animal);
          setBlankQrData(null);
          setQrClaimed(false);
          
          toast({
            title: "Animal Encontrado",
            description: `Animal ${animal.animalNumber} escaneado`,
          });
        }
        
        // Stop camera after successful scan
        await stopCamera();
      } else {
        toast({
          title: "No Encontrado",
          description: "Este código QR no está registrado",
          variant: "destructive",
        });
        
        // Resume scanning for new code
        if (scannerRef.current) {
          try {
            await scannerRef.current.resume();
          } catch (e) {
            console.log("Error resuming scanner:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching QR data:", error);
      toast({
        title: "Error",
        description: "Error al procesar el código QR",
        variant: "destructive",
      });
      
      // Resume scanning
      if (scannerRef.current) {
        try {
          await scannerRef.current.resume();
        } catch (e) {
          console.log("Error resuming scanner:", e);
        }
      }
    }
  };

  const startCamera = async () => {
    try {
      // Create scanner instance first (element always exists now)
      const qrScanner = new Html5Qrcode("qr-reader");
      scannerRef.current = qrScanner;
      
      setIsScanning(true);

      // Simple configuration that works on most devices
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      // Start with rear camera - use 'ideal' instead of 'exact' for better compatibility
      await qrScanner.start(
        { facingMode: "environment" },
        config,
        handleQrCodeSuccess,
        (errorMessage) => {
          // Ignore scan errors silently - they happen when no QR is in view
        }
      );

      toast({
        title: "Cámara Activada",
        description: "Apunta la cámara al código QR",
      });
      
    } catch (error: any) {
      console.error("Error starting camera:", error);
      setIsScanning(false);
      
      let errorMsg = "No se pudo acceder a la cámara";
      
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        errorMsg = "Por favor permite el acceso a la cámara en tu navegador";
      } else if (error?.name === 'NotFoundError') {
        errorMsg = "No se encontró ninguna cámara en este dispositivo";
      } else if (error?.name === 'NotReadableError') {
        errorMsg = "La cámara está siendo usada por otra aplicación";
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      toast({
        title: "Error de Cámara",
        description: errorMsg,
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
        console.error("Error stopping camera:", error);
      }
    }
    setIsScanning(false);
  };

  const handleClaimQr = () => {
    if (blankQrData && selectedCageId) {
      claimQrMutation.mutate({
        qrId: blankQrData.id,
        cageId: selectedCageId
      });
    }
  };

  const simulateQrScan = async () => {
    // Demo function for testing without camera - shows mock data
    const mockAnimalData: ScannedAnimalData = {
      animalId: "demo-animal-id",
      animalNumber: "F-318",
      cageId: "demo-cage-id",
      breed: "Baff3",
      age: 12,
      weight: "25g",
      gender: "Female",
      healthStatus: "Healthy",
      diseases: "",
      notes: "Demo animal for testing"
    };
    
    setScannedData(mockAnimalData);
    setBlankQrData(null);
    setQrClaimed(false);
    
    toast({
      title: "Demo: Animal Encontrado",
      description: `Animal ${mockAnimalData.animalNumber} (demostración)`,
    });
  };

  const simulateBlankQrScan = async () => {
    // Demo function for testing blank QR - shows mock blank QR
    const mockBlankQr: BlankQrData = {
      id: "demo-blank-qr-id",
      qrData: "DEMO-BLANK-001",
      isBlank: true
    };
    
    setBlankQrData(mockBlankQr);
    setScannedData(null);
    setQrClaimed(false);
    
    toast({
      title: "Demo: Código QR en Blanco",
      description: "Este código está disponible para asignar (demostración)",
    });
  };

  const resetScanner = () => {
    setScannedData(null);
    setBlankQrData(null);
    setSelectedCageId("");
    setQrClaimed(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <QrCode className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold" data-testid="text-page-title">Escáner de Código QR</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Escanea códigos QR para ver información de animales
            </p>
          </div>
        </motion.div>

        {/* Scanner Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Escáner
                {isScanning && (
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera View */}
              <AnimatePresence mode="wait">
                {!isScanning && (
                  <motion.div 
                    key="camera-off"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center p-8 md:p-12 bg-muted rounded-lg"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Camera className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground mb-4" />
                    </motion.div>
                    <p className="text-center text-muted-foreground mb-4">
                      Toca para activar la cámara
                      <br />
                      <span className="text-xs">Se pedirá permiso para usar la cámara</span>
                    </p>
                    <Button 
                      onClick={startCamera} 
                      size="lg"
                      data-testid="button-start-camera"
                      className="min-h-[48px] px-8"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Iniciar Escáner
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            
            {/* QR Reader element - always rendered but hidden when not scanning */}
            <div className={isScanning ? "block" : "hidden"}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div 
                  id="qr-reader" 
                  className="w-full rounded-lg overflow-hidden border-4 border-primary shadow-lg"
                  style={{ minHeight: "300px" }}
                ></div>
                <motion.div 
                  className="mt-2 text-center"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Escaneando... Mantén el código QR en el cuadro
                    <Sparkles className="w-4 h-4" />
                  </p>
                </motion.div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    data-testid="button-stop-camera"
                    className="flex-1 min-h-[48px]"
                  >
                    Detener Escáner
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Demo Buttons */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Funciones de demostración:</p>
              <div className="flex gap-2">
                <Button 
                  onClick={simulateQrScan} 
                  variant="outline"
                  size="sm"
                  data-testid="button-demo-scan"
                  className="flex-1 min-h-[48px]"
                >
                  Demo Animal QR
                </Button>
                <Button 
                  onClick={simulateBlankQrScan} 
                  variant="outline"
                  size="sm"
                  data-testid="button-demo-blank-scan"
                  className="flex-1 min-h-[48px]"
                >
                  Demo Blank QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Scanned Animal Information */}
        {scannedData && (
          <Card className="border-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Información del Animal
                </CardTitle>
                <Button 
                  onClick={resetScanner}
                  variant="ghost"
                  size="sm"
                  data-testid="button-reset-scanner"
                  className="min-h-[48px]"
                >
                  Escanear Otro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Animal</p>
                  <p className="text-lg font-semibold" data-testid="animal-number">
                    {scannedData.animalNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Raza</p>
                  <p className="text-lg font-semibold">{scannedData.breed || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Género</p>
                  <p className="text-lg font-semibold">{scannedData.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso</p>
                  <p className="text-lg font-semibold">{scannedData.weight || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado de Salud</p>
                  <Badge className={getStatusColor(scannedData.healthStatus || 'Healthy')}>
                    {scannedData.healthStatus || 'Healthy'}
                  </Badge>
                </div>
              </div>

              {scannedData.diseases && (
                <div>
                  <p className="text-sm text-muted-foreground">Enfermedades</p>
                  <p className="text-sm">{scannedData.diseases}</p>
                </div>
              )}

              {scannedData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm">{scannedData.notes}</p>
                </div>
              )}

              <Button 
                onClick={() => setLocation(`/animal-qr-detail/${scannedData.animalId}`)}
                className="w-full min-h-[48px]"
                data-testid="button-view-full-record"
              >
                Ver Registro Completo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Blank QR Code Assignment */}
        {blankQrData && !qrClaimed && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Código QR en Blanco Detectado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este código QR está disponible. Asígnalo a una jaula:
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleccionar Jaula</label>
                <Select value={selectedCageId} onValueChange={setSelectedCageId}>
                  <SelectTrigger data-testid="select-cage" className="min-h-[48px]">
                    <SelectValue placeholder="Selecciona una jaula" />
                  </SelectTrigger>
                  <SelectContent>
                    {cages?.filter(c => c.status === 'Active').map((cage) => (
                      <SelectItem key={cage.id} value={cage.id}>
                        Jaula {cage.cageNumber} - {cage.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleClaimQr}
                  disabled={!selectedCageId || claimQrMutation.isPending}
                  className="flex-1 min-h-[48px]"
                  data-testid="button-claim-qr"
                >
                  {claimQrMutation.isPending ? "Asignando..." : "Asignar a Jaula"}
                </Button>
                <Button
                  onClick={resetScanner}
                  variant="outline"
                  className="min-h-[48px]"
                  data-testid="button-cancel-claim"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message for Claimed QR */}
        {qrClaimed && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">Código QR asignado correctamente</p>
              </div>
              <Button
                onClick={resetScanner}
                variant="outline"
                className="mt-4 w-full min-h-[48px]"
                data-testid="button-scan-another"
              >
                Escanear Otro Código
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

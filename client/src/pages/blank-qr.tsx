import BlankQrGenerator from "@/components/blank-qr-generator";
import { useLocation } from "wouter";

export default function BlankQrPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Generar QR en Blanco</h1>
        <p className="text-muted-foreground mt-2">
          Genera códigos QR en blanco para imprimir y usar posteriormente
        </p>
      </div>
      
      <BlankQrGenerator onClose={() => setLocation('/cages')} />
    </div>
  );
}

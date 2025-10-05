import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export default function FloatingActionButton({ 
  onClick, 
  icon = <Plus className="w-6 h-6" />, 
  label,
  className 
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "md:hidden fixed bottom-24 right-6 z-40 h-14 rounded-full shadow-lg",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        label ? "px-6" : "w-14 p-0",
        className
      )}
      data-testid="fab-button"
    >
      {icon}
      {label && <span className="ml-2 font-semibold">{label}</span>}
    </Button>
  );
}

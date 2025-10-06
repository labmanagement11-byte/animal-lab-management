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
  icon = <Plus className="w-5 h-5" />, 
  label,
  className 
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="default"
      className={cn(
        "md:hidden fixed bottom-20 right-4 z-40 h-12 rounded-full shadow-lg",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        label ? "px-4 text-sm" : "w-12 p-0",
        className
      )}
      data-testid="fab-button"
    >
      {icon}
      {label && <span className="ml-2 font-medium text-sm">{label}</span>}
    </Button>
  );
}

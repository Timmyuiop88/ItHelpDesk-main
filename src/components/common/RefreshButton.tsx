import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  className?: string;
  iconOnly?: boolean;
}

export function RefreshButton({ onRefresh, className = "", iconOnly = false }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success("Refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  const button = (
    <Button
      variant="outline"
      size={iconOnly ? "icon" : "default"}
      className={className}
      onClick={() => void handleRefresh()}
      disabled={isRefreshing}
    >
      <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {!iconOnly && "Refresh"}
    </Button>
  );

  if (iconOnly) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

import { Progress } from "./ui/progress";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  progress?: number; // 0-100
}

export const LoadingOverlay = ({ message = "Processing...", progress }: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">{message}</p>
            {progress !== undefined && (
              <div className="mt-4 w-full">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
  fullScreen?: boolean;
}

export function PageLoader({ className, fullScreen = false }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-96",
        fullScreen && "min-h-screen w-full",
        className,
      )}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

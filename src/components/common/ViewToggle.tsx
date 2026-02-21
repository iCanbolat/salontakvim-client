import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ViewToggleProps = {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
  className?: string;
};

export function ViewToggle({ view, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center border rounded-md p-1 bg-gray-50/50 shadow-sm",
        className,
      )}
    >
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="icon"
        className={cn(
          "h-8 w-8 transition-all",
          view === "grid"
            ? "bg-white text-primary shadow-sm hover:bg-white border"
            : "text-gray-500 hover:text-gray-900",
        )}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="icon"
        className={cn(
          "h-8 w-8 transition-all",
          view === "list"
            ? "bg-white text-primary shadow-sm hover:bg-white border"
            : "text-gray-500 hover:text-gray-900",
        )}
        onClick={() => onChange("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}

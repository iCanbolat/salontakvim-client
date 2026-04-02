import type { MouseEvent, ReactNode } from "react";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EntityCardProps {
  title: string;
  description?: string;
  color?: string;
  headerContent?: ReactNode;
  isVisible: boolean;
  onCardClick?: () => void;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  isEditDisabled?: boolean;
  isToggling?: boolean;
  isDeleting?: boolean;
  editLabel?: string;
  toggleTitle?: string;
  deleteTitle?: string;
  children?: ReactNode;
}

export function EntityCard({
  title,
  description,
  color,
  headerContent,
  isVisible,
  onCardClick,
  onEdit,
  onToggleVisibility,
  onDelete,
  isEditDisabled = false,
  isToggling = false,
  isDeleting = false,
  editLabel = "Edit",
  toggleTitle,
  deleteTitle,
  children,
}: EntityCardProps) {
  const hasContent = Boolean(children);
  const isClickable = Boolean(onCardClick);

  const handleActionClick = (
    event: MouseEvent<HTMLButtonElement>,
    action: () => void,
  ) => {
    event.stopPropagation();
    action();
  };

  return (
    <Card
      className={`flex flex-col ${!isVisible ? "opacity-60" : ""} ${
        isClickable ? "cursor-pointer" : ""
      }`}
      onClick={onCardClick}
    >
      <CardHeader className={hasContent ? undefined : "flex-1"}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {headerContent && <div className="mb-3">{headerContent}</div>}
            <div className="mb-1 flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {!isVisible && (
                <Badge variant="secondary" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
            {description && (
              <CardDescription className="line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>
          {color && (
            <div
              className="ml-2 h-4 w-4 shrink-0 rounded-full border"
              style={{ backgroundColor: color }}
              title={color}
            />
          )}
        </div>
      </CardHeader>

      {hasContent && <CardContent className="flex-1">{children}</CardContent>}

      <CardFooter className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={(event) => handleActionClick(event, onEdit)}
          disabled={isEditDisabled}
          className="flex-1"
        >
          <Edit className="mr-1.5 h-3.5 w-3.5" />
          {editLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(event) => handleActionClick(event, onToggleVisibility)}
          disabled={isToggling}
          title={toggleTitle}
        >
          {isVisible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(event) => handleActionClick(event, onDelete)}
          disabled={isDeleting}
          title={deleteTitle}
          className="text-red-600 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

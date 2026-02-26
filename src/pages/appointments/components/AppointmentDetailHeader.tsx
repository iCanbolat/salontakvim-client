/**
 * Appointment Detail Header
 */

import {
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentDetailHeaderProps {
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  onChangeStatus?: () => void;
  onSettlePayment?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  isEditDisabled?: boolean;
  isStatusDisabled?: boolean;
  isSettleDisabled?: boolean;
}

export function AppointmentDetailHeader({
  title,
  subtitle,
  onEdit,
  onChangeStatus,
  onSettlePayment,
  onDelete,
  isDeleting,
  isEditDisabled,
  isStatusDisabled,
  isSettleDisabled,
}: AppointmentDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
        <Button
          size="sm"
          className="h-9 transition-all hover:bg-gray-100 whitespace-nowrap"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>

        {(onEdit || onChangeStatus || onSettlePayment || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3">
                <MoreVertical className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit} disabled={isEditDisabled}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onChangeStatus && (
                <DropdownMenuItem
                  onClick={onChangeStatus}
                  disabled={isStatusDisabled}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Change Status
                </DropdownMenuItem>
              )}
              {onSettlePayment && (
                <DropdownMenuItem
                  onClick={onSettlePayment}
                  disabled={isSettleDisabled}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Settle Payment
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

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
}

export function AppointmentDetailHeader({
  title,
  subtitle,
  onEdit,
  onChangeStatus,
  onSettlePayment,
  onDelete,
  isDeleting,
}: AppointmentDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <Button
          size="sm"
          className="h-8 w-fit transition-all hover:bg-gray-100"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Appointments
        </Button>
      </div>

      <div className="flex items-center gap-2 ml-auto sm:ml-0">
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
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onChangeStatus && (
                <DropdownMenuItem onClick={onChangeStatus}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Change Status
                </DropdownMenuItem>
              )}
              {onSettlePayment && (
                <DropdownMenuItem onClick={onSettlePayment}>
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

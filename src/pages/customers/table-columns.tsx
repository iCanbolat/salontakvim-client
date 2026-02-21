import { format } from "date-fns";
import { Mail, Phone, Calendar, MessageSquare, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerWithStats } from "@/types";
import type { TableColumn } from "@/components/common/page-view";

interface GetCustomerColumnsProps {
  canAssignCoupons: boolean;
  onSms: (customer: CustomerWithStats) => void;
  onDiscount: (customer: CustomerWithStats) => void;
}

export const getCustomerColumns = ({
  canAssignCoupons,
  onSms,
  onDiscount,
}: GetCustomerColumnsProps): TableColumn<CustomerWithStats>[] => [
  {
    key: "customer",
    header: "Customer",
    render: (customer) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-gray-900">
          {customer.firstName} {customer.lastName}
        </span>
        <span className="text-xs text-gray-500">
          #{customer.publicNumber || customer.id}
        </span>
      </div>
    ),
  },
  {
    key: "contact",
    header: "Contact",
    hideOnMobile: true,
    render: (customer) => (
      <div className="flex flex-col gap-1 text-xs text-gray-600">
        <div className="flex items-center">
          <Mail className="h-3 w-3 mr-1.5" />
          {customer.email}
        </div>
        {customer.phone && (
          <div className="flex items-center">
            <Phone className="h-3 w-3 mr-1.5" />
            {customer.phone}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "stats",
    header: "Stats",
    hideOnTablet: true,
    render: (customer) => (
      <div className="flex flex-col gap-1 text-xs text-gray-600">
        <div>
          <span className="font-medium">{customer.totalAppointments}</span>{" "}
          appointments
        </div>
        {customer.lastAppointmentDate && (
          <div className="flex items-center text-[10px] text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            Last:{" "}
            {format(new Date(customer.lastAppointmentDate), "MMM d, yyyy")}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "actions",
    header: "",
    headerClassName: "text-right",
    cellClassName: "text-right",
    render: (customer) => (
      <div className="flex items-center justify-end gap-2">
        {canAssignCoupons && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              onDiscount(customer);
            }}
            title="İndirim Tanımla"
          >
            <Tag className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:text-green-600 hover:bg-green-50"
          onClick={(e) => {
            e.stopPropagation();
            onSms(customer);
          }}
          title="SMS Gönder"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

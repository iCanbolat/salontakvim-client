/**
 * Feedback Filters
 */

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Service, StaffMember } from "@/types";

interface FeedbackFiltersProps {
  canFilterByStaffService: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  staffFilter: string;
  onStaffFilterChange: (value: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  staffList?: StaffMember[];
  servicesList?: Service[];
}

export function FeedbackFilters({
  canFilterByStaffService,
  searchTerm,
  onSearchChange,
  staffFilter,
  onStaffFilterChange,
  serviceFilter,
  onServiceFilterChange,
  staffList,
  servicesList,
}: FeedbackFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={
            canFilterByStaffService
              ? "Search customer, staff or reviews..."
              : "Search customer or reviews..."
          }
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {canFilterByStaffService && (
        <>
          <Select value={staffFilter} onValueChange={onStaffFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staffList?.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {`${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
                    "Unnamed Staff"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={onServiceFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {servicesList?.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}

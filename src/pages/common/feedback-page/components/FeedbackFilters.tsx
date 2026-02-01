/**
 * Feedback Filters
 */

import { Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  isAdmin: boolean;
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
  isAdmin,
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtreler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isAdmin
                  ? "Müşteri, personel veya yorum ara..."
                  : "Müşteri veya yorum ara..."
              }
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {isAdmin && (
            <>
              <Select value={staffFilter} onValueChange={onStaffFilterChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Personel</SelectItem>
                  {staffList?.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.firstName} {staff.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={serviceFilter}
                onValueChange={onServiceFilterChange}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Hizmet seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Hizmetler</SelectItem>
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
      </CardContent>
    </Card>
  );
}

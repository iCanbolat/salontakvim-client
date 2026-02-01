/**
 * Appointment File Upload Card
 */

import { CustomerFiles } from "@/components/common/customer-files";

interface AppointmentFileUploadCardProps {
  storeId: string;
  customerId?: string | null;
  isReadOnly?: boolean;
}

export function AppointmentFileUploadCard({
  storeId,
  customerId,
  isReadOnly = false,
}: AppointmentFileUploadCardProps) {
  if (!customerId) {
    return null;
  }

  return (
    <CustomerFiles
      storeId={storeId}
      customerId={customerId}
      isReadOnly={isReadOnly}
    />
  );
}

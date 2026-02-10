/**
 * Appointment File Upload Card
 */

import { CustomerFiles } from "@/components/common/customer-files";
import type { CustomerFile } from "@/services/customer-file.service";

interface AppointmentFileUploadCardProps {
  storeId: string;
  customerId?: string | null;
  appointmentId?: string;
  isReadOnly?: boolean;
  files?: CustomerFile[];
}

export function AppointmentFileUploadCard({
  storeId,
  customerId,
  appointmentId,
  isReadOnly = false,
  files,
}: AppointmentFileUploadCardProps) {
  if (!customerId) {
    return null;
  }

  return (
    <CustomerFiles
      storeId={storeId}
      customerId={customerId}
      appointmentId={appointmentId}
      isReadOnly={isReadOnly}
      files={files}
    />
  );
}

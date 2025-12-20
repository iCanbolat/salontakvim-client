export type WidgetLayout = "list" | "steps";

export interface SidebarMenuItems {
  service: boolean;
  extras: boolean;
  dateTime: boolean;
  customerInfo: boolean;
  payment: boolean;
}

export interface WidgetSettings {
  id: number;
  storeId: number;
  layout: WidgetLayout;
  showCompanyEmail: boolean;
  companyEmail?: string;
  sidebarMenuItems: SidebarMenuItems;
  lastNameRequired: boolean;
  emailRequired: boolean;
  phoneRequired: boolean;
  primaryColor: string;
  secondaryColor: string;
  sidebarBackgroundColor: string;
  contentBackgroundColor: string;
  textColor: string;
  headingColor: string;
  fontFamily: string;
  buttonBorderRadius: number;
  showProgressBar: boolean;
  allowGuestBooking: boolean;
  redirectUrlAfterBooking?: string;
  widgetKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateWidgetSettingsDto {
  layout?: WidgetLayout;
  showCompanyEmail?: boolean;
  companyEmail?: string;
  sidebarMenuItems?: SidebarMenuItems;
  lastNameRequired?: boolean;
  emailRequired?: boolean;
  phoneRequired?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  sidebarBackgroundColor?: string;
  contentBackgroundColor?: string;
  textColor?: string;
  headingColor?: string;
  fontFamily?: string;
  buttonBorderRadius?: number;
  showProgressBar?: boolean;
  allowGuestBooking?: boolean;
  redirectUrlAfterBooking?: string;
}

export interface WidgetEmbedCode {
  widgetKey: string;
  embedCode: string;
  scriptUrl: string;
  iframeCode: string;
}

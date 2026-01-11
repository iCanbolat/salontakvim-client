export type WidgetLayout = "list" | "steps";

export interface SidebarMenuItems {
  service: boolean;
  extras: boolean;
  dateTime: boolean;
  customerInfo: boolean;
  payment: boolean;
}

export interface WidgetSettings {
  id: string;
  storeId: string;
  layout: WidgetLayout;
  showCompanyEmail: boolean;
  companyEmail?: string;
  publicToken: string;
  allowedDomains: string[];
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

export interface WidgetEmbedBootstrap {
  token: string;
  apiBaseUrl: string;
  loaderUrl: string;
  widgetKey: string;
  slug: string;
}

export interface WidgetPublicStoreInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  currency: string;
}

export interface WidgetPublicSidebarMenuItems {
  service?: boolean;
  employee?: boolean;
  location?: boolean;
  extras?: boolean;
  dateTime?: boolean;
  customerInfo?: boolean;
  payment?: boolean;
}

export interface WidgetPublicFieldRequirements {
  employeeRequired: boolean;
  locationRequired: boolean;
  lastNameRequired: boolean;
  emailRequired: boolean;
  phoneRequired: boolean;
}

export interface WidgetPublicStyling {
  primaryColor: string;
  secondaryColor: string;
  sidebarBackgroundColor: string;
  contentBackgroundColor: string;
  textColor: string;
  headingColor: string;
  fontFamily: string;
  fontSize: number;
  buttonBorderRadius: number;
}

export interface WidgetPublicSettings {
  showProgressBar: boolean;
  allowGuestBooking: boolean;
  redirectUrlAfterBooking?: string;
}

export interface WidgetPublicConfig {
  store: WidgetPublicStoreInfo;
  widgetKey?: string;
  layout: WidgetLayout;
  showCompanyEmail: boolean;
  companyEmail?: string;
  sidebarMenuItems: WidgetPublicSidebarMenuItems;
  fieldRequirements: WidgetPublicFieldRequirements;
  styling: WidgetPublicStyling;
  settings: WidgetPublicSettings;
}

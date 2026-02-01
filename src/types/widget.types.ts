export type WidgetLayout = "list" | "steps";

export interface SidebarMenuItems {
  extras: boolean;
  payment: boolean;
}

export interface WidgetSettings {
  id: string;
  storeId: string;
  layout: WidgetLayout;
  showCompanyEmail: boolean;
  companyEmail?: string;
  /** @deprecated No longer used - domain check + embed token is now the security mechanism */
  publicToken?: string;
  allowedDomains: string[];
  sidebarMenuItems: SidebarMenuItems;
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

export interface WidgetSecurityStatus {
  blocked: boolean;
  blockedAt: string | null;
  reason: string | null;
  ttlSeconds: number | null;
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
  storeImages?: string[];
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
  styling: WidgetPublicStyling;
  settings: WidgetPublicSettings;
}

export type UserRole = "Admin" | "Maintenance Team" | "Storage Team";

export type FeatureId =
  | "dashboard"
  | "spare-parts"
  | "excel-import"
  | "maintenance"
  | "alerts"
  | "reports"
  | "history";

/** Who can see this feature in their sidebar */
export type PermissionTarget = "Maintenance Team" | "Storage Team" | "both" | "none";

export type FeaturePermissions = Record<FeatureId, PermissionTarget>;

/** Credentials for mock login */
export interface MockCredentials {
  userId: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  department: string;
}

/** "Expired Soon" is a computed display status only — never stored on SparePart.status */
export type PartStatus = "Available" | "Under Tracking" | "Expired Soon" | "Expired" | "Low Stock";

export interface SparePart {
  id: string;
  partNumber: string;
  serialNumber: string;
  description: string;
  quantity: number;
  location: string;
  expiryDate: string | null;
  status: "Available" | "Under Tracking" | "Expired" | "Low Stock";
  minStockThreshold: number;
  expiryAlertDays: number;
  maintenanceAlertDays: number;
  class: string;
  /** Populated from the 2025 Consumption Report import */
  consumedQuantity?: number;
  /** "Zero Stock" when the Excel source had that literal value instead of a number */
  currentStockLabel?: "Zero Stock" | null;
}

export interface MaintenanceRecord {
  id: string;
  partId: string;
  partNumber: string;
  serialNumber: string;
  description: string;
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  certificateUrl: string | null;
  notes: string;
  status: "Active" | "Returned" | "Overdue";
}

export type AlertType = "expiry" | "low-stock" | "maintenance-return";
export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  partId: string;
  partNumber: string;
  description: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export type HistoryEventType =
  | "status-change"
  | "maintenance-sent"
  | "maintenance-returned"
  | "expiry-update"
  | "quantity-update"
  | "imported"
  | "created"
  | "edited";

export interface HistoryEvent {
  id: string;
  partId: string;
  partNumber: string;
  serialNumber: string;
  eventType: HistoryEventType;
  description: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  timestamp: string;
}

export interface ForecastItem {
  class: string;
  partNumber: string;
  description: string;
  consumedQuantity: number;
  currentStock: number | "Zero Stock";
  forecastedDemand: number;
}

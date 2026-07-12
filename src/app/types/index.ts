export type PartStatus = "Available" | "Under Maintenance" | "Expired" | "Low Stock";

export interface SparePart {
  id: string;
  partNumber: string;
  serialNumber: string;
  description: string;
  quantity: number;
  location: string;
  expiryDate: string | null;
  status: PartStatus;
  minStockThreshold: number;
  expiryAlertDays: number;
  maintenanceAlertDays: number;
  class: string;
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
  currentStock: number;
  forecastedDemand: number;
}

import { createContext, useContext, useReducer, type ReactNode } from "react";
import type {
  SparePart, MaintenanceRecord, Alert, HistoryEvent,
  User, UserRole, FeatureId, PermissionTarget, FeaturePermissions,
} from "../types";
import {
  initialSpareParts,
  initialMaintenanceRecords,
  initialAlerts,
  initialHistory,
  initialUsers,
} from "../data/mockData";

// ── Default permissions match pre-RBAC behaviour ──────────────────────────────
// Maintenance Team had all 7 features. Storage Team had only excel-import.
export const DEFAULT_PERMISSIONS: FeaturePermissions = {
  "dashboard":    "Maintenance Team",
  "spare-parts":  "Maintenance Team",
  "excel-import": "both",
  "maintenance":  "Maintenance Team",
  "alerts":       "Maintenance Team",
  "reports":      "Maintenance Team",
  "history":      "Maintenance Team",
};

const PERMISSIONS_STORAGE_KEY = "spts-feature-permissions";

function loadPermissions(): FeaturePermissions {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_PERMISSIONS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PERMISSIONS };
}

function savePermissions(p: FeaturePermissions) {
  try { localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

const AUTH_STORAGE_KEY = "spts-auth-email";

// ── State ─────────────────────────────────────────────────────────────────────
interface AppState {
  spareParts: SparePart[];
  maintenanceRecords: MaintenanceRecord[];
  alerts: Alert[];
  history: HistoryEvent[];
  users: User[];
  currentUser: { name: string; role: UserRole; initials: string };
  featurePermissions: FeaturePermissions;
  isAuthenticated: boolean;
}

// ── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: "ADD_PART"; payload: SparePart }
  | { type: "UPDATE_PART"; payload: SparePart }
  | { type: "IMPORT_PARTS"; payload: SparePart[] }
  | { type: "SEND_FOR_TRACKING"; payload: { part: SparePart; record: MaintenanceRecord; historyEvent: HistoryEvent } }
  | { type: "RETURN_FROM_TRACKING"; payload: { partId: string; recordId: string; expiryDate: string | null; certificateUrl: string | null; historyEvent: HistoryEvent } }
  | { type: "ADD_ALERT"; payload: Alert }
  | { type: "MARK_ALERT_READ"; payload: string }
  | { type: "MARK_ALL_READ" }
  | { type: "ADD_HISTORY"; payload: HistoryEvent }
  | { type: "SET_USER_ROLE"; payload: { userId: string; role: UserRole } }
  | { type: "SWITCH_CURRENT_ROLE"; payload: UserRole }
  | { type: "SET_FEATURE_PERMISSION"; payload: { featureId: FeatureId; access: PermissionTarget } }
  | { type: "LOGIN"; payload: { userId: string; remember: boolean } }
  | { type: "LOGOUT" };

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_PART":
      return {
        ...state,
        spareParts: [...state.spareParts, action.payload],
        history: [...state.history, {
          id: `he-${Date.now()}`,
          partId: action.payload.id,
          partNumber: action.payload.partNumber,
          serialNumber: action.payload.serialNumber,
          eventType: "created",
          description: "Part added manually",
          performedBy: state.currentUser.name,
          timestamp: new Date().toISOString(),
        }],
      };

    case "UPDATE_PART": {
      const old = state.spareParts.find(p => p.id === action.payload.id);
      return {
        ...state,
        spareParts: state.spareParts.map(p => p.id === action.payload.id ? action.payload : p),
        history: [...state.history, {
          id: `he-${Date.now()}`,
          partId: action.payload.id,
          partNumber: action.payload.partNumber,
          serialNumber: action.payload.serialNumber,
          eventType: "edited",
          description: "Part information updated",
          oldValue: old ? `qty:${old.quantity}, loc:${old.location}` : undefined,
          newValue: `qty:${action.payload.quantity}, loc:${action.payload.location}`,
          performedBy: state.currentUser.name,
          timestamp: new Date().toISOString(),
        }],
      };
    }

    case "IMPORT_PARTS": {
      const merged = [...state.spareParts];
      const newEvents: HistoryEvent[] = [];
      for (const incoming of action.payload) {
        const idx = merged.findIndex(p => p.serialNumber === incoming.serialNumber);
        const ev = (desc: string): HistoryEvent => ({
          id: `he-${Date.now()}-${incoming.serialNumber}`,
          partId: incoming.id,
          partNumber: incoming.partNumber,
          serialNumber: incoming.serialNumber,
          eventType: "imported",
          description: desc,
          performedBy: "Storage Team",
          timestamp: new Date().toISOString(),
        });
        if (idx >= 0) { merged[idx] = { ...merged[idx], ...incoming }; newEvents.push(ev("Part updated via Excel import")); }
        else          { merged.push(incoming);                           newEvents.push(ev("Part imported via Excel")); }
      }
      return { ...state, spareParts: merged, history: [...state.history, ...newEvents] };
    }

    case "SEND_FOR_TRACKING":
      return {
        ...state,
        spareParts: state.spareParts.map(p => p.id === action.payload.part.id ? action.payload.part : p),
        maintenanceRecords: [...state.maintenanceRecords, action.payload.record],
        history: [...state.history, action.payload.historyEvent],
      };

    case "RETURN_FROM_TRACKING":
      return {
        ...state,
        spareParts: state.spareParts.map(p => {
          if (p.id !== action.payload.partId) return p;
          return { ...p, status: "Available", quantity: p.quantity + 1, expiryDate: action.payload.expiryDate ?? p.expiryDate };
        }),
        maintenanceRecords: state.maintenanceRecords.map(r =>
          r.id === action.payload.recordId
            ? { ...r, status: "Returned", actualReturnDate: new Date().toISOString().split("T")[0], certificateUrl: action.payload.certificateUrl }
            : r
        ),
        history: [...state.history, action.payload.historyEvent],
      };

    case "ADD_ALERT":
      return { ...state, alerts: [...state.alerts, action.payload] };

    case "MARK_ALERT_READ":
      return { ...state, alerts: state.alerts.map(a => a.id === action.payload ? { ...a, isRead: true } : a) };

    case "MARK_ALL_READ":
      return { ...state, alerts: state.alerts.map(a => ({ ...a, isRead: true })) };

    case "ADD_HISTORY":
      return { ...state, history: [...state.history, action.payload] };

    case "SET_USER_ROLE":
      return { ...state, users: state.users.map(u => u.id === action.payload.userId ? { ...u, role: action.payload.role } : u) };

    case "SWITCH_CURRENT_ROLE":
      return { ...state, currentUser: { ...state.currentUser, role: action.payload } };

    case "SET_FEATURE_PERMISSION": {
      const updated = { ...state.featurePermissions, [action.payload.featureId]: action.payload.access };
      savePermissions(updated);
      return { ...state, featurePermissions: updated };
    }

    case "LOGIN": {
      const user = state.users.find(u => u.id === action.payload.userId);
      if (!user) return state;
      if (action.payload.remember) {
        try { localStorage.setItem(AUTH_STORAGE_KEY, user.email); } catch { /* ignore */ }
      }
      return {
        ...state,
        isAuthenticated: true,
        currentUser: { name: user.name, role: user.role, initials: user.initials },
      };
    }

    case "LOGOUT":
      try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
      return { ...state, isAuthenticated: false };

    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
function loadRememberedUser(users: User[]): { name: string; role: UserRole; initials: string } | null {
  try {
    const email = localStorage.getItem(AUTH_STORAGE_KEY);
    if (email) {
      const user = users.find(u => u.email === email);
      if (user) return { name: user.name, role: user.role, initials: user.initials };
    }
  } catch { /* ignore */ }
  return null;
}

const rememberedUser = loadRememberedUser(initialUsers);

const initialState: AppState = {
  spareParts: initialSpareParts,
  maintenanceRecords: initialMaintenanceRecords,
  alerts: initialAlerts,
  history: initialHistory,
  users: initialUsers,
  currentUser: rememberedUser ?? { name: "Ahmed Al-Qahtani", role: "Maintenance Team", initials: "AA" },
  featurePermissions: loadPermissions(),
  isAuthenticated: rememberedUser !== null,
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ── Helper exported for Sidebar / Layout ──────────────────────────────────────
export function canAccess(access: PermissionTarget, role: "Maintenance Team" | "Storage Team"): boolean {
  if (access === "both") return true;
  if (access === "none") return false;
  return access === role;
}

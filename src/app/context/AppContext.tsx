import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { SparePart, MaintenanceRecord, Alert, HistoryEvent } from "../types";
import {
  initialSpareParts,
  initialMaintenanceRecords,
  initialAlerts,
  initialHistory,
} from "../data/mockData";

interface AppState {
  spareParts: SparePart[];
  maintenanceRecords: MaintenanceRecord[];
  alerts: Alert[];
  history: HistoryEvent[];
  currentUser: { name: string; role: "Maintenance Team" | "Storage Team"; initials: string };
}

type Action =
  | { type: "ADD_PART"; payload: SparePart }
  | { type: "UPDATE_PART"; payload: SparePart }
  | { type: "IMPORT_PARTS"; payload: SparePart[] }
  | { type: "SEND_FOR_MAINTENANCE"; payload: { part: SparePart; record: MaintenanceRecord; historyEvent: HistoryEvent } }
  | { type: "RETURN_FROM_MAINTENANCE"; payload: { partId: string; recordId: string; expiryDate: string | null; certificateUrl: string | null; historyEvent: HistoryEvent } }
  | { type: "ADD_ALERT"; payload: Alert }
  | { type: "MARK_ALERT_READ"; payload: string }
  | { type: "MARK_ALL_READ" }
  | { type: "ADD_HISTORY"; payload: HistoryEvent };

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
      const historyEvent: HistoryEvent = {
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
      };
      return {
        ...state,
        spareParts: state.spareParts.map(p => p.id === action.payload.id ? action.payload : p),
        history: [...state.history, historyEvent],
      };
    }

    case "IMPORT_PARTS": {
      const merged = [...state.spareParts];
      const newEvents: HistoryEvent[] = [];
      for (const incoming of action.payload) {
        const idx = merged.findIndex(p => p.serialNumber === incoming.serialNumber);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...incoming };
          newEvents.push({ id: `he-${Date.now()}-${incoming.serialNumber}`, partId: incoming.id, partNumber: incoming.partNumber, serialNumber: incoming.serialNumber, eventType: "imported", description: "Part updated via Excel import", performedBy: "Storage Team", timestamp: new Date().toISOString() });
        } else {
          merged.push(incoming);
          newEvents.push({ id: `he-${Date.now()}-${incoming.serialNumber}`, partId: incoming.id, partNumber: incoming.partNumber, serialNumber: incoming.serialNumber, eventType: "imported", description: "Part imported via Excel", performedBy: "Storage Team", timestamp: new Date().toISOString() });
        }
      }
      return { ...state, spareParts: merged, history: [...state.history, ...newEvents] };
    }

    case "SEND_FOR_MAINTENANCE":
      return {
        ...state,
        spareParts: state.spareParts.map(p =>
          p.id === action.payload.part.id ? action.payload.part : p
        ),
        maintenanceRecords: [...state.maintenanceRecords, action.payload.record],
        history: [...state.history, action.payload.historyEvent],
      };

    case "RETURN_FROM_MAINTENANCE": {
      const historyEvent = action.payload.historyEvent;
      return {
        ...state,
        spareParts: state.spareParts.map(p => {
          if (p.id !== action.payload.partId) return p;
          return {
            ...p,
            status: "Available",
            quantity: p.quantity + 1,
            expiryDate: action.payload.expiryDate ?? p.expiryDate,
          };
        }),
        maintenanceRecords: state.maintenanceRecords.map(r =>
          r.id === action.payload.recordId
            ? { ...r, status: "Returned", actualReturnDate: new Date().toISOString().split("T")[0], certificateUrl: action.payload.certificateUrl }
            : r
        ),
        history: [...state.history, historyEvent],
      };
    }

    case "ADD_ALERT":
      return { ...state, alerts: [...state.alerts, action.payload] };

    case "MARK_ALERT_READ":
      return { ...state, alerts: state.alerts.map(a => a.id === action.payload ? { ...a, isRead: true } : a) };

    case "MARK_ALL_READ":
      return { ...state, alerts: state.alerts.map(a => ({ ...a, isRead: true })) };

    case "ADD_HISTORY":
      return { ...state, history: [...state.history, action.payload] };

    default:
      return state;
  }
}

const initialState: AppState = {
  spareParts: initialSpareParts,
  maintenanceRecords: initialMaintenanceRecords,
  alerts: initialAlerts,
  history: initialHistory,
  currentUser: { name: "Ahmed Al-Qahtani", role: "Maintenance Team", initials: "AA" },
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

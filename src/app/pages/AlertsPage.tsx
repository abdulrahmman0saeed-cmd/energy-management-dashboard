import { useState } from "react";
import { AlertTriangle, Clock, TrendingDown, Wrench, CheckCheck, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useApp } from "../context/AppContext";
import { SEVERITY_BADGE, SEVERITY_ICON_BG, SEVERITY_ICON_COLOR } from "../lib/statusColors";
import type { AlertType } from "../types";

const TYPE_LABELS: Record<AlertType, string> = {
  "expiry": "Expiry",
  "low-stock": "Low Stock",
  "maintenance-return": "Maintenance Return",
};

const TYPE_ICONS: Record<AlertType, React.ElementType> = {
  "expiry": Clock,
  "low-stock": TrendingDown,
  "maintenance-return": Wrench,
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-600",
  warning:  "bg-amber-500",
  info:     "bg-blue-600",
};

export function AlertsPage() {
  const { state, dispatch } = useApp();
  const [typeFilter, setTypeFilter] = useState<"all" | AlertType>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");

  const filtered = state.alerts.filter(a => {
    const matchType = typeFilter === "all" || a.type === typeFilter;
    const matchRead = readFilter === "all" || !a.isRead;
    return matchType && matchRead;
  });

  const unreadCount = state.alerts.filter(a => !a.isRead).length;
  const criticalCount = state.alerts.filter(a => a.severity === "critical" && !a.isRead).length;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Expiry, low stock, and maintenance return notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="gap-2" onClick={() => dispatch({ type: "MARK_ALL_READ" })}>
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </div>
          <div><p className="text-xs font-medium text-muted-foreground">Total Active</p><p className="text-2xl font-bold text-foreground">{unreadCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-700" />
          </div>
          <div><p className="text-xs font-medium text-muted-foreground">Critical</p><p className="text-2xl font-bold text-red-700">{criticalCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
          <div><p className="text-xs font-medium text-muted-foreground">Expiry</p><p className="text-2xl font-bold text-foreground">{state.alerts.filter(a => a.type === "expiry" && !a.isRead).length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-amber-700" />
          </div>
          <div><p className="text-xs font-medium text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-foreground">{state.alerts.filter(a => a.type === "low-stock" && !a.isRead).length}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "expiry", "low-stock", "maintenance-return"] as const).map(f => (
          <Button key={f} variant={typeFilter === f ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(f)}>
            {f === "all" ? "All Types" : TYPE_LABELS[f as AlertType]}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button variant={readFilter === "unread" ? "default" : "outline"} size="sm" onClick={() => setReadFilter(readFilter === "unread" ? "all" : "unread")}>
            Unread Only
          </Button>
        </div>
      </div>

      {/* Alert List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">{filtered.length} Alert{filtered.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCheck className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-foreground">All clear</p>
              <p className="text-sm mt-1">No alerts to display</p>
            </div>
          )}
          {filtered.map(alert => {
            const Icon = TYPE_ICONS[alert.type];
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  alert.isRead
                    ? "bg-muted/30 border-border opacity-60"
                    : alert.severity === "critical"
                      ? "bg-red-50 border-red-200"
                      : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${SEVERITY_ICON_BG[alert.severity]}`}>
                  <Icon className={`w-4 h-4 ${SEVERITY_ICON_COLOR[alert.severity]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{alert.partNumber}</span>
                    <Badge className={`${SEVERITY_BADGE[alert.severity]} border text-xs font-medium`}>{alert.severity}</Badge>
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[alert.type]}</Badge>
                    {!alert.isRead && <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[alert.severity]}`} />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
                {!alert.isRead && (
                  <Button variant="ghost" size="sm" className="flex-shrink-0 text-xs" onClick={() => dispatch({ type: "MARK_ALERT_READ", payload: alert.id })}>
                    Dismiss
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

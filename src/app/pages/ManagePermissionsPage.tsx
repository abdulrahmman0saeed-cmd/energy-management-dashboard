import {
  LayoutDashboard, Package, FileSpreadsheet, Wrench,
  Bell, FileText, History, LockOpen, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useApp, DEFAULT_PERMISSIONS } from "../context/AppContext";
import type { FeatureId, PermissionTarget } from "../types";

// ── Feature catalogue ─────────────────────────────────────────────────────────
const FEATURES: { id: FeatureId; name: string; description: string; icon: React.ElementType }[] = [
  { id: "dashboard",    name: "Dashboard",    description: "Analytics overview, KPI cards & inventory health",  icon: LayoutDashboard },
  { id: "spare-parts",  name: "Spare Parts",  description: "Full inventory CRUD — add, edit, send for tracking", icon: Package },
  { id: "excel-import", name: "Excel Import", description: "CSV/Excel upload, drag-and-drop & inventory search",  icon: FileSpreadsheet },
  { id: "maintenance",  name: "Maintenance",  description: "Part tracking records, overdue detection & returns",  icon: Wrench },
  { id: "alerts",       name: "Alerts",       description: "Expiry, low-stock & overdue-return notifications",    icon: Bell },
  { id: "reports",      name: "Reports",      description: "Generate & export tabular inventory reports",         icon: FileText },
  { id: "history",      name: "History",      description: "Full part lifecycle event timeline",                  icon: History },
];

// ── Access options ────────────────────────────────────────────────────────────
const ACCESS_OPTIONS: { value: PermissionTarget; label: string; color: string; activeCls: string }[] = [
  { value: "Maintenance Team", label: "Maintenance",  color: "text-blue-700",   activeCls: "bg-blue-600 text-white border-blue-600" },
  { value: "Storage Team",     label: "Storage",      color: "text-amber-700",  activeCls: "bg-amber-500 text-white border-amber-500" },
  { value: "both",             label: "Both",         color: "text-emerald-700",activeCls: "bg-emerald-600 text-white border-emerald-600" },
  { value: "none",             label: "None",         color: "text-slate-500",  activeCls: "bg-slate-400 text-white border-slate-400" },
];

const ACCESS_BADGE: Record<PermissionTarget, string> = {
  "Maintenance Team": "bg-blue-50   text-blue-800   border-blue-200",
  "Storage Team":     "bg-amber-50  text-amber-800  border-amber-200",
  "both":             "bg-emerald-50 text-emerald-800 border-emerald-200",
  "none":             "bg-slate-100 text-slate-600  border-slate-200",
};

export function ManagePermissionsPage() {
  const { state, dispatch } = useApp();
  const perms = state.featurePermissions;

  const set = (featureId: FeatureId, access: PermissionTarget) =>
    dispatch({ type: "SET_FEATURE_PERMISSION", payload: { featureId, access } });

  const resetAll = () =>
    (Object.keys(DEFAULT_PERMISSIONS) as FeatureId[]).forEach(id =>
      dispatch({ type: "SET_FEATURE_PERMISSION", payload: { featureId: id, access: DEFAULT_PERMISSIONS[id] } })
    );

  const accessLabel: Record<PermissionTarget, string> = {
    "Maintenance Team": "Maintenance Team",
    "Storage Team":     "Storage Team",
    "both":             "Both",
    "none":             "None",
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <LockOpen className="w-5 h-5 text-primary" /> Manage Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control which role can access each feature. Changes take effect immediately.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0" onClick={resetAll}>
          <Lock className="w-3.5 h-3.5" /> Reset to Defaults
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs font-medium text-muted-foreground">Access levels:</span>
        {ACCESS_OPTIONS.map(o => (
          <span key={o.value} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ACCESS_BADGE[o.value]}`}>
            {accessLabel[o.value]}
          </span>
        ))}
      </div>

      {/* Feature table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Feature Access Control</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-52">Feature</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Current Access</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-80">Set Access</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => {
                  const Icon = feature.icon;
                  const current = perms[feature.id];
                  return (
                    <tr
                      key={feature.id}
                      className={`border-b border-border last:border-0 hover:bg-accent/30 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}
                    >
                      {/* Feature name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold text-foreground">{feature.name}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-muted-foreground text-xs leading-relaxed">{feature.description}</td>

                      {/* Current badge */}
                      <td className="px-5 py-4">
                        <Badge className={`${ACCESS_BADGE[current]} border text-xs font-medium`}>
                          {accessLabel[current]}
                        </Badge>
                      </td>

                      {/* Toggle buttons */}
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {ACCESS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => set(feature.id, opt.value)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                current === opt.value
                                  ? opt.activeCls
                                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <div className="grid grid-cols-2 gap-4">
        {(["Maintenance Team", "Storage Team"] as const).map(role => {
          const visible = FEATURES.filter(f => {
            const a = perms[f.id];
            return a === "both" || a === role;
          });
          return (
            <Card key={role}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className={`${role === "Maintenance Team" ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-amber-50 text-amber-800 border-amber-200"} border text-xs`}>
                    {role}
                  </Badge>
                  will see {visible.length} feature{visible.length !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {visible.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No features accessible</span>
                  ) : visible.map(f => {
                    const Icon = f.icon;
                    return (
                      <span key={f.id} className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-md text-foreground">
                        <Icon className="w-3 h-3" /> {f.name}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

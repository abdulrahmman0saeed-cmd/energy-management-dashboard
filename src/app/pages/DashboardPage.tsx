import { Package, AlertTriangle, Wrench, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useApp } from "../context/AppContext";
import { STATUS_BADGE } from "../lib/statusColors";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
}

function StatCard({ title, value, sub, icon: Icon, iconBg, iconColor, accentBorder }: StatCardProps) {
  return (
    <Card className={`border-l-4 ${accentBorder}`}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1 leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusRowProps {
  label: string;
  count: number;
  pct: number;
  dotCls: string;
  barCls: string;
  textCls: string;
}

function StatusRow({ label, count, pct, dotCls, barCls, textCls }: StatusRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotCls}`} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-muted-foreground">{count} parts</span>
          <span className={`text-sm font-semibold w-10 text-right ${textCls}`}>{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { state } = useApp();
  const { spareParts, alerts, maintenanceRecords } = state;

  const today = new Date();
  const total = spareParts.length;

  const available    = spareParts.filter(p => p.status === "Available").length;
  const underTracking = spareParts.filter(p => p.status === "Under Tracking").length;
  const expired      = spareParts.filter(p => p.status === "Expired" || (p.expiryDate && new Date(p.expiryDate) < today)).length;

  const expiredSoon = spareParts.filter(p => {
    if (!p.expiryDate || p.status === "Under Tracking") return false;
    const diff = (new Date(p.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= p.expiryAlertDays;
  });

  const nearExpiry = expiredSoon;
  const lowStock   = spareParts.filter(p => p.quantity > 0 && p.quantity <= p.minStockThreshold);

  const overdueReturns = maintenanceRecords.filter(
    r => r.status !== "Returned" && new Date(r.expectedReturnDate) < today
  );

  const unreadAlerts  = alerts.filter(a => !a.isRead);
  const criticalAlerts = unreadAlerts.filter(a => a.severity === "critical");

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{state.currentUser.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {state.currentUser.role} · Spare Parts Tracking System
          </p>
        </div>
        {unreadAlerts.length > 0 && (
          <div className="flex gap-2 flex-shrink-0">
            {criticalAlerts.length > 0 && (
              <Badge className="bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 gap-1.5 text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                {criticalAlerts.length} Critical
              </Badge>
            )}
            <Badge className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-medium">
              {unreadAlerts.length} Active Alert{unreadAlerts.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Available"      value={`${pct(available)}%`}           sub={`${available} of ${total} parts`} icon={CheckCircle}  iconBg="bg-emerald-100" iconColor="text-emerald-700" accentBorder="border-l-emerald-500" />
        <StatCard title="Under Tracking" value={`${pct(underTracking)}%`}        sub={`${underTracking} parts`}         icon={Wrench}       iconBg="bg-blue-100"    iconColor="text-blue-700"    accentBorder="border-l-blue-500" />
        <StatCard title="Expired Soon"   value={`${pct(expiredSoon.length)}%`}   sub={`${expiredSoon.length} parts`}    icon={Clock}        iconBg="bg-orange-100"  iconColor="text-orange-700"  accentBorder="border-l-orange-500" />
        <StatCard title="Expired"        value={`${pct(expired)}%`}              sub={`${expired} parts`}               icon={AlertTriangle} iconBg="bg-red-100"    iconColor="text-red-700"     accentBorder="border-l-red-500" />
        <StatCard title="Low Stock"      value={lowStock.length.toString()}       sub="below threshold"                  icon={TrendingDown} iconBg="bg-amber-100"   iconColor="text-amber-700"   accentBorder="border-l-amber-500" />
      </div>

      {/* ── Inventory Breakdown (replaces Health + Bar chart) ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Inventory Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusRow label="Available"      count={available}         pct={pct(available)}         dotCls="bg-emerald-500" barCls="bg-emerald-500" textCls="text-emerald-600" />
          <StatusRow label="Under Tracking" count={underTracking}      pct={pct(underTracking)}      dotCls="bg-blue-500"    barCls="bg-blue-500"    textCls="text-blue-600" />
          <StatusRow label="Expired Soon"   count={expiredSoon.length} pct={pct(expiredSoon.length)} dotCls="bg-orange-500"  barCls="bg-orange-500"  textCls="text-orange-600" />
          <StatusRow label="Expired"        count={expired}            pct={pct(expired)}            dotCls="bg-red-500"     barCls="bg-red-500"     textCls="text-red-600" />
          <StatusRow label="Low Stock"      count={lowStock.length}    pct={pct(lowStock.length)}    dotCls="bg-amber-500"   barCls="bg-amber-500"   textCls="text-amber-600" />
        </CardContent>
      </Card>

      {/* ── Key Counters ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overdue Returns</p>
              <p className="text-3xl font-bold text-foreground leading-none mt-0.5">{overdueReturns.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Past expected return date</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Under Tracking</p>
              <p className="text-3xl font-bold text-foreground leading-none mt-0.5">{underTracking}</p>
              <p className="text-xs text-muted-foreground mt-1">Currently tracked parts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alert + Stock + Expiry Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Active Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {unreadAlerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${alert.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === "critical" ? "bg-red-600" : "bg-amber-500"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{alert.partNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
            {unreadAlerts.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active alerts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-600" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {lowStock.slice(0, 5).map(part => (
              <div key={part.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/60 border border-border">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{part.partNumber}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{part.description}</p>
                </div>
                <Badge className="bg-amber-50 text-amber-800 border-amber-200 border text-xs flex-shrink-0">
                  {part.quantity} / {part.minStockThreshold}
                </Badge>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All stock levels OK</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nearing Expiry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Nearing Expiry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {nearExpiry.slice(0, 5).map(part => {
              const daysLeft = Math.ceil(
                (new Date(part.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={part.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/60 border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{part.partNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{part.expiryDate}</p>
                  </div>
                  <Badge className={`border text-xs flex-shrink-0 ${daysLeft <= 7 ? "bg-red-50 text-red-800 border-red-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                    {daysLeft}d left
                  </Badge>
                </div>
              );
            })}
            {nearExpiry.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No parts nearing expiry</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Under Tracking ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" /> Parts Under Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {maintenanceRecords.filter(r => r.status !== "Returned").map(record => {
            const isOverdue = new Date(record.expectedReturnDate) < today;
            return (
              <div
                key={record.id}
                className={`flex items-center justify-between gap-4 p-3 rounded-lg border ${isOverdue ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {record.partNumber}
                    <span className="font-normal text-muted-foreground ml-2">— {record.description}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sent: {record.startDate} · Expected: {record.expectedReturnDate}
                  </p>
                </div>
                <Badge className={`border text-xs flex-shrink-0 ${isOverdue ? "bg-red-50 text-red-800 border-red-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                  {isOverdue ? "Overdue" : "Active"}
                </Badge>
              </div>
            );
          })}
          {maintenanceRecords.filter(r => r.status !== "Returned").length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No parts currently under tracking</p>
          )}
        </CardContent>
      </Card>

      {/* ── Status Summary Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
            All Parts — Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Part #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.map((part, i) => {
                  const isExpired  = part.expiryDate && new Date(part.expiryDate) < today;
                  const isLowStock = part.quantity <= part.minStockThreshold && part.quantity > 0 && part.status !== "Under Tracking";
                  const daysLeft   = part.expiryDate ? (new Date(part.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) : null;
                  const status     = part.status === "Under Tracking" ? "Under Tracking"
                    : isExpired  ? "Expired"
                    : (daysLeft !== null && daysLeft >= 0 && daysLeft <= part.expiryAlertDays) ? "Expired Soon"
                    : isLowStock ? "Low Stock"
                    : "Available";
                  return (
                    <tr key={part.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"} hover:bg-accent/30 transition-colors`}>
                      <td className="px-6 py-3 font-semibold text-foreground">{part.partNumber}</td>
                      <td className="px-6 py-3 text-foreground">{part.description}</td>
                      <td className="px-6 py-3 text-muted-foreground">{part.location}</td>
                      <td className="px-6 py-3 font-medium text-foreground">{part.quantity}</td>
                      <td className="px-6 py-3">
                        <Badge className={`${STATUS_BADGE[status]} border text-xs font-medium`}>{status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

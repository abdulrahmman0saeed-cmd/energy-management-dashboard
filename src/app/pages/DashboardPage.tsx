import { Package, AlertTriangle, Wrench, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useApp } from "../context/AppContext";

function StatCard({ title, value, icon: Icon, color, sub }: {
  title: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { state } = useApp();
  const { spareParts, alerts, maintenanceRecords } = state;

  const total = spareParts.length;
  const available = spareParts.filter(p => p.status === "Available").length;
  const underMaintenance = spareParts.filter(p => p.status === "Under Maintenance").length;
  const expired = spareParts.filter(p => p.status === "Expired").length;
  const today = new Date();

  const nearExpiry = spareParts.filter(p => {
    if (!p.expiryDate || p.status === "Expired") return false;
    const diff = (new Date(p.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= p.expiryAlertDays;
  });

  const lowStock = spareParts.filter(p => p.quantity > 0 && p.quantity <= p.minStockThreshold);

  const overdueReturns = maintenanceRecords.filter(r => {
    if (r.status === "Returned") return false;
    return new Date(r.expectedReturnDate) < today;
  });

  const unreadAlerts = alerts.filter(a => !a.isRead);

  const availablePct = total ? Math.round((available / total) * 100) : 0;
  const maintenancePct = total ? Math.round((underMaintenance / total) * 100) : 0;
  const expiryPct = total ? Math.round((nearExpiry.length / total) * 100) : 0;
  const expiredPct = total ? Math.round((expired / total) * 100) : 0;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome, {state.currentUser.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Spare Parts Tracking System — {state.currentUser.role}
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
          {unreadAlerts.length} Active Alert{unreadAlerts.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Available Parts" value={`${availablePct}%`} icon={CheckCircle} color="bg-green-500" sub={`${available} of ${total} parts`} />
        <StatCard title="Under Maintenance" value={`${maintenancePct}%`} icon={Wrench} color="bg-blue-500" sub={`${underMaintenance} parts`} />
        <StatCard title="Nearing Expiry" value={`${expiryPct}%`} icon={Clock} color="bg-amber-500" sub={`${nearExpiry.length} parts`} />
        <StatCard title="Expired" value={`${expiredPct}%`} icon={AlertTriangle} color="bg-red-500" sub={`${expired} parts`} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Parts</p>
              <p className="text-3xl font-semibold">{lowStock.length}</p>
              <p className="text-xs text-muted-foreground">Below minimum threshold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue Returns</p>
              <p className="text-3xl font-semibold">{overdueReturns.length}</p>
              <p className="text-xs text-muted-foreground">Past expected return date</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Health Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Available</span><span className="text-green-600 font-medium">{availablePct}%</span>
            </div>
            <Progress value={availablePct} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Under Maintenance</span><span className="text-blue-600 font-medium">{maintenancePct}%</span>
            </div>
            <Progress value={maintenancePct} className="h-2 [&>div]:bg-blue-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Nearing Expiry</span><span className="text-amber-600 font-medium">{expiryPct}%</span>
            </div>
            <Progress value={expiryPct} className="h-2 [&>div]:bg-amber-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Expired</span><span className="text-red-600 font-medium">{expiredPct}%</span>
            </div>
            <Progress value={expiredPct} className="h-2 [&>div]:bg-red-500" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unreadAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-accent/40">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
                <div>
                  <p className="text-xs font-medium">{alert.partNumber}</p>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            ))}
            {unreadAlerts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active alerts</p>}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-500" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.slice(0, 5).map(part => (
              <div key={part.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/40">
                <div>
                  <p className="text-xs font-medium">{part.partNumber}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{part.description}</p>
                </div>
                <Badge variant="destructive" className="text-xs">Qty: {part.quantity}</Badge>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">All stock levels OK</p>}
          </CardContent>
        </Card>

        {/* Nearing Expiry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Nearing Expiry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nearExpiry.slice(0, 5).map(part => {
              const daysLeft = Math.ceil((new Date(part.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={part.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/40">
                  <div>
                    <p className="text-xs font-medium">{part.partNumber}</p>
                    <p className="text-xs text-muted-foreground">{part.expiryDate}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{daysLeft}d</Badge>
                </div>
              );
            })}
            {nearExpiry.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No parts nearing expiry</p>}
          </CardContent>
        </Card>
      </div>

      {/* Under Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" /> Parts Under Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {maintenanceRecords.filter(r => r.status !== "Returned").map(record => {
              const isOverdue = new Date(record.expectedReturnDate) < today;
              return (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/40">
                  <div>
                    <p className="text-sm font-medium">{record.partNumber} — {record.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent: {record.startDate} · Expected Return: {record.expectedReturnDate}
                    </p>
                  </div>
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue ? "Overdue" : "Active"}
                  </Badge>
                </div>
              );
            })}
            {maintenanceRecords.filter(r => r.status !== "Returned").length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No parts currently under maintenance</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

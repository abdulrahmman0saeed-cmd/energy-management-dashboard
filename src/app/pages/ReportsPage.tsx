import { useState } from "react";
import { Download, FileText, TrendingDown, Clock, Wrench, History, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import { MAINTENANCE_STATUS_BADGE } from "../lib/statusColors";
import type { ForecastItem } from "../types";

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState("near-expiry");
  const today = new Date();

  // Expired Soon (within alert window, not yet expired)
  const nearExpiryParts = state.spareParts.filter(p => {
    if (!p.expiryDate) return false;
    const diff = (new Date(p.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= p.expiryAlertDays;
  }).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

  // Low Stock
  const lowStockParts = state.spareParts.filter(p => p.quantity <= p.minStockThreshold && p.status !== "Under Tracking");

  // Maintenance
  const maintenanceEnriched = state.maintenanceRecords.map(r => ({
    ...r,
    computedStatus: r.actualReturnDate ? "Returned" : (new Date(r.expectedReturnDate) < today ? "Overdue" : "Active"),
  }));

  // Forecast: use Excel-imported consumedQuantity if available, otherwise count from history
  const forecast: ForecastItem[] = state.spareParts.map(part => {
    const historyUsage = state.history.filter(h =>
      h.partId === part.id && (h.eventType === "maintenance-sent" || h.eventType === "quantity-update")
    ).length;
    const consumed = part.consumedQuantity ?? historyUsage;
    const currentStock: number | "Zero Stock" = part.currentStockLabel === "Zero Stock" ? "Zero Stock" : part.quantity;
    return {
      class: part.class,
      partNumber: part.partNumber,
      description: part.description,
      consumedQuantity: consumed,
      currentStock,
      forecastedDemand: Math.round(consumed * 1.15),
    };
  }).filter(f => f.consumedQuantity > 0).sort((a, b) => b.consumedQuantity - a.consumedQuantity);

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate, preview, and export inventory and maintenance reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="near-expiry" className="gap-1.5"><Clock className="w-3.5 h-3.5" />Near Expiry</TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-1.5"><TrendingDown className="w-3.5 h-3.5" />Low Stock</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5"><Wrench className="w-3.5 h-3.5" />Maintenance</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="w-3.5 h-3.5" />Part History</TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Annual Forecast</TabsTrigger>
        </TabsList>

        {/* Near Expiry */}
        <TabsContent value="near-expiry">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Near Expiry Report</CardTitle>
                <CardDescription>{nearExpiryParts.length} parts at or within expiry alert threshold</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV("near-expiry.csv", ["Part #", "Serial #", "Description", "Quantity", "Location", "Expiry Date", "Days Remaining"],
                nearExpiryParts.map(p => {
                  const days = Math.ceil((new Date(p.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return [p.partNumber, p.serialNumber, p.description, p.quantity, p.location, p.expiryDate!, days];
                }))}>
                <Download className="w-3.5 h-3.5" />Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable headers={["Part #", "Serial #", "Description", "Qty", "Location", "Expiry Date", "Days"]}
                rows={nearExpiryParts.map(p => {
                  const days = Math.ceil((new Date(p.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return [p.partNumber, p.serialNumber, p.description, p.quantity, p.location, p.expiryDate!,
                    <Badge key="d" className={days < 0 ? "bg-red-100 text-red-700 border-red-200 border text-xs" : "bg-amber-100 text-amber-700 border-amber-200 border text-xs"}>{days < 0 ? "Expired" : `${days}d`}</Badge>];
                })} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock */}
        <TabsContent value="low-stock">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-4 h-4 text-orange-500" />Low Stock Report</CardTitle>
                <CardDescription>{lowStockParts.length} parts at or below minimum stock threshold</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV("low-stock.csv", ["Part #", "Serial #", "Description", "Qty", "Min Threshold", "Location"],
                lowStockParts.map(p => [p.partNumber, p.serialNumber, p.description, p.quantity, p.minStockThreshold, p.location]))}>
                <Download className="w-3.5 h-3.5" />Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable headers={["Part #", "Serial #", "Description", "Qty", "Min Threshold", "Location"]}
                rows={lowStockParts.map(p => [p.partNumber, p.serialNumber, p.description,
                  <span key="q" className="text-red-600 font-semibold">{p.quantity}</span>, p.minStockThreshold, p.location])} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-500" />Maintenance Report</CardTitle>
                <CardDescription>{maintenanceEnriched.length} total maintenance records</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV("maintenance.csv", ["Part #", "Serial #", "Description", "Start Date", "Expected Return", "Actual Return", "Status"],
                maintenanceEnriched.map(r => [r.partNumber, r.serialNumber, r.description, r.startDate, r.expectedReturnDate, r.actualReturnDate ?? "Pending", r.computedStatus]))}>
                <Download className="w-3.5 h-3.5" />Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable headers={["Part #", "Serial #", "Description", "Start Date", "Expected Return", "Actual Return", "Status"]}
                rows={maintenanceEnriched.map(r => [r.partNumber, r.serialNumber, r.description, r.startDate, r.expectedReturnDate, r.actualReturnDate ?? "—",
                  <Badge key="s" className={`${MAINTENANCE_STATUS_BADGE[r.computedStatus] ?? "bg-slate-100 text-slate-700 border-slate-200"} border text-xs font-medium`}>{r.computedStatus}</Badge>])} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Part History */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" />Spare Part History Report</CardTitle>
                <CardDescription>{state.history.length} recorded events</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV("history.csv", ["Part #", "Serial #", "Event", "Description", "Old Value", "New Value", "Performed By", "Timestamp"],
                state.history.map(h => [h.partNumber, h.serialNumber, h.eventType, h.description, h.oldValue ?? "", h.newValue ?? "", h.performedBy, h.timestamp]))}>
                <Download className="w-3.5 h-3.5" />Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable headers={["Part #", "Serial #", "Event", "Description", "Old Value", "New Value", "Performed By", "Timestamp"]}
                rows={[...state.history].reverse().map(h => [h.partNumber, h.serialNumber, <Badge key="e" variant="outline" className="text-xs">{h.eventType}</Badge>, h.description, h.oldValue ?? "—", h.newValue ?? "—", h.performedBy, new Date(h.timestamp).toLocaleString()])} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast */}
        <TabsContent value="forecast">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Annual Forecast Report</CardTitle>
                <CardDescription>Yearly spare parts demand forecast based on consumption history</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV("forecast.csv", ["Class", "Part #", "Description", "Consumed Qty", "Current Stock", "Forecasted Demand"],
                forecast.map(f => [f.class, f.partNumber, f.description, f.consumedQuantity, f.currentStock, f.forecastedDemand]))}>
                <Download className="w-3.5 h-3.5" />Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable headers={["Class", "Part #", "Description", "Consumed Qty", "Current Stock", "Forecasted Demand"]}
                rows={forecast.map(f => {
                  const stockNum = f.currentStock === "Zero Stock" ? 0 : f.currentStock;
                  const stockEl = f.currentStock === "Zero Stock"
                    ? <Badge key="s" className="bg-red-50 text-red-700 border-red-200 border text-xs">Zero Stock</Badge>
                    : <span key="s" className={stockNum < f.forecastedDemand ? "text-red-600 font-semibold" : "text-emerald-600"}>{stockNum}</span>;
                  return [
                    <Badge key="c" variant="outline" className="text-xs">{f.class}</Badge>,
                    f.partNumber, f.description,
                    f.consumedQuantity,
                    stockEl,
                    f.forecastedDemand,
                  ];
                })} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
        <FileText className="w-8 h-8 text-muted-foreground/50" />
        <span className="font-medium text-foreground">No data</span>
        <span className="text-sm">No records match this report.</span>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-border last:border-0 hover:bg-accent/40 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
              {row.map((cell, j) => <td key={j} className="px-5 py-3.5 text-foreground">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

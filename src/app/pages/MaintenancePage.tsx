import { useState } from "react";
import { Wrench, RotateCcw, FileText, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { useApp } from "../context/AppContext";
import type { HistoryEvent } from "../types";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-blue-100 text-blue-700 border-blue-200",
  Overdue: "bg-red-100 text-red-700 border-red-200",
  Returned: "bg-green-100 text-green-700 border-green-200",
};

export function MaintenancePage() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Overdue" | "Returned">("all");
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState({ expiryDate: "", certificateUrl: "" });

  const today = new Date();

  const enriched = state.maintenanceRecords.map(r => ({
    ...r,
    status: r.actualReturnDate ? "Returned" : (new Date(r.expectedReturnDate) < today ? "Overdue" : "Active") as "Active" | "Overdue" | "Returned",
  }));

  const filtered = enriched.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.partNumber.toLowerCase().includes(s) || r.description.toLowerCase().includes(s) || r.serialNumber.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openReturn = (recordId: string) => {
    const record = state.maintenanceRecords.find(r => r.id === recordId);
    const part = record ? state.spareParts.find(p => p.id === record.partId) : null;
    setSelectedRecordId(recordId);
    setReturnForm({ expiryDate: part?.expiryDate ?? "", certificateUrl: "" });
    setShowReturnDialog(true);
  };

  const handleReturn = () => {
    if (!selectedRecordId) return;
    const record = state.maintenanceRecords.find(r => r.id === selectedRecordId);
    if (!record) return;
    const historyEvent: HistoryEvent = {
      id: `he-${Date.now()}`,
      partId: record.partId,
      partNumber: record.partNumber,
      serialNumber: record.serialNumber,
      eventType: "maintenance-returned",
      description: "Returned from maintenance",
      oldValue: "Under Maintenance",
      newValue: "Available",
      performedBy: state.currentUser.name,
      timestamp: new Date().toISOString(),
    };
    dispatch({
      type: "RETURN_FROM_MAINTENANCE",
      payload: {
        partId: record.partId,
        recordId: selectedRecordId,
        expiryDate: returnForm.expiryDate || null,
        certificateUrl: returnForm.certificateUrl || null,
        historyEvent,
      },
    });
    setShowReturnDialog(false);
  };

  const activeCount = enriched.filter(r => r.status === "Active").length;
  const overdueCount = enriched.filter(r => r.status === "Overdue").length;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div>
        <h1 className="text-2xl font-semibold">Maintenance Tracking</h1>
        <p className="text-muted-foreground mt-1">Monitor spare parts sent for maintenance and track their return status</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-3xl font-semibold text-blue-600">{activeCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-3xl font-semibold text-red-600">{overdueCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Returned</p>
          <p className="text-3xl font-semibold text-green-600">{enriched.filter(r => r.status === "Returned").length}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by part number, description or serial…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(["all", "Active", "Overdue", "Returned"] as const).map(s => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
                {s === "all" ? "All" : s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Maintenance Records ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Part #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Serial #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expected Return</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actual Return</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Certificate</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <tr key={record.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{record.partNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.serialNumber}</td>
                    <td className="px-4 py-3">{record.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.startDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.expectedReturnDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.actualReturnDate ?? "—"}</td>
                    <td className="px-4 py-3">
                      {record.certificateUrl
                        ? <span className="flex items-center gap-1 text-primary text-xs cursor-pointer hover:underline"><FileText className="w-3 h-3" />{record.certificateUrl}</span>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${STATUS_COLORS[record.status]} border text-xs`}>{record.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {record.status !== "Returned" && (
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => openReturn(record.id)}>
                          <RotateCcw className="w-3 h-3" /> Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No maintenance records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return from Maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Updated Expiry Date (optional)</Label>
              <Input type="date" value={returnForm.expiryDate} onChange={e => setReturnForm(d => ({ ...d, expiryDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Upload Maintenance Certificate (optional)</Label>
              <Input type="file" accept=".pdf,.jpg,.png" onChange={e => {
                const file = e.target.files?.[0];
                if (file) setReturnForm(d => ({ ...d, certificateUrl: file.name }));
              }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
            <Button onClick={handleReturn}>Confirm Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

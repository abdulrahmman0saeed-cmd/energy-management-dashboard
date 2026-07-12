import { useState } from "react";
import { Plus, Search, Wrench, RotateCcw, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useApp } from "../context/AppContext";
import type { SparePart, MaintenanceRecord, HistoryEvent } from "../types";

const STATUS_COLORS: Record<string, string> = {
  Available: "bg-green-100 text-green-700 border-green-200",
  "Under Maintenance": "bg-blue-100 text-blue-700 border-blue-200",
  Expired: "bg-red-100 text-red-700 border-red-200",
  "Low Stock": "bg-orange-100 text-orange-700 border-orange-200",
};

const EMPTY_PART: Omit<SparePart, "id"> = {
  partNumber: "", serialNumber: "", description: "", quantity: 0,
  location: "", expiryDate: "", status: "Available",
  minStockThreshold: 1, expiryAlertDays: 30, maintenanceAlertDays: 3, class: "B",
};

export function SparePartsPage() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editPart, setEditPart] = useState<SparePart | null>(null);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [formData, setFormData] = useState(EMPTY_PART);
  const [maintenanceForm, setMaintenanceForm] = useState({ startDate: "", expectedReturnDate: "" });
  const [returnForm, setReturnForm] = useState({ expiryDate: "", certificateUrl: "" });

  const today = new Date();

  const computedStatus = (part: SparePart): SparePart["status"] => {
    if (part.status === "Under Maintenance") return "Under Maintenance";
    if (part.expiryDate && new Date(part.expiryDate) < today) return "Expired";
    if (part.quantity <= part.minStockThreshold && part.quantity > 0) return "Low Stock";
    return part.status;
  };

  const filtered = state.spareParts.filter(p => {
    const s = search.toLowerCase();
    const st = computedStatus(p);
    const matchSearch = !s || p.partNumber.toLowerCase().includes(s) || p.serialNumber.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.location.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || st === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setFormData(EMPTY_PART); setEditPart(null); setShowAddDialog(true); };
  const openEdit = (part: SparePart) => { setFormData({ ...part }); setEditPart(part); setShowAddDialog(true); };

  const handleSave = () => {
    if (!formData.partNumber || !formData.serialNumber) return;
    if (editPart) {
      dispatch({ type: "UPDATE_PART", payload: { ...formData, id: editPart.id } as SparePart });
    } else {
      dispatch({ type: "ADD_PART", payload: { ...formData, id: `sp-${Date.now()}` } as SparePart });
    }
    setShowAddDialog(false);
  };

  const openSendMaintenance = (part: SparePart) => {
    setSelectedPart(part);
    setMaintenanceForm({ startDate: "", expectedReturnDate: "" });
    setShowMaintenanceDialog(true);
  };

  const handleSendMaintenance = () => {
    if (!selectedPart || !maintenanceForm.startDate || !maintenanceForm.expectedReturnDate) return;
    const record: MaintenanceRecord = {
      id: `mr-${Date.now()}`,
      partId: selectedPart.id,
      partNumber: selectedPart.partNumber,
      serialNumber: selectedPart.serialNumber,
      description: selectedPart.description,
      startDate: maintenanceForm.startDate,
      expectedReturnDate: maintenanceForm.expectedReturnDate,
      actualReturnDate: null,
      certificateUrl: null,
      notes: "",
      status: "Active",
    };
    const historyEvent: HistoryEvent = {
      id: `he-${Date.now()}`,
      partId: selectedPart.id,
      partNumber: selectedPart.partNumber,
      serialNumber: selectedPart.serialNumber,
      eventType: "maintenance-sent",
      description: `Sent for maintenance. Expected return: ${maintenanceForm.expectedReturnDate}`,
      oldValue: "Available",
      newValue: "Under Maintenance",
      performedBy: state.currentUser.name,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: "SEND_FOR_MAINTENANCE", payload: { part: { ...selectedPart, status: "Under Maintenance", quantity: selectedPart.quantity - 1 }, record, historyEvent } });
    setShowMaintenanceDialog(false);
  };

  const openReturn = (part: SparePart) => {
    setSelectedPart(part);
    setReturnForm({ expiryDate: part.expiryDate ?? "", certificateUrl: "" });
    setShowReturnDialog(true);
  };

  const handleReturn = () => {
    if (!selectedPart) return;
    const activeRecord = state.maintenanceRecords.find(r => r.partId === selectedPart.id && r.status !== "Returned");
    const historyEvent: HistoryEvent = {
      id: `he-${Date.now()}`,
      partId: selectedPart.id,
      partNumber: selectedPart.partNumber,
      serialNumber: selectedPart.serialNumber,
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
        partId: selectedPart.id,
        recordId: activeRecord?.id ?? "",
        expiryDate: returnForm.expiryDate || null,
        certificateUrl: returnForm.certificateUrl || null,
        historyEvent,
      },
    });
    setShowReturnDialog(false);
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Spare Parts</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all spare parts inventory</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Part
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by part number, serial, description, location…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filtered.length} Parts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Part #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Serial #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(part => {
                  const status = computedStatus(part);
                  return (
                    <tr key={part.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{part.partNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{part.serialNumber}</td>
                      <td className="px-4 py-3">{part.description}</td>
                      <td className="px-4 py-3">
                        <span className={part.quantity <= part.minStockThreshold ? "text-red-600 font-semibold" : ""}>{part.quantity}</span>
                        <span className="text-muted-foreground text-xs"> / {part.minStockThreshold}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{part.location}</td>
                      <td className="px-4 py-3 text-muted-foreground">{part.expiryDate || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_COLORS[status]} border text-xs`}>{status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(part)} title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {status !== "Under Maintenance" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => openSendMaintenance(part)} title="Send for Maintenance">
                              <Wrench className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {status === "Under Maintenance" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => openReturn(part)} title="Return from Maintenance">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No spare parts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editPart ? "Edit Spare Part" : "Add Spare Part"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Part Number *</Label>
              <Input value={formData.partNumber} onChange={e => setFormData(d => ({ ...d, partNumber: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Serial Number *</Label>
              <Input value={formData.serialNumber} onChange={e => setFormData(d => ({ ...d, serialNumber: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Input value={formData.description} onChange={e => setFormData(d => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input type="number" min={0} value={formData.quantity} onChange={e => setFormData(d => ({ ...d, quantity: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>Min Stock Threshold</Label>
              <Input type="number" min={0} value={formData.minStockThreshold} onChange={e => setFormData(d => ({ ...d, minStockThreshold: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Location</Label>
              <Input value={formData.location} onChange={e => setFormData(d => ({ ...d, location: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Expiry Date</Label>
              <Input type="date" value={formData.expiryDate ?? ""} onChange={e => setFormData(d => ({ ...d, expiryDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Expiry Alert (days before)</Label>
              <Input type="number" min={1} value={formData.expiryAlertDays} onChange={e => setFormData(d => ({ ...d, expiryAlertDays: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={formData.class} onValueChange={v => setFormData(d => ({ ...d, class: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editPart ? "Save Changes" : "Add Part"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send for Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send for Maintenance</DialogTitle>
          </DialogHeader>
          {selectedPart && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-accent/40 rounded-lg text-sm">
                <p className="font-medium">{selectedPart.partNumber} — {selectedPart.description}</p>
                <p className="text-muted-foreground text-xs mt-1">Serial: {selectedPart.serialNumber}</p>
              </div>
              <div className="space-y-1">
                <Label>Maintenance Start Date *</Label>
                <Input type="date" value={maintenanceForm.startDate} onChange={e => setMaintenanceForm(d => ({ ...d, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Expected Return Date *</Label>
                <Input type="date" value={maintenanceForm.expectedReturnDate} onChange={e => setMaintenanceForm(d => ({ ...d, expectedReturnDate: e.target.value }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>Cancel</Button>
            <Button onClick={handleSendMaintenance}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return from Maintenance Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return from Maintenance</DialogTitle>
          </DialogHeader>
          {selectedPart && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-accent/40 rounded-lg text-sm">
                <p className="font-medium">{selectedPart.partNumber} — {selectedPart.description}</p>
                <p className="text-muted-foreground text-xs mt-1">Serial: {selectedPart.serialNumber}</p>
              </div>
              <div className="space-y-1">
                <Label>Updated Expiry Date (optional)</Label>
                <Input type="date" value={returnForm.expiryDate} onChange={e => setReturnForm(d => ({ ...d, expiryDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Maintenance Certificate (optional)</Label>
                <Input type="file" accept=".pdf,.jpg,.png" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setReturnForm(d => ({ ...d, certificateUrl: file.name }));
                }} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
            <Button onClick={handleReturn}>Mark as Returned</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

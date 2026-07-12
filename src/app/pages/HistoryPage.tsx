import { useState } from "react";
import { Search, Clock, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useApp } from "../context/AppContext";
import type { SparePart } from "../types";

const EVENT_LABELS: Record<string, string> = {
  "status-change": "Status Change",
  "maintenance-sent": "Sent for Maintenance",
  "maintenance-returned": "Returned from Maintenance",
  "expiry-update": "Expiry Date Updated",
  "quantity-update": "Quantity Updated",
  "imported": "Imported",
  "created": "Created",
  "edited": "Edited",
};

const EVENT_COLORS: Record<string, string> = {
  "status-change": "bg-purple-100 text-purple-700 border-purple-200",
  "maintenance-sent": "bg-blue-100 text-blue-700 border-blue-200",
  "maintenance-returned": "bg-green-100 text-green-700 border-green-200",
  "expiry-update": "bg-amber-100 text-amber-700 border-amber-200",
  "quantity-update": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "imported": "bg-slate-100 text-slate-700 border-slate-200",
  "created": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "edited": "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_COLORS: Record<string, string> = {
  Available: "bg-green-100 text-green-700 border-green-200",
  "Under Maintenance": "bg-blue-100 text-blue-700 border-blue-200",
  Expired: "bg-red-100 text-red-700 border-red-200",
  "Low Stock": "bg-orange-100 text-orange-700 border-orange-200",
};

export function HistoryPage() {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  const matchingParts = search.trim()
    ? state.spareParts.filter(p =>
        p.partNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const partHistory = selectedPart
    ? [...state.history].filter(h => h.partId === selectedPart.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const computedStatus = (part: SparePart): string => {
    if (part.status === "Under Maintenance") return "Under Maintenance";
    if (part.expiryDate && new Date(part.expiryDate) < new Date()) return "Expired";
    if (part.quantity <= part.minStockThreshold && part.quantity > 0) return "Low Stock";
    return part.status;
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div>
        <h1 className="text-2xl font-semibold">Part History</h1>
        <p className="text-muted-foreground mt-1">Search for a spare part to view its complete lifecycle history</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Part Number or Part Name…"
              className="pl-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedPart(null); }}
            />
          </div>

          {/* Search Results */}
          {search.trim() && matchingParts.length > 0 && !selectedPart && (
            <div className="mt-2 border rounded-lg overflow-hidden">
              {matchingParts.map(part => (
                <button
                  key={part.id}
                  onClick={() => setSelectedPart(part)}
                  className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b last:border-0 flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-sm">{part.partNumber}</span>
                    <span className="text-muted-foreground text-sm ml-2">— {part.description}</span>
                  </div>
                  <Badge className={`${STATUS_COLORS[computedStatus(part)]} border text-xs`}>{computedStatus(part)}</Badge>
                </button>
              ))}
            </div>
          )}
          {search.trim() && matchingParts.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground px-1">No parts found matching "{search}"</p>
          )}
        </CardContent>
      </Card>

      {/* Part Detail + History */}
      {selectedPart && (
        <>
          {/* Part Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" /> Part Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Part Number</p><p className="font-medium">{selectedPart.partNumber}</p></div>
                <div><p className="text-muted-foreground text-xs">Description</p><p className="font-medium">{selectedPart.description}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p>
                  <Badge className={`${STATUS_COLORS[computedStatus(selectedPart)]} border text-xs mt-1`}>{computedStatus(selectedPart)}</Badge>
                </div>
                <div><p className="text-muted-foreground text-xs">Location</p><p className="font-medium">{selectedPart.location}</p></div>
                <div><p className="text-muted-foreground text-xs">Available Qty</p><p className="font-medium">{selectedPart.quantity}</p></div>
                <div><p className="text-muted-foreground text-xs">Expiry Date</p><p className="font-medium">{selectedPart.expiryDate ?? "N/A"}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" /> History Timeline
                <Badge variant="secondary" className="ml-auto">{partHistory.length} events</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partHistory.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No history recorded for this part.</p>
              )}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4 pl-10">
                  {partHistory.map(event => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[1.625rem] top-1 w-3 h-3 rounded-full border-2 border-background bg-primary" />
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${EVENT_COLORS[event.eventType] ?? "bg-gray-100 text-gray-700"} border text-xs`}>
                            {EVENT_LABELS[event.eventType] ?? event.eventType}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mt-1">{event.description}</p>
                        {(event.oldValue || event.newValue) && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {event.oldValue && <span className="line-through">{event.oldValue}</span>}
                            {event.oldValue && event.newValue && <span>→</span>}
                            {event.newValue && <span className="font-medium text-foreground">{event.newValue}</span>}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">By: {event.performedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

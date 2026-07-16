import { useState, useCallback } from "react";
import { Search, FileSpreadsheet, Upload, Package, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useApp } from "../context/AppContext";
import { STATUS_BADGE } from "../lib/statusColors";
import { searchParts } from "../lib/search";
import type { PartStatus } from "../types";

function computeStatus(part: { status: string; expiryDate: string | null; quantity: number; minStockThreshold: number; expiryAlertDays: number }): PartStatus {
  const today = new Date();
  if (part.status === "Under Tracking") return "Under Tracking";
  if (part.expiryDate && new Date(part.expiryDate) < today) return "Expired";
  if (part.expiryDate) {
    const daysLeft = (new Date(part.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= part.expiryAlertDays) return "Expired Soon";
  }
  if (part.quantity <= part.minStockThreshold && part.quantity > 0) return "Low Stock";
  return "Available";
}

export function StorageDashboard() {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const results = search.trim() ? searchParts(state.spareParts, search) : [];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setUploadedFile(file.name);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file.name);
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Storage Team Portal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload inventory sheets and search spare parts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Upload Zone ── */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Excel / CSV Import
            </h2>

            {!uploadedFile ? (
              <label
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                }`}
              >
                <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={handleFileInput} />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Drop your file here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                <p className="text-xs text-muted-foreground mt-3">Supports: .csv · .xlsx · .xls</p>
              </label>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{uploadedFile}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">File ready for import</p>
                </div>
                <Button size="sm" variant="ghost" className="text-emerald-700 h-7 px-2" onClick={() => setUploadedFile(null)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            )}

            {uploadedFile && (
              <Button className="w-full gap-2">
                <Upload className="w-4 h-4" /> Import File
              </Button>
            )}

            {/* Required columns */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Required columns:</p>
              <div className="flex flex-wrap gap-1.5">
                {["Part Number", "Serial Number", "Description", "Location", "Quantity"].map(col => (
                  <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const csv = "Part Number,Serial Number,Description,Class,Location,Quantity,Min Stock,Expiry Date,Alert Days\n";
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "spare-parts-template.csv"; a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full text-xs text-primary hover:underline text-center py-1"
            >
              ↓ Download CSV Template
            </button>
          </CardContent>
        </Card>

        {/* ── Search Bar ── */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Quick Part Search
            </h2>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Part #, Serial #, Description, Location…"
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""}</p>
                {results.map(part => {
                  const status = computeStatus(part);
                  return (
                    <div
                      key={part.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground">{part.partNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">{part.description}</p>
                          <p className="text-xs text-muted-foreground">{part.location}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                        <Badge className={`${STATUS_BADGE[status]} border text-xs`}>{status}</Badge>
                        <span className="text-xs text-muted-foreground">Qty: <span className="font-semibold text-foreground">{part.quantity}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {search.trim() && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No parts found for "<span className="font-medium">{search}</span>"</p>
              </div>
            )}

            {!search.trim() && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Start typing to search {state.spareParts.length} parts</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

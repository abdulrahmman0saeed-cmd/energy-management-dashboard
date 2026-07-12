import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useApp } from "../context/AppContext";
import type { SparePart } from "../types";

type ValidationError = { row: number; field: string; message: string };
type ParsedRow = { data: Omit<SparePart, "id">; errors: ValidationError[]; row: number };

// Required Excel columns (case-insensitive)
const REQUIRED_COLS = ["partNumber", "serialNumber", "description", "quantity", "location"];
const COL_ALIASES: Record<string, string> = {
  "part number": "partNumber", "part no": "partNumber", "partno": "partNumber", "partnumber": "partNumber",
  "serial number": "serialNumber", "serial no": "serialNumber", "serialno": "serialNumber", "serialnumber": "serialNumber",
  "description": "description", "desc": "description",
  "quantity": "quantity", "qty": "quantity", "stock": "quantity",
  "location": "location", "loc": "location", "bin": "location",
  "expiry date": "expiryDate", "expiry": "expiryDate", "expirydate": "expiryDate", "expiry_date": "expiryDate",
  "class": "class",
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

function mapRow(raw: Record<string, string>, rowNum: number): ParsedRow {
  const mapped: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const canonical = COL_ALIASES[k];
    if (canonical) mapped[canonical] = v;
  }

  const errors: ValidationError[] = [];
  for (const col of REQUIRED_COLS) {
    if (!mapped[col] || mapped[col].trim() === "") {
      errors.push({ row: rowNum, field: col, message: `${col} is required` });
    }
  }

  const qty = parseInt(mapped.quantity ?? "0");
  if (isNaN(qty) || qty < 0) errors.push({ row: rowNum, field: "quantity", message: "Quantity must be a non-negative number" });

  const data: Omit<SparePart, "id"> = {
    partNumber: mapped.partNumber?.toUpperCase() ?? "",
    serialNumber: mapped.serialNumber ?? "",
    description: mapped.description ?? "",
    quantity: isNaN(qty) ? 0 : qty,
    location: mapped.location ?? "",
    expiryDate: mapped.expiryDate || null,
    status: "Available",
    minStockThreshold: 2,
    expiryAlertDays: 30,
    maintenanceAlertDays: 3,
    class: mapped.class || "B",
  };

  return { data, errors, row: rowNum };
}

const SAMPLE_CSV = `Part Number,Serial Number,Description,Quantity,Location,Expiry Date,Class
HYD-099,SN-HYD-00999,Hydraulic Filter Assembly,5,Warehouse A - Shelf 10,2026-12-31,A
ENG-200,SN-ENG-00200,Engine Oil Separator,2,Warehouse B - Shelf 3,,B`;

export function ExcelImportPage() {
  const { state, dispatch } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importDone, setImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setImportDone(false);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const parsed = rows.map((row, i) => mapRow(row, i + 2));
      setParsedRows(parsed);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const validRows = parsedRows.filter(r => r.errors.length === 0);
  const invalidRows = parsedRows.filter(r => r.errors.length > 0);

  const handleImport = () => {
    const parts: SparePart[] = validRows.map(r => ({
      ...r.data,
      id: `sp-import-${Date.now()}-${r.row}`,
    }));
    dispatch({ type: "IMPORT_PARTS", payload: parts });
    setImportedCount(parts.length);
    setImportDone(true);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "spare-parts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Excel / CSV Import</h1>
          <p className="text-muted-foreground mt-1">Upload a CSV file to import or update spare parts inventory</p>
        </div>
        <Button variant="outline" onClick={downloadSample} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Download Template
        </Button>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
          >
            <Upload className={`w-10 h-10 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-center">
              <p className="font-medium">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">Supports .csv files. Existing records are updated by Serial Number.</p>
            </div>
            {file && <Badge variant="secondary" className="mt-2">{file.name}</Badge>}
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </CardContent>
      </Card>

      {/* Required Columns Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Required Columns</CardTitle>
          <CardDescription>Your CSV must include these columns (flexible naming accepted)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Part Number", "Serial Number", "Description", "Quantity", "Location"].map(col => (
              <Badge key={col} className="bg-primary/10 text-primary border-primary/20">{col}</Badge>
            ))}
            <Badge variant="outline">Expiry Date (optional)</Badge>
            <Badge variant="outline">Class (optional)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preview & Validation */}
      {parsedRows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview & Validation</CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle className="w-3 h-3" />{validRows.length} Valid</Badge>
                {invalidRows.length > 0 && <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="w-3 h-3" />{invalidRows.length} Invalid</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Errors */}
            {invalidRows.length > 0 && (
              <div className="space-y-2">
                {invalidRows.map(r => r.errors.map(err => (
                  <div key={`${r.row}-${err.field}`} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Row {err.row}:</strong> {err.message}</span>
                  </div>
                )))}
              </div>
            )}

            {/* Table preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Row</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Part #</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Serial #</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Qty</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map(r => (
                    <tr key={r.row} className={`border-b last:border-0 ${r.errors.length > 0 ? "bg-red-50/50" : ""}`}>
                      <td className="px-3 py-2 text-muted-foreground">{r.row}</td>
                      <td className="px-3 py-2 font-medium">{r.data.partNumber}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.data.serialNumber}</td>
                      <td className="px-3 py-2">{r.data.description}</td>
                      <td className="px-3 py-2">{r.data.quantity}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.data.location}</td>
                      <td className="px-3 py-2">
                        {r.errors.length === 0
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import button */}
            {!importDone && (
              <div className="flex justify-end">
                <Button onClick={handleImport} disabled={validRows.length === 0} className="gap-2">
                  <Upload className="w-4 h-4" /> Import {validRows.length} Valid Part{validRows.length !== 1 ? "s" : ""}
                </Button>
              </div>
            )}

            {importDone && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Successfully imported {importedCount} part{importedCount !== 1 ? "s" : ""}. Inventory updated.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          {state.history.filter(h => h.eventType === "imported").slice(-10).reverse().map(h => (
            <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <span className="font-medium">{h.partNumber}</span>
                <span className="text-muted-foreground ml-2">{h.serialNumber}</span>
              </div>
              <span className="text-muted-foreground text-xs">{new Date(h.timestamp).toLocaleString()}</span>
            </div>
          ))}
          {state.history.filter(h => h.eventType === "imported").length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No imports yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

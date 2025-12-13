"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileDown,
  History,
} from "lucide-react";

const exportTypes = [
  { id: "clients", name: "Clients", icon: Users, description: "Client profiles and contact info" },
  { id: "appointments", name: "Appointments", icon: Calendar, description: "Appointment history and bookings" },
  { id: "transactions", name: "Transactions", icon: DollarSign, description: "Sales and payment records" },
  { id: "services", name: "Services", icon: Package, description: "Service catalog and pricing" },
];

const recentExports = [
  { id: "1", type: "Clients", date: new Date("2024-12-01"), records: 1234, format: "CSV" },
  { id: "2", type: "Transactions", date: new Date("2024-11-28"), records: 5678, format: "CSV" },
  { id: "3", type: "Appointments", date: new Date("2024-11-15"), records: 890, format: "JSON" },
];

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState("import");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exporting, setExporting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importType) return;

    setImporting(true);
    setImportProgress(0);

    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate import completion
    setTimeout(() => {
      clearInterval(interval);
      setImportProgress(100);
      setImporting(false);
      setImportResult({
        success: true,
        imported: 156,
        updated: 23,
        skipped: 5,
        errors: 2,
      });
    }, 2500);
  };

  const handleExport = async () => {
    if (selectedExports.length === 0) return;

    setExporting(true);

    // Simulate export
    setTimeout(() => {
      setExporting(false);
      // Trigger download
      const blob = new Blob(["sample data"], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
      a.click();
    }, 1500);
  };

  const toggleExport = (id: string) => {
    setSelectedExports((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import & Export</h1>
        <p className="text-muted-foreground mt-1">
          Import data from other systems or export your data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file to import data into your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Import Type Selection */}
              <div className="space-y-2">
                <Label>What are you importing?</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="appointments">Appointments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV, XLSX, XLS files up to 10MB
                      </p>
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Import Options */}
              {selectedFile && importType && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    <Label>Import Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="skip-header" defaultChecked />
                        <label htmlFor="skip-header" className="text-sm">
                          First row contains headers
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="update-existing" />
                        <label htmlFor="update-existing" className="text-sm">
                          Update existing records (match by email/phone)
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="skip-errors" defaultChecked />
                        <label htmlFor="skip-errors" className="text-sm">
                          Skip rows with errors and continue
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Progress */}
              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {importResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${importResult.success ? "text-green-800" : "text-red-800"}`}>
                      Import {importResult.success ? "Complete" : "Failed"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Imported</p>
                      <p className="font-medium text-green-600">{importResult.imported}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-medium text-blue-600">{importResult.updated}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Skipped</p>
                      <p className="font-medium text-yellow-600">{importResult.skipped}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Errors</p>
                      <p className="font-medium text-red-600">{importResult.errors}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={!selectedFile || !importType || importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle>Download Templates</CardTitle>
              <CardDescription>
                Use these templates to format your data correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {exportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button key={type.id} variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Icon className="h-6 w-6" />
                      <span>{type.name} Template</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Select the data you want to export and choose a format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Type Selection */}
              <div className="space-y-3">
                <Label>Select data to export</Label>
                <div className="grid grid-cols-2 gap-4">
                  {exportTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedExports.includes(type.id);
                    return (
                      <div
                        key={type.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted"
                        }`}
                        onClick={() => toggleExport(type.id)}
                      >
                        <Checkbox checked={isSelected} />
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{type.name}</p>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={selectedExports.length === 0 || exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparing Export...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export {selectedExports.length} Data Type{selectedExports.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                Recent exports from your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExports.map((export_) => (
                  <div
                    key={export_.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileDown className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{export_.type} Export</p>
                        <p className="text-sm text-muted-foreground">
                          {export_.records.toLocaleString()} records • {export_.format}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {export_.date.toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

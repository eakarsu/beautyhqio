"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Download,
  Play,
  Plus,
  X,
  Calendar,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportField {
  id: string;
  name: string;
  type: string;
  category: string;
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

const AVAILABLE_FIELDS: ReportField[] = [
  { id: "client_name", name: "Client Name", type: "text", category: "Clients" },
  { id: "client_email", name: "Client Email", type: "text", category: "Clients" },
  { id: "client_phone", name: "Client Phone", type: "text", category: "Clients" },
  { id: "total_visits", name: "Total Visits", type: "number", category: "Clients" },
  { id: "last_visit", name: "Last Visit Date", type: "date", category: "Clients" },
  { id: "service_name", name: "Service Name", type: "text", category: "Services" },
  { id: "service_price", name: "Service Price", type: "currency", category: "Services" },
  { id: "service_duration", name: "Service Duration", type: "number", category: "Services" },
  { id: "staff_name", name: "Staff Name", type: "text", category: "Staff" },
  { id: "staff_revenue", name: "Staff Revenue", type: "currency", category: "Staff" },
  { id: "staff_appointments", name: "Staff Appointments", type: "number", category: "Staff" },
  { id: "transaction_date", name: "Transaction Date", type: "date", category: "Revenue" },
  { id: "transaction_total", name: "Transaction Total", type: "currency", category: "Revenue" },
  { id: "payment_method", name: "Payment Method", type: "text", category: "Revenue" },
  { id: "tip_amount", name: "Tip Amount", type: "currency", category: "Revenue" },
];

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "between", label: "Between" },
];

export default function ReportBuilderPage() {
  const router = useRouter();
  const [reportName, setReportName] = useState("Untitled Report");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isRunning, setIsRunning] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Clients");

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
    // Clear previous report when fields change
    setReportData([]);
    setHasRun(false);
  };

  const handleCategoryChange = (category: string) => {
    if (category !== activeCategory) {
      setActiveCategory(category);
      setSelectedFields([]); // Clear all selected fields when switching category
      setReportData([]);
      setHasRun(false);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: "", operator: "equals", value: "" }]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const runReport = async () => {
    setIsRunning(true);
    setReportData([]);

    try {
      const startDate = dateRange.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      const endDate = dateRange.end || new Date().toISOString().split("T")[0];

      // Determine which category of data to fetch based on selected fields
      const clientFields = selectedFields.filter(f => AVAILABLE_FIELDS.find(af => af.id === f)?.category === "Clients");
      const serviceFields = selectedFields.filter(f => AVAILABLE_FIELDS.find(af => af.id === f)?.category === "Services");
      const staffFields = selectedFields.filter(f => AVAILABLE_FIELDS.find(af => af.id === f)?.category === "Staff");
      const revenueFields = selectedFields.filter(f => AVAILABLE_FIELDS.find(af => af.id === f)?.category === "Revenue");

      const results: Record<string, unknown>[] = [];

      // Fetch client data if client fields selected
      if (clientFields.length > 0) {
        const res = await fetch(`/api/clients?limit=100`);
        if (res.ok) {
          const data = await res.json();
          const clients = data.clients || data;
          clients.forEach((client: Record<string, unknown>) => {
            const row: Record<string, unknown> = {};
            if (clientFields.includes("client_name")) row.client_name = `${client.firstName} ${client.lastName}`;
            if (clientFields.includes("client_email")) row.client_email = client.email || "-";
            if (clientFields.includes("client_phone")) row.client_phone = client.phone || "-";
            if (clientFields.includes("total_visits")) row.total_visits = client.totalVisits || 0;
            if (clientFields.includes("last_visit")) row.last_visit = client.lastVisit ? new Date(client.lastVisit as string).toLocaleDateString() : "-";
            results.push(row);
          });
        }
      }

      // Fetch service data if service fields selected
      if (serviceFields.length > 0 && results.length === 0) {
        const res = await fetch(`/api/reports/services?startDate=${startDate}&endDate=${endDate}`);
        if (res.ok) {
          const data = await res.json();
          (data.services || []).forEach((item: Record<string, unknown>) => {
            const service = item.service as Record<string, unknown>;
            const row: Record<string, unknown> = {};
            if (serviceFields.includes("service_name")) row.service_name = service?.name || "-";
            if (serviceFields.includes("service_price")) row.service_price = service?.price || 0;
            if (serviceFields.includes("service_duration")) row.service_duration = service?.duration || 0;
            results.push(row);
          });
        }
      }

      // Fetch staff data if staff fields selected
      if (staffFields.length > 0 && results.length === 0) {
        const res = await fetch(`/api/reports/staff-performance?startDate=${startDate}&endDate=${endDate}`);
        if (res.ok) {
          const data = await res.json();
          (data.staff || []).forEach((item: Record<string, unknown>) => {
            const staff = item.staff as Record<string, unknown>;
            const user = staff?.user as Record<string, unknown>;
            const appointments = item.appointments as Record<string, unknown>;
            const revenue = item.revenue as Record<string, unknown>;
            const row: Record<string, unknown> = {};
            if (staffFields.includes("staff_name")) row.staff_name = staff?.displayName || `${user?.firstName} ${user?.lastName}` || "-";
            if (staffFields.includes("staff_revenue")) row.staff_revenue = revenue?.total || 0;
            if (staffFields.includes("staff_appointments")) row.staff_appointments = appointments?.total || 0;
            results.push(row);
          });
        }
      }

      // Fetch revenue/transaction data if revenue fields selected
      if (revenueFields.length > 0 && results.length === 0) {
        const res = await fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}&limit=100`);
        if (res.ok) {
          const transactions = await res.json();
          (Array.isArray(transactions) ? transactions : []).forEach((txn: Record<string, unknown>) => {
            const row: Record<string, unknown> = {};
            if (revenueFields.includes("transaction_date")) {
              const date = txn.date || txn.createdAt;
              row.transaction_date = date ? new Date(date as string).toLocaleDateString() : "-";
            }
            if (revenueFields.includes("transaction_total")) row.transaction_total = Number(txn.totalAmount) || 0;
            if (revenueFields.includes("payment_method")) row.payment_method = txn.paymentMethod || "-";
            if (revenueFields.includes("tip_amount")) row.tip_amount = Number(txn.tipAmount) || 0;
            results.push(row);
          });
        }
      }

      setReportData(results);
      setHasRun(true);
    } catch (error) {
      console.error("Error running report:", error);
      alert("Failed to generate report");
    } finally {
      setIsRunning(false);
    }
  };

  const exportCSV = () => {
    if (reportData.length === 0) return;

    const headers = selectedFields.map(f => AVAILABLE_FIELDS.find(af => af.id === f)?.name || f);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row =>
        selectedFields.map(f => {
          const value = row[f];
          if (typeof value === "number") return value;
          return `"${String(value || "").replace(/"/g, '""')}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportPDF = () => {
    if (reportData.length === 0) return;

    // Create a printable HTML document
    const headers = selectedFields.map(f => AVAILABLE_FIELDS.find(af => af.id === f)?.name || f);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #e11d48; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${reportName}</h1>
        <div class="meta">
          <p>Date Range: ${dateRange.start || "Start"} to ${dateRange.end || "End"}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${reportData.length}</p>
        </div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>${selectedFields.map(f => {
                const value = row[f];
                const field = AVAILABLE_FIELDS.find(af => af.id === f);
                if (field?.type === "currency" && typeof value === "number") {
                  return `<td>$${value.toFixed(2)}</td>`;
                }
                return `<td>${value ?? "-"}</td>`;
              }).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>BeautyHQ Report - Generated by Report Builder</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const categories = [...new Set(AVAILABLE_FIELDS.map((f) => f.category))];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/reports")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Report Builder</h1>
            <p className="text-muted-foreground">Create custom reports with your data</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runReport}
            disabled={isRunning || selectedFields.length === 0}
            className="bg-rose-600 hover:bg-rose-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Running..." : "Run Report"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Field Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Available Fields</CardTitle>
            <CardDescription>Select fields to include in your report</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
              <TabsList className="w-full grid grid-cols-2">
                {categories.slice(0, 2).map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsList className="w-full grid grid-cols-2 mt-1">
                {categories.slice(2).map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories.map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-4">
                  <div className="space-y-2">
                    {AVAILABLE_FIELDS.filter((f) => f.category === cat).map((field) => (
                      <label
                        key={field.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => toggleField(field.id)}
                        />
                        <div>
                          <div className="font-medium text-sm">{field.name}</div>
                          <div className="text-xs text-muted-foreground">{field.type}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Report Configuration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Name */}
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, start: e.target.value });
                      setReportData([]);
                      setHasRun(false);
                    }}
                    className="pl-10"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, end: e.target.value });
                      setReportData([]);
                      setHasRun(false);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Selected Fields */}
            <div className="space-y-2">
              <Label>Selected Fields ({selectedFields.length})</Label>
              {selectedFields.length === 0 ? (
                <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                  Select fields from the left panel
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedFields.map((fieldId) => {
                    const field = AVAILABLE_FIELDS.find((f) => f.id === fieldId);
                    return (
                      <div
                        key={fieldId}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
                      >
                        {field?.name}
                        <button
                          onClick={() => toggleField(fieldId)}
                          className="hover:bg-rose-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Group By */}
            <div className="space-y-2">
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="staff">Staff Member</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Filters</Label>
                <Button variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </div>
              {filters.length === 0 ? (
                <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                  No filters applied. Click &quot;Add Filter&quot; to filter your data.
                </div>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={filter.field}
                        onValueChange={(value) => updateFilter(index, { field: value })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FIELDS.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(index, { operator: value })}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(index)}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="md:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Report Preview</CardTitle>
              <CardDescription>
                {hasRun ? `${reportData.length} records found` : "Run the report to see results"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={reportData.length === 0}
                onClick={exportCSV}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={reportData.length === 0}
                onClick={exportPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isRunning ? (
              <div className="min-h-[300px] flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-rose-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Generating report...</p>
                </div>
              </div>
            ) : selectedFields.length === 0 ? (
              <div className="min-h-[300px] flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select fields and run the report to see results</p>
                </div>
              </div>
            ) : !hasRun ? (
              <div className="min-h-[300px] flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click &quot;Run Report&quot; to generate your custom report</p>
                </div>
              </div>
            ) : reportData.length === 0 ? (
              <div className="min-h-[300px] flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data found for the selected criteria</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedFields.map(fieldId => {
                          const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
                          return (
                            <TableHead key={fieldId}>{field?.name || fieldId}</TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, idx) => (
                        <TableRow key={idx}>
                          {selectedFields.map(fieldId => {
                            const value = row[fieldId];
                            const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
                            return (
                              <TableCell key={fieldId}>
                                {field?.type === "currency" && typeof value === "number"
                                  ? formatCurrency(value)
                                  : String(value ?? "-")}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Download,
  Filter,
  Play,
  Plus,
  Save,
  Table,
  X,
  Calendar,
  DollarSign,
  Users,
  Scissors,
} from "lucide-react";

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
  const [reportName, setReportName] = useState("Untitled Report");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isRunning, setIsRunning] = useState(false);

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
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
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRunning(false);
  };

  const categories = [...new Set(AVAILABLE_FIELDS.map((f) => f.category))];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Report Builder</h1>
          <p className="text-muted-foreground">Create custom reports with your data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
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
            <Tabs defaultValue={categories[0]}>
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
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
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
              <CardDescription>Run the report to see results</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={selectedFields.length === 0}>
                <Table className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" disabled={selectedFields.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] flex items-center justify-center border border-dashed rounded-lg">
              {isRunning ? (
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-rose-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Generating report...</p>
                </div>
              ) : selectedFields.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select fields and run the report to see results</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click &quot;Run Report&quot; to generate your custom report</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

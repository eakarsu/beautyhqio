"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Mail,
  Calendar,
  Check,
} from "lucide-react";

interface ExportOptionsProps {
  reportType: string;
  reportTitle: string;
  onExport: (format: string, options?: ExportConfig) => void;
  availableFormats?: string[];
}

interface ExportConfig {
  format: string;
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
  email?: string;
  schedule?: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    email?: string;
  };
}

export function ExportOptions({
  reportType,
  reportTitle,
  onExport,
  availableFormats = ["csv", "xlsx", "pdf"],
}: ExportOptionsProps) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: "pdf",
    includeCharts: true,
  });
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: "09:00",
    email: "",
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async (format: string) => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailExport = async () => {
    if (!exportConfig.email) return;
    setIsExporting(true);
    try {
      await onExport("email", exportConfig);
      setShowEmailDialog(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleExport = async () => {
    setIsExporting(true);
    try {
      await onExport("schedule", {
        ...exportConfig,
        schedule: {
          ...scheduleConfig,
          email: scheduleConfig.email,
        },
      });
      setShowScheduleDialog(false);
    } finally {
      setIsExporting(false);
    }
  };

  const formatIcons: Record<string, React.ReactNode> = {
    csv: <FileSpreadsheet className="h-4 w-4" />,
    xlsx: <FileSpreadsheet className="h-4 w-4" />,
    pdf: <FileText className="h-4 w-4" />,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          {availableFormats.map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleQuickExport(format)}
            >
              {formatIcons[format]}
              <span className="ml-2">Export as {format.toUpperCase()}</span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowEmailDialog(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
            <DialogDescription>
              Send "{reportTitle}" to an email address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="recipient@email.com"
                value={exportConfig.email || ""}
                onChange={(e) =>
                  setExportConfig((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={exportConfig.format}
                onValueChange={(v) =>
                  setExportConfig((prev) => ({ ...prev, format: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeCharts"
                checked={exportConfig.includeCharts}
                onCheckedChange={(checked) =>
                  setExportConfig((prev) => ({
                    ...prev,
                    includeCharts: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="includeCharts" className="cursor-pointer">
                Include charts and graphs
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEmailExport}
              disabled={!exportConfig.email || isExporting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isExporting ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Automatically send "{reportTitle}" on a recurring schedule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={scheduleConfig.frequency}
                onValueChange={(v) =>
                  setScheduleConfig((prev) => ({ ...prev, frequency: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleConfig.frequency === "weekly" && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={scheduleConfig.dayOfWeek?.toString()}
                  onValueChange={(v) =>
                    setScheduleConfig((prev) => ({
                      ...prev,
                      dayOfWeek: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {scheduleConfig.frequency === "monthly" && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Select
                  value={scheduleConfig.dayOfMonth?.toString()}
                  onValueChange={(v) =>
                    setScheduleConfig((prev) => ({
                      ...prev,
                      dayOfMonth: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={scheduleConfig.time}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Send To</Label>
              <Input
                type="email"
                placeholder="recipient@email.com"
                value={scheduleConfig.email}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={exportConfig.format}
                onValueChange={(v) =>
                  setExportConfig((prev) => ({ ...prev, format: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleExport}
              disabled={!scheduleConfig.email || isExporting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {isExporting ? "Scheduling..." : "Schedule Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

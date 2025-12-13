"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Beaker, Plus, Edit, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";

interface Formula {
  id: string;
  serviceType: string;
  formula: string;
  notes?: string;
  lastUsed?: string;
  createdAt: string;
}

interface ServiceFormulaProps {
  clientId: string;
}

export function ServiceFormula({ clientId }: ServiceFormulaProps) {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [formData, setFormData] = useState({
    serviceType: "",
    formula: "",
    notes: "",
  });

  useEffect(() => {
    fetchFormulas();
  }, [clientId]);

  const fetchFormulas = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/formulas`);
      if (response.ok) {
        const data = await response.json();
        setFormulas(data);
      }
    } catch (error) {
      console.error("Error fetching formulas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingFormula
        ? `/api/clients/${clientId}/formulas/${editingFormula.id}`
        : `/api/clients/${clientId}/formulas`;
      const method = editingFormula ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchFormulas();
        handleClose();
      }
    } catch (error) {
      console.error("Error saving formula:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this formula?")) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/formulas/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchFormulas();
      }
    } catch (error) {
      console.error("Error deleting formula:", error);
    }
  };

  const handleEdit = (formula: Formula) => {
    setEditingFormula(formula);
    setFormData({
      serviceType: formula.serviceType,
      formula: formula.formula,
      notes: formula.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingFormula(null);
    setFormData({ serviceType: "", formula: "", notes: "" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Service Formulas
          </CardTitle>
          <CardDescription>Hair color formulas, treatments, and notes</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Formula
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFormula ? "Edit Formula" : "Add New Formula"}</DialogTitle>
              <DialogDescription>
                Record the formula used for this client&apos;s service
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  placeholder="e.g., Hair Color, Highlights, Perm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formula">Formula</Label>
                <Textarea
                  id="formula"
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  placeholder="e.g., 6N + 7N (50/50) with 20 vol developer"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Processing time, special instructions, etc."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-rose-600 hover:bg-rose-700">
                {editingFormula ? "Update" : "Save"} Formula
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading formulas...</div>
        ) : formulas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No formulas recorded yet</p>
            <p className="text-sm">Add color formulas and service notes for this client</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formulas.map((formula) => (
              <div
                key={formula.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {formula.serviceType}
                    </Badge>
                    <div className="font-mono text-sm bg-muted px-3 py-2 rounded-md">
                      {formula.formula}
                    </div>
                    {formula.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{formula.notes}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Added {format(new Date(formula.createdAt), "MMM d, yyyy")}</span>
                      {formula.lastUsed && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last used {format(new Date(formula.lastUsed), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(formula)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => handleDelete(formula.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

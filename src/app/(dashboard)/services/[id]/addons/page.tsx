"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface ServiceAddOn {
  id: string;
  name: string;
  price: string;
  duration: number;
}

interface Service {
  id: string;
  name: string;
  addOns: ServiceAddOn[];
}

export default function ManageAddonsPage() {
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ServiceAddOn | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: 15,
  });

  useEffect(() => {
    fetchService();
  }, [params.id]);

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/services/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setService(data);
      }
    } catch (error) {
      console.error("Error fetching service:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (addon?: ServiceAddOn) => {
    if (addon) {
      setEditingAddon(addon);
      setFormData({
        name: addon.name,
        price: String(addon.price),
        duration: addon.duration,
      });
    } else {
      setEditingAddon(null);
      setFormData({ name: "", price: "", duration: 15 });
    }
    setIsDialogOpen(true);
  };

  const handleSaveAddon = async () => {
    if (!service) return;
    setIsSaving(true);

    try {
      const url = editingAddon
        ? `/api/services/${service.id}/addons/${editingAddon.id}`
        : `/api/services/${service.id}/addons`;

      const response = await fetch(url, {
        method: editingAddon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price) || 0,
          duration: formData.duration,
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchService();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save add-on");
      }
    } catch (error) {
      console.error("Error saving add-on:", error);
      alert("Failed to save add-on");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddon = async (addonId: string) => {
    if (!service) return;
    if (!confirm("Are you sure you want to delete this add-on?")) return;

    try {
      const response = await fetch(`/api/services/${service.id}/addons/${addonId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchService();
      } else {
        alert("Failed to delete add-on");
      }
    } catch (error) {
      console.error("Error deleting add-on:", error);
      alert("Failed to delete add-on");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/services")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Service Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/services/${service.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Add-ons</h1>
            <p className="text-muted-foreground">{service.name}</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Add-on
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddon ? "Edit Add-on" : "New Add-on"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Deep conditioning treatment"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAddon}
                  className="flex-1"
                  disabled={isSaving || !formData.name || !formData.price}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add-ons for {service.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {service.addOns.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No add-ons yet. Click "Add Add-on" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {service.addOns.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell>{formatDuration(addon.duration)}</TableCell>
                    <TableCell>{formatCurrency(Number(addon.price))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(addon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAddon(addon.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

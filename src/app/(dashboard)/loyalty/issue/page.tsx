"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gift, Search } from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
}

export default function IssuePointsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    clientId: "",
    points: "",
    reason: "BONUS",
    description: "",
  });

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    }
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone.includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.points) {
      alert("Please select a client and enter points");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/loyalty/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formData.clientId,
          points: parseInt(formData.points),
          source: formData.reason,
          description: formData.description || `Manual points: ${formData.reason}`,
        }),
      });

      if (response.ok) {
        router.push("/loyalty");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to issue points");
      }
    } catch (error) {
      console.error("Error issuing points:", error);
      alert("Failed to issue points");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === formData.clientId);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Issue Loyalty Points</h1>
          <p className="text-muted-foreground">Manually award points to a client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Issue Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Client *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="pl-9"
                />
              </div>
              {searchQuery && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">No clients found</div>
                  ) : (
                    filteredClients.slice(0, 10).map((client) => (
                      <div
                        key={client.id}
                        className={`p-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 ${
                          formData.clientId === client.id ? "bg-slate-100" : ""
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, clientId: client.id });
                          setSearchQuery("");
                        }}
                      >
                        <p className="font-medium">{client.firstName} {client.lastName}</p>
                        <p className="text-sm text-slate-500">
                          {client.email || client.phone}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
              {selectedClient && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <p className="text-sm text-slate-500">{selectedClient.email || selectedClient.phone}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points to Award *</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData({ ...formData, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BONUS">Bonus Points</SelectItem>
                    <SelectItem value="BIRTHDAY">Birthday Bonus</SelectItem>
                    <SelectItem value="REFERRAL">Referral Reward</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a note about why these points are being issued..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={isLoading || !formData.clientId || !formData.points}
              >
                {isLoading ? "Issuing..." : "Issue Points"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

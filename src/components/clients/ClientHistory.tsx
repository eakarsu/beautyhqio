"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, DollarSign, Package, Star } from "lucide-react";

interface Appointment {
  id: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  status: string;
  services: Array<{
    service: {
      name: string;
      price: number;
    };
  }>;
  staff?: {
    displayName?: string;
  };
}

interface Transaction {
  id: string;
  createdAt: Date | string;
  totalAmount: number;
  status: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface ClientHistoryProps {
  appointments: Appointment[];
  transactions: Transaction[];
  loyaltyHistory?: Array<{
    id: string;
    createdAt: Date | string;
    points: number;
    type: string;
    description?: string;
  }>;
}

export function ClientHistory({ appointments, transactions, loyaltyHistory = [] }: ClientHistoryProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800",
    BOOKED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-yellow-100 text-yellow-800",
    PENDING: "bg-gray-100 text-gray-800",
  };

  return (
    <Tabs defaultValue="appointments" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="appointments" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Appointments
        </TabsTrigger>
        <TabsTrigger value="purchases" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Purchases
        </TabsTrigger>
        <TabsTrigger value="loyalty" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Loyalty
        </TabsTrigger>
      </TabsList>

      <TabsContent value="appointments">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No appointments yet</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {apt.services.map((s) => s.service.name).join(", ")}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatDate(apt.scheduledStart)} at {formatTime(apt.scheduledStart)}
                          </div>
                          {apt.staff?.displayName && (
                            <div className="text-sm text-muted-foreground">
                              with {apt.staff.displayName}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[apt.status] || "bg-gray-100"}>
                            {apt.status}
                          </Badge>
                          <span className="font-medium">
                            ${apt.services.reduce((sum, s) => sum + Number(s.service.price), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="purchases">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No purchases yet</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {formatDate(tx.createdAt)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {tx.lineItems.length} item(s)
                          </div>
                          <div className="mt-2 space-y-1">
                            {tx.lineItems.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="text-sm flex justify-between gap-4">
                                <span>{item.name} x{item.quantity}</span>
                                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {tx.lineItems.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{tx.lineItems.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[tx.status] || "bg-gray-100"}>
                            {tx.status}
                          </Badge>
                          <span className="font-semibold text-lg">
                            ${Number(tx.totalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="loyalty">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loyalty Points History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {loyaltyHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No loyalty activity yet</p>
              ) : (
                <div className="space-y-3">
                  {loyaltyHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium">{entry.description || entry.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(entry.createdAt)}
                        </div>
                      </div>
                      <span className={`font-semibold ${entry.points > 0 ? "text-green-600" : "text-red-600"}`}>
                        {entry.points > 0 ? "+" : ""}{entry.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

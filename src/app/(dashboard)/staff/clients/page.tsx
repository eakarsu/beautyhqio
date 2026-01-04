"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, Mail, Calendar } from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  lastVisit: string | null;
  totalVisits: number;
}

export default function MyClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyClients();
  }, []);

  const fetchMyClients = async () => {
    try {
      const response = await fetch("/api/staff/me/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Clients</h1>
        <p className="text-muted-foreground">Clients you have served</p>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No clients yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clients will appear here after you complete appointments with them
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                    <span className="text-rose-600 font-medium">
                      {getInitials(client.firstName, client.lastName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {client.firstName} {client.lastName}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <div className="text-muted-foreground">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {client.totalVisits} visits
                  </div>
                  {client.lastVisit && (
                    <div className="text-muted-foreground">
                      Last: {new Date(client.lastVisit).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

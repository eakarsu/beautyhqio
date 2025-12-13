"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, Star } from "lucide-react";
import Link from "next/link";

interface ClientCardProps {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    profileImage?: string | null;
    loyaltyTier?: string | null;
    loyaltyPoints?: number;
    lastVisit?: Date | string | null;
    totalVisits?: number;
    totalSpent?: number;
  };
  onSelect?: (client: ClientCardProps["client"]) => void;
}

export function ClientCard({ client, onSelect }: ClientCardProps) {
  const initials = `${client.firstName?.[0] || ""}${client.lastName?.[0] || ""}`.toUpperCase();

  const tierColors: Record<string, string> = {
    BRONZE: "bg-orange-100 text-orange-800",
    SILVER: "bg-gray-100 text-gray-800",
    GOLD: "bg-yellow-100 text-yellow-800",
    PLATINUM: "bg-purple-100 text-purple-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect?.(client)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.profileImage || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/clients/${client.id}`} className="font-semibold hover:underline truncate">
                {client.firstName} {client.lastName}
              </Link>
              {client.loyaltyTier && (
                <Badge className={tierColors[client.loyaltyTier] || "bg-gray-100"}>
                  {client.loyaltyTier}
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
              {client.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{client.totalVisits || 0} visits</span>
          </div>
          {client.loyaltyPoints !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>{client.loyaltyPoints} pts</span>
            </div>
          )}
          {client.totalSpent !== undefined && (
            <span className="font-medium">${client.totalSpent.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

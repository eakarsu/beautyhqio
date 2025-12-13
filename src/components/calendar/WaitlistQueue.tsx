"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Check, X, ArrowRight } from "lucide-react";

interface WaitlistEntry {
  id: string;
  clientName?: string | null;
  clientPhone?: string | null;
  partySize: number;
  estimatedWait: number;
  notes?: string | null;
  status: string;
  checkInTime: Date | string;
  service?: {
    name: string;
  } | null;
  client?: {
    firstName: string;
    lastName: string;
  } | null;
}

interface WaitlistQueueProps {
  entries: WaitlistEntry[];
  onSeat: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateWait: (id: string, minutes: number) => void;
}

export function WaitlistQueue({ entries, onSeat, onRemove, onUpdateWait }: WaitlistQueueProps) {
  const waitingEntries = entries.filter((e) => e.status === "WAITING");
  const seatedEntries = entries.filter((e) => e.status === "SEATED");

  const formatWaitTime = (checkInTime: Date | string) => {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - checkIn.getTime()) / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes === 1) return "1 min";
    if (diffMinutes < 60) return `${diffMinutes} mins`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getWaitColor = (checkInTime: Date | string, estimatedWait: number) => {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - checkIn.getTime()) / 60000);

    if (diffMinutes > estimatedWait * 1.5) return "text-red-600 bg-red-50";
    if (diffMinutes > estimatedWait) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Walk-in Queue</CardTitle>
          <Badge variant="outline">{waitingEntries.length} waiting</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {waitingEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No one waiting</p>
          ) : (
            <div className="space-y-3">
              {waitingEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {entry.client
                            ? `${entry.client.firstName[0]}${entry.client.lastName[0]}`
                            : entry.clientName?.[0] || "W"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {entry.client
                            ? `${entry.client.firstName} ${entry.client.lastName}`
                            : entry.clientName || "Walk-in"}
                        </p>
                        {entry.service && (
                          <p className="text-sm text-muted-foreground">{entry.service.name}</p>
                        )}
                        {entry.partySize > 1 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Party of {entry.partySize}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getWaitColor(entry.checkInTime, entry.estimatedWait)}>
                        <Clock className="h-3 w-3 mr-1" />
                        {formatWaitTime(entry.checkInTime)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Est: {entry.estimatedWait} min
                      </p>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded p-2">
                      {entry.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateWait(entry.id, entry.estimatedWait + 5)}
                    >
                      +5 min
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => onRemove(entry.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Button size="sm" onClick={() => onSeat(entry.id)}>
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Seat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {seatedEntries.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Recently Seated</h4>
              <div className="space-y-2">
                {seatedEntries.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {entry.client
                          ? `${entry.client.firstName} ${entry.client.lastName}`
                          : entry.clientName}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Seated
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

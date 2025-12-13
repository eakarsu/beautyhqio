"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, ArrowLeft, Clock, Users, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WaitlistEntry {
  id: string;
  position: number;
  estimatedWait?: number;
  status: string;
  addedAt: string;
  client?: {
    firstName: string;
    lastName: string;
  };
}

export default function KioskWaitlistPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
    const interval = setInterval(fetchWaitlist, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitlist = async () => {
    try {
      const response = await fetch("/api/waitlist");
      if (response.ok) {
        const data = await response.json();
        setEntries(data.filter((e: WaitlistEntry) => e.status === "WAITING"));
      }
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      // Demo data
      setEntries([
        {
          id: "1",
          position: 1,
          estimatedWait: 10,
          status: "WAITING",
          addedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          client: { firstName: "John", lastName: "S." },
        },
        {
          id: "2",
          position: 2,
          estimatedWait: 25,
          status: "WAITING",
          addedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          client: { firstName: "Maria", lastName: "G." },
        },
        {
          id: "3",
          position: 3,
          estimatedWait: 40,
          status: "WAITING",
          addedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          client: { firstName: "Alex", lastName: "W." },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getClientName = (entry: WaitlistEntry) => {
    if (entry.client) {
      return `${entry.client.firstName} ${entry.client.lastName}`;
    }
    return "Guest";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push("/kiosk")}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-600 rounded-full mb-4">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Current Waitlist</h1>
          <p className="text-xl text-muted-foreground mt-2">
            See where you are in line
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-rose-600">
                {entries.length}
              </div>
              <div className="text-muted-foreground">People Waiting</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-rose-600">
                ~{entries.length > 0 ? entries[entries.length - 1].estimatedWait || 30 : 0}
              </div>
              <div className="text-muted-foreground">Minutes Max Wait</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={fetchWaitlist}
                className="h-auto py-4"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading waitlist...
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Wait!</h2>
              <p className="text-xl text-muted-foreground">
                Walk right in - we're ready for you!
              </p>
              <Button
                className="mt-6 bg-rose-600 hover:bg-rose-700"
                size="lg"
                onClick={() => router.push("/kiosk/walkin")}
              >
                Sign Up Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <Card
                key={entry.id}
                className={index === 0 ? "border-green-500 bg-green-50" : ""}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 font-bold text-2xl">
                      {entry.position}
                    </div>
                    <div>
                      <div className="text-xl font-medium">{getClientName(entry)}</div>
                      <div className="text-muted-foreground">
                        Waiting {formatDistanceToNow(new Date(entry.addedAt))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {index === 0 ? (
                      <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                        You're Next!
                      </Badge>
                    ) : (
                      <div>
                        <div className="text-2xl font-bold text-rose-600">
                          ~{entry.estimatedWait || 15} min
                        </div>
                        <div className="text-sm text-muted-foreground">estimated wait</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/kiosk/walkin")}
          >
            Join the Waitlist
          </Button>
        </div>
      </div>
    </div>
  );
}
